import { dataStore } from './dataStore';
import { diagnosisEngine } from './diagnosisEngine';

/**
 * Webhook Processor Service (Phase 2)
 * 
 * Orchestrates event ingestion, idempotent storage, failure diagnosis,
 * recovery case creation, and immutable audit trail recording.
 */

export interface WebhookProcessResult {
  success: boolean;
  eventId: string;
  eventType: string;
  actionTaken: string;
  caseId?: string;
  paymentId?: string;
}

class WebhookProcessor {
  /**
   * Processes a verified incoming Razorpay webhook payload.
   */
  public async processEvent(
    eventType: string,
    eventId: string,
    payload: any,
    signature?: string
  ): Promise<WebhookProcessResult> {
    // 1. Idempotency Check
    const alreadyProcessed = await dataStore.isWebhookProcessed(eventId);
    if (alreadyProcessed) {
      console.log(`[Webhook Processor] Skipping duplicate event ${eventId} (${eventType})`);
      return {
        success: true,
        eventId,
        eventType,
        actionTaken: 'DUPLICATE_IGNORED',
      };
    }

    // 2. Persist event into webhook_events log
    await dataStore.recordWebhookEvent({
      event_id: eventId,
      event_type: eventType,
      payload,
      signature,
      is_valid: true,
      processed: true,
    });

    // 3. Dispatch to dedicated event handlers
    switch (eventType) {
      case 'payment.failed':
        return await this.handlePaymentFailed(eventId, payload);

      case 'payment.captured':
      case 'payment.authorized':
      case 'order.paid':
        return await this.handlePaymentSuccess(eventId, eventType, payload);

      case 'subscription.halted':
      case 'subscription.paused':
        return await this.handleSubscriptionHalted(eventId, payload);

      case 'payment_link.paid':
      case 'invoice.paid':
        return await this.handleInvoicePaid(eventId, payload);

      default:
        console.log(`[Webhook Processor] Unhandled event type '${eventType}' recorded idempotently.`);
        return {
          success: true,
          eventId,
          eventType,
          actionTaken: 'RECORDED_UNHANDLED',
        };
    }
  }

  /**
   * Handles payment.failed events from Razorpay.
   */
  private async handlePaymentFailed(eventId: string, payload: any): Promise<WebhookProcessResult> {
    const paymentEntity = payload?.payload?.payment?.entity || payload?.payment?.entity || {};
    const transactionId = paymentEntity.id || `pay_failed_${Date.now()}`;
    const rawAmount = Number(paymentEntity.amount) || 0;
    // Razorpay amounts are in paise (e.g. 50000 paise = ₹500)
    const amount = rawAmount > 0 && rawAmount % 100 === 0 ? rawAmount / 100 : rawAmount;
    const currency = paymentEntity.currency || 'INR';
    const method = paymentEntity.method || 'card';
    const errorCode = paymentEntity.error_code || 'GATEWAY_ERROR';
    const errorDescription = paymentEntity.error_description || 'Payment was declined by payment gateway';
    const cardIssuer = paymentEntity.card?.issuer || paymentEntity.bank || 'Bank Gateway';
    const cardNetwork = paymentEntity.card?.network;

    console.log(`[Webhook Processor] Ingesting Payment Failure: ${transactionId} (₹${amount}) - Code: ${errorCode}`);

    // Create or Update Payment Record
    const paymentRecord = await dataStore.createOrUpdatePayment({
      transaction_id: transactionId,
      amount,
      currency,
      status: 'FAILED',
      gateway: 'Razorpay',
      payment_method: `${method.toUpperCase()} (${cardIssuer})`,
      error_code: errorCode,
      error_description: errorDescription,
      attempts_count: Number(paymentEntity.attempts || 1),
    });

    // Run AI Failure Diagnosis Engine
    const diagnosis = diagnosisEngine.diagnosePaymentFailure({
      amount,
      currency,
      errorCode,
      errorDescription,
      errorSource: paymentEntity.error_source,
      errorStep: paymentEntity.error_step,
      errorReason: paymentEntity.error_reason,
      paymentMethod: method,
      cardIssuer,
      cardNetwork,
      attemptsCount: paymentRecord.attempts_count,
    });

    // Generate Case ID
    const caseId = `REC-${transactionId.slice(-6).toUpperCase()}`;

    // Create or Update Recovery Case
    const recoveryCase = await dataStore.createOrUpdateCase({
      case_id: caseId,
      payment_id: paymentRecord.id,
      issue_type: diagnosis.issueType,
      amount_at_risk: amount,
      risk_score: diagnosis.riskScore,
      risk_level: diagnosis.riskLevel,
      root_cause: diagnosis.rootCause,
      confidence: diagnosis.confidence,
      recommended_action: diagnosis.recommendedAction,
      recovery_probability: diagnosis.recoveryProbability,
      expected_recovery: diagnosis.expectedRecovery,
      status: diagnosis.requiresHumanApproval ? 'PENDING_APPROVAL' : 'RECOMMENDED',
      requires_human_approval: diagnosis.requiresHumanApproval,
      current_step: diagnosis.requiresHumanApproval
        ? 'Awaiting human-in-the-loop sign-off for high-value recovery policy'
        : 'Autonomous recovery strategy diagnosed & queued for retry',
      last_action: 'Ingested via Razorpay payment.failed webhook',
    });

    // Record Immutable Audit Log
    await dataStore.addAuditLog({
      actor_id: 'razorpay-webhook-engine',
      actor_email: 'telemetry@razorrecover.ai',
      actor_role: 'SYSTEM',
      action: 'PAYMENT_FAILURE_INGESTED',
      entity_type: 'RECOVERY_CASE',
      entity_id: recoveryCase.id,
      new_state: {
        case_id: recoveryCase.case_id,
        transaction_id: transactionId,
        amount_at_risk: amount,
        root_cause: diagnosis.rootCause,
        risk_level: diagnosis.riskLevel,
        status: recoveryCase.status,
      },
    });

    return {
      success: true,
      eventId,
      eventType: 'payment.failed',
      actionTaken: 'CASE_CREATED_FROM_PAYMENT_FAILURE',
      caseId: recoveryCase.case_id,
      paymentId: transactionId,
    };
  }

  /**
   * Handles payment.captured, payment.authorized, and order.paid events.
   */
  private async handlePaymentSuccess(eventId: string, eventType: string, payload: any): Promise<WebhookProcessResult> {
    const paymentEntity = payload?.payload?.payment?.entity || payload?.payment?.entity || {};
    const transactionId = paymentEntity.id || `pay_${Date.now()}`;
    const rawAmount = Number(paymentEntity.amount) || 0;
    const amount = rawAmount > 0 && rawAmount % 100 === 0 ? rawAmount / 100 : rawAmount;

    console.log(`[Webhook Processor] Ingesting Payment Settlement: ${transactionId} (₹${amount}) - ${eventType}`);

    // Update payment record to RECOVERED / CAPTURED
    await dataStore.createOrUpdatePayment({
      transaction_id: transactionId,
      amount,
      status: 'RECOVERED',
      error_code: undefined,
      error_description: 'Successfully captured/recovered via Razorpay',
    });

    // Check if there is an open recovery case for this payment
    const cases = await dataStore.getCases();
    const matchedCase = cases.find(c => c.case_id.includes(transactionId.slice(-6).toUpperCase()) || c.payment_id === transactionId);

    if (matchedCase && matchedCase.status !== 'RECOVERED') {
      await dataStore.updateCaseStatus(matchedCase.id, 'RECOVERED', `Automatically resolved upon ${eventType} settlement`);
      console.log(`[Webhook Processor] Recovery Case ${matchedCase.case_id} marked as RECOVERED!`);
    }

    // Record Audit Log
    await dataStore.addAuditLog({
      actor_id: 'razorpay-webhook-engine',
      actor_email: 'telemetry@razorrecover.ai',
      actor_role: 'SYSTEM',
      action: 'PAYMENT_SETTLED_AND_RECOVERED',
      entity_type: 'PAYMENT',
      entity_id: transactionId,
      new_state: {
        transaction_id: transactionId,
        amount,
        status: 'RECOVERED',
        event_type: eventType,
      },
    });

    return {
      success: true,
      eventId,
      eventType,
      actionTaken: 'PAYMENT_SETTLED',
      paymentId: transactionId,
    };
  }

  /**
   * Handles subscription.halted events.
   */
  private async handleSubscriptionHalted(eventId: string, payload: any): Promise<WebhookProcessResult> {
    const subEntity = payload?.payload?.subscription?.entity || payload?.subscription?.entity || {};
    const subCode = subEntity.id || `sub_${Date.now()}`;
    const rawAmount = Number(subEntity.plan_amount || subEntity.amount) || 24000;
    const amount = rawAmount > 0 && rawAmount % 100 === 0 ? rawAmount / 100 : rawAmount;

    console.log(`[Webhook Processor] Ingesting Subscription Churn Warning: ${subCode} (₹${amount})`);

    const caseId = `REC-SUB-${subCode.slice(-4).toUpperCase()}`;

    const recoveryCase = await dataStore.createOrUpdateCase({
      case_id: caseId,
      issue_type: 'SUBSCRIPTION_FAILURE',
      amount_at_risk: amount,
      risk_score: 82.0,
      risk_level: 'HIGH',
      root_cause: `Recurring auto-debit failed on Razorpay mandate (${subCode}). Subscription marked as halted.`,
      confidence: 96.0,
      recommended_action: 'Initiate Dunning Stage 1: Send WhatsApp interactive payment retry prompt with UPI AutoPay fallback',
      recovery_probability: 79.0,
      expected_recovery: Math.round(amount * 0.79),
      status: 'RECOMMENDED',
      requires_human_approval: amount >= 25000,
      current_step: 'Dunning sequence triggered; awaiting customer payment instrument update',
      last_action: 'Ingested via subscription.halted webhook',
    });

    await dataStore.addAuditLog({
      actor_id: 'razorpay-webhook-engine',
      actor_email: 'telemetry@razorrecover.ai',
      actor_role: 'SYSTEM',
      action: 'SUBSCRIPTION_HALTED_INGESTED',
      entity_type: 'RECOVERY_CASE',
      entity_id: recoveryCase.id,
      new_state: {
        case_id: recoveryCase.case_id,
        subscription_code: subCode,
        amount_at_risk: amount,
        status: recoveryCase.status,
      },
    });

    return {
      success: true,
      eventId,
      eventType: 'subscription.halted',
      actionTaken: 'SUBSCRIPTION_RECOVERY_CASE_CREATED',
      caseId: recoveryCase.case_id,
    };
  }

  /**
   * Handles payment_link.paid and invoice.paid events.
   */
  private async handleInvoicePaid(eventId: string, payload: any): Promise<WebhookProcessResult> {
    const linkEntity = payload?.payload?.payment_link?.entity || payload?.payload?.invoice?.entity || {};
    const invoiceId = linkEntity.id || `inv_${Date.now()}`;
    const rawAmount = Number(linkEntity.amount_paid || linkEntity.amount) || 0;
    const amount = rawAmount > 0 && rawAmount % 100 === 0 ? rawAmount / 100 : rawAmount;

    console.log(`[Webhook Processor] Ingesting Invoice/Link Settlement: ${invoiceId} (₹${amount})`);

    // Audit log
    await dataStore.addAuditLog({
      actor_id: 'razorpay-webhook-engine',
      actor_email: 'telemetry@razorrecover.ai',
      actor_role: 'SYSTEM',
      action: 'INVOICE_RECOVERED_VIA_PAYMENT_LINK',
      entity_type: 'INVOICE',
      entity_id: invoiceId,
      new_state: {
        invoice_id: invoiceId,
        amount_recovered: amount,
        status: 'PAID',
      },
    });

    return {
      success: true,
      eventId,
      eventType: 'payment_link.paid',
      actionTaken: 'INVOICE_SETTLED',
    };
  }
}

export const webhookProcessor = new WebhookProcessor();
