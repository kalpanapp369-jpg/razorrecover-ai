import { RecoveryCase, PaymentRecord } from '../../types';
import { RecoveryActionRecord, RecoveryActionType } from './recoveryActionSchemas';
import { env } from '../../config/env';

export interface PolicyEvaluationResult {
  allowed: boolean;
  reason?: string;
  suggested_action_type?: RecoveryActionType;
  requires_approval: boolean;
  max_attempts: number;
  cooldown_seconds: number;
}

export const recoveryPolicyService = {
  /**
   * Evaluates recovery action eligibility for a case and payment.
   */
  evaluateActionEligibility(
    caseItem: RecoveryCase,
    paymentItem: PaymentRecord | null,
    actionType: RecoveryActionType,
    existingActions: RecoveryActionRecord[] = []
  ): PolicyEvaluationResult {
    // 1. Safety Check: Fail closed if LIVE credentials are used during Phase 5 test mode
    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
      return {
        allowed: false,
        reason: 'CRITICAL SAFETY GUARD: Live Razorpay credentials detected. Execution halted (fail-closed).',
        requires_approval: true,
        max_attempts: 0,
        cooldown_seconds: 0,
      };
    }

    if (env.RECOVERY_EXECUTION_MODE === 'LIVE') {
      return {
        allowed: false,
        reason: 'CRITICAL SAFETY GUARD: Live execution mode is strictly disabled. Only TEST / SIMULATION mode allowed.',
        requires_approval: true,
        max_attempts: 0,
        cooldown_seconds: 0,
      };
    }

    // 2. Terminal Case Status Check
    if (caseItem.status === 'RECOVERED') {
      return {
        allowed: false,
        reason: 'Case is already successfully RECOVERED. No further recovery action allowed.',
        requires_approval: false,
        max_attempts: 0,
        cooldown_seconds: 0,
      };
    }

    if (caseItem.status === 'STOPPED') {
      return {
        allowed: false,
        reason: 'Case has been STOPPED by Admin. Reopen or create a new case before taking action.',
        requires_approval: true,
        max_attempts: 0,
        cooldown_seconds: 0,
      };
    }

    // 3. Payment Status Check
    if (paymentItem && (paymentItem.status === 'SUCCESS' || paymentItem.status === 'RECOVERED')) {
      return {
        allowed: false,
        reason: `Payment ${paymentItem.transaction_id} is already in successful status '${paymentItem.status}'.`,
        requires_approval: false,
        max_attempts: 0,
        cooldown_seconds: 0,
      };
    }

    // 4. Attempt Counting & Limits
    const completedAttempts = existingActions.filter(
      (a) => a.action_type === actionType && (a.status === 'SUCCEEDED' || a.status === 'FAILED')
    ).length;

    const maxAttempts = 3;
    if (completedAttempts >= maxAttempts) {
      return {
        allowed: false,
        reason: `Maximum recovery attempts (${maxAttempts}) reached for ${actionType}. Escalated to MANUAL_REVIEW.`,
        suggested_action_type: 'MANUAL_REVIEW',
        requires_approval: true,
        max_attempts: maxAttempts,
        cooldown_seconds: 0,
      };
    }

    // 5. High-Value & Low-Confidence Approval Policy
    const isHighValue = Number(caseItem.amount_at_risk) > 25000;
    const isLowConfidence = Number(caseItem.confidence) < 60;
    const requiresApproval = isHighValue || isLowConfidence || Boolean(caseItem.requires_human_approval);

    // 6. Action-Specific Cooldown
    const cooldownSeconds = 60; // 60s test cooldown between retries

    return {
      allowed: true,
      requires_approval: requiresApproval,
      max_attempts: maxAttempts,
      cooldown_seconds: cooldownSeconds,
    };
  },
};
