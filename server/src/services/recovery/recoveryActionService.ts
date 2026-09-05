import { dataStore } from '../dataStore';
import { 
  RecoveryActionRecord, 
  RecoveryExecutionResult, 
  CreateActionPlanInput,
  RecoveryActionType,
  RecoveryActionStatus
} from './recoveryActionSchemas';
import { recoveryPolicyService } from './recoveryPolicyService';
import { recoveryActionValidator } from './recoveryActionValidator';
import { recoveryExecutionService } from './recoveryExecutionService';

export const recoveryActionService = {
  /**
   * Plans a recovery action for a recovery case.
   */
  async planAction(
    caseIdentifier: string,
    input: CreateActionPlanInput,
    actorEmail: string = 'admin@razorrecover.ai',
    actorRole: string = 'ADMIN'
  ): Promise<RecoveryActionRecord> {
    const targetCase = await dataStore.getCaseById(caseIdentifier);
    if (!targetCase) {
      throw new Error(`Recovery case not found: ${caseIdentifier}`);
    }

    const existingActions = await dataStore.getRecoveryActionsByCaseId(targetCase.case_id);

    // Evaluate Policy
    const policyResult = recoveryPolicyService.evaluateActionEligibility(
      targetCase,
      (targetCase as any).payment || null,
      input.action_type,
      existingActions
    );

    if (!policyResult.allowed) {
      throw new Error(`RECOVERY_ACTION_BLOCKED: ${policyResult.reason}`);
    }

    const actionId = `ACT-${Date.now().toString().slice(-6)}`;
    const idempotencyKey = recoveryActionValidator.generateIdempotencyKey(
      targetCase.case_id,
      actionId,
      existingActions.length + 1
    );

    const initialStatus: RecoveryActionStatus = policyResult.requires_approval ? 'PENDING_APPROVAL' : 'PLANNED';

    const actionRecord = await dataStore.createRecoveryAction({
      action_id: actionId,
      case_id: targetCase.case_id,
      action_type: input.action_type,
      channel: input.action_type === 'RETRY_PAYMENT' ? 'GATEWAY_RETRY' : 'ALTERNATIVE_METHOD',
      status: initialStatus,
      reason: input.reason,
      source: input.source || 'ADMIN_MANUAL',
      confidence: input.confidence ?? targetCase.confidence,
      estimated_recovery: input.estimated_recovery || targetCase.expected_recovery,
      requires_approval: policyResult.requires_approval,
      execution_mode: 'TEST',
      attempt_number: existingActions.length + 1,
      max_attempts: policyResult.max_attempts,
      idempotency_key: idempotencyKey,
      notes: input.notes,
    });

    // Record Audit Log
    await dataStore.addAuditLog({
      actor_email: actorEmail,
      actor_role: actorRole as any,
      action: 'RECOVERY_ACTION_PLANNED',
      entity_type: 'recovery_actions',
      entity_id: actionRecord.action_id,
      previous_state: { case_id: targetCase.case_id, status: targetCase.status },
      new_state: {
        action_id: actionRecord.action_id,
        action_type: actionRecord.action_type,
        status: actionRecord.status,
        requires_approval: actionRecord.requires_approval,
      },
    });

    return actionRecord;
  },

  /**
   * Approves a planned recovery action (Admin role only).
   */
  async approveAction(
    caseIdentifier: string,
    actionIdentifier: string,
    notes?: string,
    actorEmail: string = 'admin@razorrecover.ai',
    actorRole: string = 'ADMIN'
  ): Promise<RecoveryActionRecord> {
    const action = await dataStore.getRecoveryActionById(actionIdentifier);
    if (!action) {
      throw new Error(`Recovery action not found: ${actionIdentifier}`);
    }

    const validation = recoveryActionValidator.validateTransition(action.status, 'APPROVE');
    if (!validation.allowed) {
      throw new Error(`INVALID_TRANSITION: ${validation.reason}`);
    }

    if (validation.isIdempotent) {
      return action;
    }

    const updated = await dataStore.updateRecoveryAction(action.id || action.action_id, {
      status: 'APPROVED',
      approved_by: actorEmail,
      approved_at: new Date().toISOString(),
      notes: notes || action.notes,
    });

    await dataStore.addAuditLog({
      actor_email: actorEmail,
      actor_role: actorRole as any,
      action: 'RECOVERY_ACTION_APPROVED',
      entity_type: 'recovery_actions',
      entity_id: action.action_id,
      previous_state: { status: action.status },
      new_state: { status: 'APPROVED', approved_by: actorEmail, notes },
    });

    return updated;
  },

  /**
   * Executes an approved recovery action in TEST MODE.
   */
  async executeAction(
    caseIdentifier: string,
    actionIdentifier: string,
    notes?: string,
    actorEmail: string = 'admin@razorrecover.ai',
    actorRole: string = 'ADMIN'
  ): Promise<RecoveryExecutionResult> {
    const action = await dataStore.getRecoveryActionById(actionIdentifier);
    if (!action) {
      throw new Error(`Recovery action not found: ${actionIdentifier}`);
    }

    const targetCase = await dataStore.getCaseById(action.case_id || caseIdentifier);
    if (!targetCase) {
      throw new Error(`Recovery case not found: ${action.case_id}`);
    }

    // 1. Transition validation
    const validation = recoveryActionValidator.validateTransition(action.status, 'EXECUTE');
    if (!validation.allowed) {
      throw new Error(`EXECUTION_BLOCKED: ${validation.reason}`);
    }

    if (validation.isIdempotent) {
      return {
        action_id: action.action_id,
        case_id: targetCase.case_id,
        action_type: action.action_type,
        status: action.status,
        execution_mode: action.execution_mode,
        attempt_number: action.attempt_number,
        started_at: action.started_at || new Date().toISOString(),
        completed_at: action.completed_at || new Date().toISOString(),
        provider_reference: action.provider_reference,
        recovered_amount: action.recovered_amount || 0,
        error_code: action.error_code,
        error_message: action.error_message,
        idempotent: true,
      };
    }

    // 2. Policy evaluation
    const existingActions = await dataStore.getRecoveryActionsByCaseId(targetCase.case_id);
    const policyResult = recoveryPolicyService.evaluateActionEligibility(
      targetCase,
      (targetCase as any).payment || null,
      action.action_type,
      existingActions
    );

    if (!policyResult.allowed) {
      throw new Error(`POLICY_VIOLATION: ${policyResult.reason}`);
    }

    // 3. Concurrency Lock: Mark EXECUTING
    await dataStore.updateRecoveryAction(action.id || action.action_id, {
      status: 'EXECUTING',
      started_at: new Date().toISOString(),
    });

    await dataStore.addAuditLog({
      actor_email: actorEmail,
      actor_role: actorRole as any,
      action: 'RECOVERY_ACTION_STARTED',
      entity_type: 'recovery_actions',
      entity_id: action.action_id,
      previous_state: { status: 'APPROVED' },
      new_state: { status: 'EXECUTING', started_at: new Date().toISOString() },
    });

    // 4. Execute in TEST MODE
    const result = await recoveryExecutionService.executeAction(
      action,
      targetCase,
      (targetCase as any).payment || null,
      actorEmail
    );

    // 5. Update Action Record
    await dataStore.updateRecoveryAction(action.id || action.action_id, {
      status: result.status,
      completed_at: result.completed_at,
      provider_reference: result.provider_reference,
      error_code: result.error_code,
      error_message: result.error_message,
    });

    // 6. Update Case Status & Step
    await dataStore.updateCaseStatus(
      targetCase.id || targetCase.case_id,
      result.status === 'SUCCEEDED' ? 'EXECUTING' : targetCase.status,
      `Executed ${action.action_type} in TEST MODE (Ref: ${result.provider_reference || 'N/A'})`,
      {
        current_step: `Recovery Action ${result.status}: ${action.action_type} (TEST MODE)`,
        last_action: `Executed ${action.action_type} (${result.status})`,
      }
    );

    // 7. Audit Log
    const auditAction = result.status === 'SUCCEEDED' ? 'RECOVERY_ACTION_SUCCEEDED' : 'RECOVERY_ACTION_FAILED';
    await dataStore.addAuditLog({
      actor_email: actorEmail,
      actor_role: actorRole as any,
      action: auditAction,
      entity_type: 'recovery_actions',
      entity_id: action.action_id,
      previous_state: { status: 'EXECUTING' },
      new_state: {
        status: result.status,
        provider_reference: result.provider_reference,
        execution_mode: 'TEST',
      },
    });

    return result;
  },

  /**
   * Safe simulation of recovery action.
   */
  async simulateAction(
    caseIdentifier: string,
    actionIdentifier: string,
    actorEmail: string = 'admin@razorrecover.ai',
    actorRole: string = 'ADMIN'
  ): Promise<RecoveryExecutionResult> {
    const action = await dataStore.getRecoveryActionById(actionIdentifier);
    if (!action) {
      throw new Error(`Recovery action not found: ${actionIdentifier}`);
    }

    const targetCase = await dataStore.getCaseById(action.case_id || caseIdentifier);
    if (!targetCase) {
      throw new Error(`Recovery case not found: ${action.case_id}`);
    }

    const result = await recoveryExecutionService.simulateAction(action, targetCase);

    await dataStore.addAuditLog({
      actor_email: actorEmail,
      actor_role: actorRole as any,
      action: 'RECOVERY_ACTION_SIMULATED',
      entity_type: 'recovery_actions',
      entity_id: action.action_id,
      previous_state: { status: action.status },
      new_state: { mode: 'SIMULATION_ONLY', result: 'SIMULATION_SUCCESS' },
    });

    return result;
  },

  /**
   * Cancels a planned or pending recovery action.
   */
  async cancelAction(
    caseIdentifier: string,
    actionIdentifier: string,
    reason: string,
    actorEmail: string = 'admin@razorrecover.ai',
    actorRole: string = 'ADMIN'
  ): Promise<RecoveryActionRecord> {
    const action = await dataStore.getRecoveryActionById(actionIdentifier);
    if (!action) {
      throw new Error(`Recovery action not found: ${actionIdentifier}`);
    }

    const validation = recoveryActionValidator.validateTransition(action.status, 'CANCEL');
    if (!validation.allowed) {
      throw new Error(`CANCELLATION_BLOCKED: ${validation.reason}`);
    }

    const updated = await dataStore.updateRecoveryAction(action.id || action.action_id, {
      status: 'CANCELLED',
      notes: `Cancelled by Admin. Reason: ${reason}`,
    });

    await dataStore.addAuditLog({
      actor_email: actorEmail,
      actor_role: actorRole as any,
      action: 'RECOVERY_ACTION_CANCELLED',
      entity_type: 'recovery_actions',
      entity_id: action.action_id,
      previous_state: { status: action.status },
      new_state: { status: 'CANCELLED', reason },
    });

    return updated;
  },

  /**
   * Retrieves all recovery actions for a case.
   */
  async getActionsForCase(caseIdentifier: string): Promise<RecoveryActionRecord[]> {
    return await dataStore.getRecoveryActionsByCaseId(caseIdentifier);
  },
};
