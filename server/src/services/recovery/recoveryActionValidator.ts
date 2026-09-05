import { RecoveryActionRecord, RecoveryActionStatus } from './recoveryActionSchemas';

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
  isIdempotent?: boolean;
  newStatus?: RecoveryActionStatus;
}

export const recoveryActionValidator = {
  /**
   * Validates recovery action state transitions.
   */
  validateTransition(
    currentStatus: RecoveryActionStatus,
    targetOperation: 'APPROVE' | 'EXECUTE' | 'SIMULATE' | 'CANCEL' | 'FAIL' | 'SUCCEED'
  ): TransitionValidationResult {
    switch (targetOperation) {
      case 'APPROVE':
        if (currentStatus === 'APPROVED') {
          return { allowed: true, isIdempotent: true, newStatus: 'APPROVED' };
        }
        if (currentStatus === 'PLANNED' || currentStatus === 'PENDING_APPROVAL') {
          return { allowed: true, newStatus: 'APPROVED' };
        }
        return {
          allowed: false,
          reason: `Cannot approve an action currently in status '${currentStatus}'.`,
        };

      case 'EXECUTE':
        if (currentStatus === 'EXECUTING') {
          return {
            allowed: false,
            reason: 'ACTION_ALREADY_EXECUTING: Another execution process is currently in progress.',
          };
        }
        if (currentStatus === 'SUCCEEDED') {
          return { allowed: true, isIdempotent: true, newStatus: 'SUCCEEDED' };
        }
        if (currentStatus === 'APPROVED') {
          return { allowed: true, newStatus: 'EXECUTING' };
        }
        return {
          allowed: false,
          reason: `Cannot execute action in status '${currentStatus}'. Explicit Admin Approval is required.`,
        };

      case 'SIMULATE':
        if (['SUCCEEDED', 'CANCELLED'].includes(currentStatus)) {
          return {
            allowed: false,
            reason: `Cannot simulate action in terminal status '${currentStatus}'.`,
          };
        }
        return { allowed: true, newStatus: currentStatus };

      case 'CANCEL':
        if (currentStatus === 'CANCELLED') {
          return { allowed: true, isIdempotent: true, newStatus: 'CANCELLED' };
        }
        if (['PLANNED', 'PENDING_APPROVAL', 'APPROVED'].includes(currentStatus)) {
          return { allowed: true, newStatus: 'CANCELLED' };
        }
        return {
          allowed: false,
          reason: `Cannot cancel action in status '${currentStatus}'.`,
        };

      case 'SUCCEED':
        if (currentStatus === 'EXECUTING') {
          return { allowed: true, newStatus: 'SUCCEEDED' };
        }
        return {
          allowed: false,
          reason: `Cannot mark action as SUCCEEDED from status '${currentStatus}'.`,
        };

      case 'FAIL':
        if (currentStatus === 'EXECUTING' || currentStatus === 'APPROVED') {
          return { allowed: true, newStatus: 'FAILED' };
        }
        return {
          allowed: false,
          reason: `Cannot mark action as FAILED from status '${currentStatus}'.`,
        };

      default:
        return { allowed: false, reason: `Unknown operation: ${targetOperation}` };
    }
  },

  /**
   * Generates a stable idempotency key for recovery actions.
   */
  generateIdempotencyKey(caseId: string, actionId: string, attempt: number): string {
    return `idem_${caseId}_${actionId}_att${attempt}`;
  },
};
