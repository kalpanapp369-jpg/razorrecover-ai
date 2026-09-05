import { Router, Request, Response } from 'express';
import { razorpayService } from '../services/razorpay/razorpayService';
import { webhookProcessor } from '../services/webhookProcessor';

const router = Router();

/**
 * POST /api/webhooks/razorpay
 * 
 * Razorpay Webhook Ingestion, Signature Verification & Event Ingestion Pipeline
 * 
 * Architecture:
 * 1. Preserves unparsed rawBody for cryptographic HMAC-SHA256 signature verification.
 * 2. Validates 'x-razorpay-signature' header against RAZORPAY_WEBHOOK_SECRET.
 * 3. Rejects untrusted or forged requests with 400/401.
 * 4. Idempotently dispatches event to webhookProcessor (payment.failed, order.paid, subscription.halted, invoice.paid).
 * 5. Creates/updates payments, recovery cases, and immutable audit logs.
 */
router.post('/razorpay', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = (req as any).id || (req.headers['x-request-id'] as string) || `req_${Date.now()}`;
  const event = req.body?.event || 'unknown_event';
  const eventId = (req.headers['x-razorpay-event-id'] as string) || req.body?.event_id || `evt_${Date.now()}`;
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  console.log(JSON.stringify({
    telemetry: 'webhook_received',
    requestId,
    eventId,
    eventType: event,
    timestamp: new Date().toISOString(),
  }));

  // Require and verify cryptographic signature
  if (process.env.RAZORPAY_WEBHOOK_SECRET) {
    if (!signature) {
      console.warn(JSON.stringify({
        telemetry: 'webhook_signature_failed',
        requestId,
        eventId,
        eventType: event,
        reason: 'Missing x-razorpay-signature header',
      }));
      return res.status(400).json({
        status: 'error',
        message: 'Missing x-razorpay-signature header',
        requestId,
      });
    }

    const isValid = razorpayService.validateWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn(JSON.stringify({
        telemetry: 'webhook_signature_invalid',
        requestId,
        eventId,
        eventType: event,
        reason: 'Invalid HMAC-SHA256 signature',
      }));
      return res.status(401).json({
        status: 'error',
        message: 'Invalid webhook signature',
        requestId,
      });
    }
  }

  try {
    // Process event into dataStore, payments, recovery_cases, audit_logs & webhook_events
    const result = await webhookProcessor.processEvent(event, eventId, req.body, signature);
    const durationMs = Date.now() - startTime;

    console.log(JSON.stringify({
      telemetry: 'webhook_processed',
      requestId,
      eventId,
      eventType: event,
      actionTaken: result.actionTaken,
      caseId: result.caseId || null,
      durationMs,
      status: 'SUCCESS',
    }));

    return res.status(200).json({
      status: 'ok',
      received: true,
      event,
      eventId,
      actionTaken: result.actionTaken,
      caseId: result.caseId || null,
      paymentId: result.paymentId || null,
      signatureVerified: Boolean(signature && process.env.RAZORPAY_WEBHOOK_SECRET),
      durationMs,
      requestId,
      message: 'Webhook processed and recovery telemetry updated successfully',
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error(JSON.stringify({
      telemetry: 'webhook_error',
      requestId,
      eventId,
      eventType: event,
      durationMs,
      error: err.message,
    }));
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while processing webhook event',
      requestId,
    });
  }
});

export default router;
