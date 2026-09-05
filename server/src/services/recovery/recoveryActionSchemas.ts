import { z } from 'zod';

export const RecoveryActionTypeEnum = z.enum([
  'RETRY_PAYMENT',
  'ALTERNATIVE_PAYMENT_METHOD',
  'MANUAL_REVIEW',
  'NO_ACTION',
]);
export type RecoveryActionType = z.infer<typeof RecoveryActionTypeEnum>;

export const RecoveryActionStatusEnum = z.enum([
  'PLANNED',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'EXECUTING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
]);
export type RecoveryActionStatus = z.infer<typeof RecoveryActionStatusEnum>;

export const RecoveryExecutionModeEnum = z.enum(['TEST', 'SIMULATION']);
export type RecoveryExecutionMode = z.infer<typeof RecoveryExecutionModeEnum>;

export const createActionPlanSchema = z.object({
  action_type: RecoveryActionTypeEnum,
  reason: z.string().min(3, 'Action reason of at least 3 characters is required'),
  source: z.enum(['GEMINI_AI', 'DETERMINISTIC_ENGINE', 'ADMIN_MANUAL']).default('ADMIN_MANUAL'),
  confidence: z.number().min(0).max(100).default(80),
  estimated_recovery: z.number().min(0).default(0),
  requires_approval: z.boolean().default(true),
  notes: z.string().optional(),
});
export type CreateActionPlanInput = z.infer<typeof createActionPlanSchema>;

export const approveActionSchema = z.object({
  notes: z.string().optional(),
});

export const executeActionSchema = z.object({
  idempotency_key: z.string().optional(),
  notes: z.string().optional(),
});

export const cancelActionSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason of at least 3 characters is required'),
  notes: z.string().optional(),
});

export interface RecoveryActionRecord {
  id: string;
  action_id: string;
  case_id: string;
  action_type: RecoveryActionType;
  channel: string;
  status: RecoveryActionStatus;
  reason: string;
  source: string;
  confidence: number;
  estimated_recovery: number;
  requires_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  execution_mode: RecoveryExecutionMode;
  attempt_number: number;
  max_attempts: number;
  started_at: string | null;
  completed_at: string | null;
  next_eligible_at: string | null;
  provider_reference: string | null;
  recovered_amount: number;
  error_code: string | null;
  error_message: string | null;
  idempotency_key: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecoveryExecutionResult {
  action_id: string;
  case_id: string;
  action_type: RecoveryActionType;
  status: RecoveryActionStatus;
  execution_mode: RecoveryExecutionMode;
  attempt_number: number;
  started_at: string;
  completed_at: string;
  provider_reference: string | null;
  recovered_amount: number;
  error_code: string | null;
  error_message: string | null;
  idempotent?: boolean;
  is_simulated?: boolean;
}
