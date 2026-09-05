import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';
import { 
  geminiDiagnosisSchema, 
  GeminiDiagnosisOutput, 
  AiDiagnosisPayload 
} from './geminiSchemas';
import { diagnosisEngine } from '../diagnosisEngine';

export const DIAGNOSIS_PROMPT_VERSION = 'v1.0-fintech-diagnostics';

// Sanitization: Strips credentials, auth tokens, passwords, and raw sensitive PAN/CVV/OTP data
function sanitizePayload(input: AiDiagnosisPayload): Record<string, any> {
  const safeData: Record<string, any> = {
    payment_id: input.payment_id,
    amount: input.amount,
    currency: input.currency || 'INR',
    payment_method: input.payment_method || 'Unknown',
    gateway: input.gateway || 'Razorpay',
    error_code: input.error_code || 'N/A',
    error_description: input.error_description || 'N/A',
    attempts_count: input.attempts_count || 1,
    customer_tier: input.customer_tier || 'Standard',
  };

  // Strip any accidental credential strings
  for (const key of Object.keys(safeData)) {
    if (typeof safeData[key] === 'string') {
      safeData[key] = safeData[key]
        .replace(/rzp_(live|test)_[a-zA-Z0-9]+/gi, '[REDACTED_KEY]')
        .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_TOKEN]')
        .replace(/\b\d{16}\b/g, '[REDACTED_CARD_PAN]')
        .replace(/\b\d{3,4}\b(?=.*(?:cvv|cvc|otp))/gi, '[REDACTED_SECRET]');
    }
  }

  return safeData;
}

export const geminiService = {
  /**
   * Diagnoses a payment failure using Google Gemini AI, returning structured, validated output.
   * Gracefully falls back to local deterministic rule-based diagnosis if Gemini is unreachable or unconfigured.
   */
  async diagnosePaymentFailure(payload: AiDiagnosisPayload): Promise<{
    diagnosis: GeminiDiagnosisOutput;
    diagnosis_source: 'GEMINI_AI' | 'RULE_BASED_FALLBACK';
    model: string;
    prompt_version: string;
    error_message?: string;
  }> {
    const sanitized = sanitizePayload(payload);
    const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';

    // 1. Fallback if GEMINI_API_KEY is not configured
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === '' || env.GEMINI_API_KEY.includes('your-gemini-key')) {
      const fallback = this.generateFallbackDiagnosis(payload, 'GEMINI_API_KEY not configured in server environment');
      return {
        diagnosis: fallback,
        diagnosis_source: 'RULE_BASED_FALLBACK',
        model: 'deterministic-rules-engine-v1',
        prompt_version: DIAGNOSIS_PROMPT_VERSION,
      };
    }

    try {
      // 2. Initialize official @google/genai client
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

      const systemInstruction = `You are the Lead Fintech Diagnostics AI for RazorRecover AI.
Your objective: Analyze failed Razorpay transactions and produce an accurate, objective, and structured JSON diagnosis.
Rules:
1. Base your diagnosis strictly on the provided error code, decline description, and payment method telemetry.
2. Never invent bank outages, card numbers, or customer facts. If information is ambiguous, set category to "UNKNOWN" and severity to "MEDIUM".
3. Confidence and recovery_probability must be integer numbers between 0 and 100.
4. If recovery_probability is provided, calculate expected_recovery safely as: round(amount * recovery_probability / 100).
5. Output ONLY valid, parseable JSON matching the requested structure without markdown formatting or code fences.
6. If amount > 25000 or confidence < 60, set requires_human_approval to true.
7. Categories must be one of: BANK_NETWORK, CARD_LIMIT, AUTHENTICATION_FAILURE, INSUFFICIENT_FUNDS, INVALID_PAYMENT_DETAILS, GATEWAY_ERROR, TIMEOUT, FRAUD_RISK, UNKNOWN.
8. Severity must be one of: LOW, MEDIUM, HIGH, CRITICAL.
9. Recommended action types must be one of: RETRY_LATER, REQUEST_ALTERNATIVE_PAYMENT_METHOD, REVIEW_PAYMENT_DETAILS, CUSTOMER_SUPPORT_REVIEW, MANUAL_REVIEW, NO_ACTION, UNKNOWN.`;

      const prompt = `Diagnose this failed payment transaction:
- Payment ID: ${sanitized.payment_id}
- Amount: ₹${sanitized.amount} ${sanitized.currency}
- Payment Instrument: ${sanitized.payment_method}
- Gateway: ${sanitized.gateway}
- Gateway Error Code: ${sanitized.error_code}
- Gateway Decline Reason: ${sanitized.error_description}
- Attempt Count: ${sanitized.attempts_count}

Return JSON with exact keys:
{
  "root_cause": "Concise technical diagnosis",
  "category": "BANK_NETWORK | CARD_LIMIT | AUTHENTICATION_FAILURE | INSUFFICIENT_FUNDS | INVALID_PAYMENT_DETAILS | GATEWAY_ERROR | TIMEOUT | FRAUD_RISK | UNKNOWN",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "confidence": 85,
  "recovery_probability": 75,
  "expected_recovery": 0,
  "recommended_action": "Actionable non-destructive recommendation",
  "recommended_action_type": "RETRY_LATER | REQUEST_ALTERNATIVE_PAYMENT_METHOD | REVIEW_PAYMENT_DETAILS | CUSTOMER_SUPPORT_REVIEW | MANUAL_REVIEW | NO_ACTION | UNKNOWN",
  "reasoning_summary": "Explanation based on gateway telemetry",
  "customer_facing_explanation": "Friendly, customer-safe explanation",
  "requires_human_approval": true
}`;

      // Call Gemini model
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1, // Low temperature for deterministic, factual diagnostics
        },
      });

      const responseText = response.text || '';
      if (!responseText.trim()) {
        throw new Error('Gemini model returned empty response text');
      }

      // Parse JSON
      let parsedJson: any;
      try {
        // Strip markdown backticks if any
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedJson = JSON.parse(cleaned);
      } catch (parseErr: any) {
        throw new Error(`Failed to parse Gemini JSON: ${parseErr.message}`);
      }

      // Re-calculate expected recovery safely on server to prevent LLM hallucinations
      if (parsedJson.recovery_probability !== undefined && payload.amount) {
        parsedJson.expected_recovery = Math.round((Number(payload.amount) * Number(parsedJson.recovery_probability)) / 100);
      }

      // Enforce high-value and low-confidence human guardrails
      if (payload.amount > 25000 || (parsedJson.confidence !== undefined && parsedJson.confidence < 60)) {
        parsedJson.requires_human_approval = true;
      }

      // Validate against Zod schema
      const validated = geminiDiagnosisSchema.parse(parsedJson);

      return {
        diagnosis: validated,
        diagnosis_source: 'GEMINI_AI',
        model: modelName,
        prompt_version: DIAGNOSIS_PROMPT_VERSION,
      };
    } catch (err: any) {
      console.warn(`[Gemini AI] API call failed (${err.message}). Activating deterministic fallback...`);
      const fallback = this.generateFallbackDiagnosis(payload, err.message);
      return {
        diagnosis: fallback,
        diagnosis_source: 'RULE_BASED_FALLBACK',
        model: 'deterministic-rules-engine-v1',
        prompt_version: DIAGNOSIS_PROMPT_VERSION,
        error_message: err.message,
      };
    }
  },

  /**
   * Deterministic local fallback generator using existing diagnosisEngine.ts
   */
  generateFallbackDiagnosis(payload: AiDiagnosisPayload, reason: string): GeminiDiagnosisOutput {
    const local = diagnosisEngine.diagnosePaymentFailure({
      amount: payload.amount,
      currency: payload.currency || 'INR',
      paymentMethod: payload.payment_method,
      errorCode: payload.error_code,
      errorDescription: payload.error_description,
    });

    let category: any = 'UNKNOWN';
    const code = (payload.error_code || '').toUpperCase();
    if (code.includes('TIMEOUT') || code.includes('GATEWAY')) category = 'TIMEOUT';
    else if (code.includes('LIMIT') || code.includes('DECLINED')) category = 'CARD_LIMIT';
    else if (code.includes('AUTH') || code.includes('OTP')) category = 'AUTHENTICATION_FAILURE';
    else if (code.includes('FUNDS') || code.includes('BALANCE')) category = 'INSUFFICIENT_FUNDS';

    let actionType: any = 'RETRY_LATER';
    if (category === 'CARD_LIMIT' || category === 'INSUFFICIENT_FUNDS') {
      actionType = 'REQUEST_ALTERNATIVE_PAYMENT_METHOD';
    }

    const expectedRecovery = Math.round((Number(payload.amount) * Number(local.recoveryProbability)) / 100);

    return {
      root_cause: local.rootCause,
      category,
      severity: local.riskLevel as any,
      confidence: local.confidence,
      recovery_probability: local.recoveryProbability,
      expected_recovery: expectedRecovery,
      recommended_action: local.recommendedAction,
      recommended_action_type: actionType,
      reasoning_summary: `Determined via deterministic decline code rule engine. (${reason})`,
      customer_facing_explanation: `Your payment was not completed due to a temporary issue with your payment method or issuing bank.`,
      requires_human_approval: local.requiresHumanApproval || payload.amount > 25000,
    };
  },
};
