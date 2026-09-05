import { z } from 'zod';

export const RootCauseCategoryEnum = z.enum([
  'BANK_NETWORK',
  'CARD_LIMIT',
  'AUTHENTICATION_FAILURE',
  'INSUFFICIENT_FUNDS',
  'INVALID_PAYMENT_DETAILS',
  'GATEWAY_ERROR',
  'TIMEOUT',
  'FRAUD_RISK',
  'UNKNOWN',
]);
export type RootCauseCategory = z.infer<typeof RootCauseCategoryEnum>;

export const SeverityLevelEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);
export type SeverityLevel = z.infer<typeof SeverityLevelEnum>;

export const RecommendedActionTypeEnum = z.enum([
  'RETRY_LATER',
  'REQUEST_ALTERNATIVE_PAYMENT_METHOD',
  'REVIEW_PAYMENT_DETAILS',
  'CUSTOMER_SUPPORT_REVIEW',
  'MANUAL_REVIEW',
  'NO_ACTION',
  'UNKNOWN',
]);
export type RecommendedActionType = z.infer<typeof RecommendedActionTypeEnum>;

export const geminiDiagnosisSchema = z.object({
  root_cause: z.string().min(3, 'Root cause description is required'),
  category: RootCauseCategoryEnum.default('UNKNOWN'),
  severity: SeverityLevelEnum.default('MEDIUM'),
  confidence: z.number().min(0).max(100).default(50),
  recovery_probability: z.number().min(0).max(100).default(50),
  expected_recovery: z.number().min(0).default(0),
  recommended_action: z.string().min(3, 'Recommended action description is required'),
  recommended_action_type: RecommendedActionTypeEnum.default('UNKNOWN'),
  reasoning_summary: z.string().min(3, 'Reasoning summary is required'),
  customer_facing_explanation: z.string().min(3, 'Customer-facing explanation is required'),
  requires_human_approval: z.boolean().default(false),
});

export type GeminiDiagnosisOutput = z.infer<typeof geminiDiagnosisSchema>;

export interface AiDiagnosisPayload {
  payment_id: string;
  amount: number;
  currency: string;
  payment_method?: string;
  gateway?: string;
  error_code?: string;
  error_description?: string;
  attempts_count?: number;
  customer_tier?: string;
  prior_recovery_count?: number;
  deterministic_hint?: string;
}
