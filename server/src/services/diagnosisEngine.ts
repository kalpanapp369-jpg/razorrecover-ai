import { IssueType, RiskLevel } from '../types';

/**
 * Diagnosis Engine (Phase 2)
 * 
 * Analyzes Razorpay payment failure telemetry and checkout dropoffs.
 * Produces structured root cause diagnoses, AI confidence ratings,
 * recovery probabilities, and safe actionable next steps.
 */

export interface DiagnosisInput {
  amount: number;
  currency?: string;
  errorCode?: string;
  errorDescription?: string;
  errorSource?: string;
  errorStep?: string;
  errorReason?: string;
  paymentMethod?: string;
  cardIssuer?: string;
  cardNetwork?: string;
  attemptsCount?: number;
  customerHistory?: {
    lifetimeValue?: number;
    previousRecoveries?: number;
    disputeCount?: number;
  };
}

export interface DiagnosisResult {
  issueType: IssueType;
  rootCause: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  recoveryProbability: number;
  expectedRecovery: number;
  recommendedAction: string;
  requiresHumanApproval: boolean;
  recoveryStrategy: 'RETRY_TEMPORAL' | 'ALTERNATIVE_METHOD' | 'WHATSAPP_LINK' | 'DUNNING_GRACE' | 'MANUAL_INTERVENTION';
}

export const diagnosisEngine = {
  /**
   * Diagnoses a payment failure and computes recovery intelligence.
   */
  diagnosePaymentFailure(input: DiagnosisInput): DiagnosisResult {
    const amount = Number(input.amount) || 0;
    const errorCode = (input.errorCode || '').toUpperCase();
    const errorDesc = (input.errorDescription || '').toLowerCase();
    const method = (input.paymentMethod || '').toLowerCase();
    const attempts = input.attemptsCount || 1;

    let rootCause = 'Transaction declined by payment network';
    let issueType: IssueType = 'PAYMENT_FAILURE';
    let recoveryStrategy: DiagnosisResult['recoveryStrategy'] = 'ALTERNATIVE_METHOD';
    let recoveryProbability = 75.0;
    let confidence = 90.0;
    let recommendedAction = 'Dispatch instant WhatsApp payment rescue link with alternate payment options';

    // 1. Bank Downtime / Technical Timeout
    if (
      errorCode.includes('GATEWAY') ||
      errorCode.includes('TIMEOUT') ||
      errorCode.includes('DOWNTIME') ||
      errorDesc.includes('timeout') ||
      errorDesc.includes('technical') ||
      errorDesc.includes('temporarily unavailable')
    ) {
      rootCause = `Bank network timeout at issuer gateway (${input.cardIssuer || 'Issuing Bank'}). Gateway service temporary degradation.`;
      recoveryStrategy = 'RETRY_TEMPORAL';
      recoveryProbability = 89.5;
      confidence = 94.0;
      recommendedAction = 'Autonomous smart retry scheduled in 35 minutes after bank telemetry stabilizes; fallback to UPI AutoPay if unrecovered';
    }
    // 2. Insufficient Funds / Card Limit Exceeded
    else if (
      errorCode.includes('INSUFFICIENT') ||
      errorCode.includes('LIMIT_EXCEEDED') ||
      errorDesc.includes('insufficient') ||
      errorDesc.includes('limit') ||
      errorDesc.includes('balance')
    ) {
      rootCause = 'Card daily limit exceeded or insufficient account balance on primary payment instrument';
      recoveryStrategy = 'ALTERNATIVE_METHOD';
      recoveryProbability = 78.0;
      confidence = 92.5;
      recommendedAction = 'Send 1-click Razorpay checkout link supporting UPI AutoPay, NetBanking & Split Payment';
    }
    // 3. 3DS Authentication / OTP Dropoff
    else if (
      errorCode.includes('AUTH') ||
      errorCode.includes('OTP') ||
      errorDesc.includes('authentication') ||
      errorDesc.includes('otp') ||
      errorDesc.includes('abandoned')
    ) {
      issueType = 'CHECKOUT_ABANDONMENT';
      rootCause = 'Customer dropped off during 3D Secure OTP verification flow';
      recoveryStrategy = 'WHATSAPP_LINK';
      recoveryProbability = 84.0;
      confidence = 91.0;
      recommendedAction = 'Send automated WhatsApp rescue notification with pre-filled cart & 1-click checkout recovery';
    }
    // 4. Expired / Invalid Card
    else if (
      errorCode.includes('EXPIRED') ||
      errorCode.includes('INVALID') ||
      errorDesc.includes('expired') ||
      errorDesc.includes('invalid card')
    ) {
      rootCause = 'Primary payment instrument has expired or card details are invalid';
      recoveryStrategy = 'ALTERNATIVE_METHOD';
      recoveryProbability = 68.0;
      confidence = 95.0;
      recommendedAction = 'Request updated payment instrument via secured customer self-service portal';
    }

    // Risk Score Computation (0 - 100)
    let riskScore = 40.0;
    if (amount > 100000) riskScore += 35;
    else if (amount > 25000) riskScore += 20;
    else if (amount > 5000) riskScore += 10;

    if (attempts >= 3) riskScore += 20;
    else if (attempts === 2) riskScore += 10;

    if (recoveryProbability < 70) riskScore += 15;

    riskScore = Math.min(99.0, Math.max(10.0, Number(riskScore.toFixed(1))));

    // Risk Level
    let riskLevel: RiskLevel = 'LOW';
    if (riskScore >= 85) riskLevel = 'CRITICAL';
    else if (riskScore >= 65) riskLevel = 'HIGH';
    else if (riskScore >= 45) riskLevel = 'MEDIUM';

    // High Value & High Risk Guardrail: Require Human Approval for amounts >= ₹25,000 or Critical Risk
    const requiresHumanApproval = amount >= 25000 || riskLevel === 'CRITICAL';

    const expectedRecovery = Math.round((amount * recoveryProbability) / 100);

    return {
      issueType,
      rootCause,
      riskScore,
      riskLevel,
      confidence,
      recoveryProbability,
      expectedRecovery,
      recommendedAction,
      requiresHumanApproval,
      recoveryStrategy,
    };
  },
};
