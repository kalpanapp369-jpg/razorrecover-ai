import { geminiService } from './geminiService';
import { dataStore } from '../dataStore';
import { RecoveryCase } from '../../types';

export const aiDiagnosisPipeline = {
  /**
   * Executes AI Diagnosis for a Recovery Case and saves the structured results into the database and audit trail.
   */
  async runDiagnosisForCase(caseIdOrCode: string, options?: { force?: boolean; actorEmail?: string }): Promise<{
    success: boolean;
    case: RecoveryCase | null;
    diagnosis: any;
    diagnosis_source: string;
    model: string;
    idempotent?: boolean;
  }> {
    const targetCase = await dataStore.getCaseById(caseIdOrCode);
    if (!targetCase) {
      throw new Error(`Recovery case not found: ${caseIdOrCode}`);
    }

    // Idempotency: If already diagnosed by Gemini and not forcing a re-run, return existing diagnosis
    if (!options?.force && (targetCase as any).diagnosis_source === 'GEMINI_AI' && targetCase.confidence) {
      return {
        success: true,
        case: targetCase,
        diagnosis: {
          root_cause: targetCase.root_cause,
          confidence: targetCase.confidence,
          recovery_probability: targetCase.recovery_probability,
          expected_recovery: targetCase.expected_recovery,
          recommended_action: targetCase.recommended_action,
          requires_human_approval: targetCase.requires_human_approval,
        },
        diagnosis_source: 'GEMINI_AI',
        model: (targetCase as any).ai_model || 'gemini-2.5-flash',
        idempotent: true,
      };
    }

    // Audit: AI Diagnosis Requested
    await dataStore.addAuditLog({
      actor_email: options?.actorEmail || 'system@razorrecover.ai',
      actor_role: options?.actorEmail ? 'ADMIN' : 'SYSTEM',
      action: 'AI_DIAGNOSIS_REQUESTED',
      entity_type: 'recovery_cases',
      entity_id: targetCase.case_id,
      previous_state: { status: targetCase.status, confidence: targetCase.confidence },
      new_state: { diagnosis_in_progress: true },
    });

    // Prepare payload for Gemini
    const result = await geminiService.diagnosePaymentFailure({
      payment_id: targetCase.payment_id || (targetCase as any).payment?.transaction_id || targetCase.case_id,
      amount: targetCase.amount_at_risk,
      currency: 'INR',
      payment_method: (targetCase as any).payment?.payment_method || 'Razorpay Gateway',
      gateway: 'Razorpay',
      error_code: (targetCase as any).payment?.error_code || 'BAD_REQUEST_PAYMENT_DECLINED',
      error_description: (targetCase as any).payment?.error_description || targetCase.root_cause || 'Payment decline',
    });

    const { diagnosis, diagnosis_source, model, prompt_version } = result;

    // Update recovery case in database
    const updatedCase = await dataStore.updateCaseStatus(
      targetCase.id || targetCase.case_id,
      targetCase.status === 'DETECTED' ? 'RECOMMENDED' : targetCase.status,
      diagnosis.reasoning_summary,
      {
        root_cause: diagnosis.root_cause,
        confidence: diagnosis.confidence,
        recovery_probability: diagnosis.recovery_probability,
        expected_recovery: diagnosis.expected_recovery,
        recommended_action: diagnosis.recommended_action,
        requires_human_approval: diagnosis.requires_human_approval,
        current_step: `AI Diagnosis Complete (${diagnosis_source})`,
        last_action: `Generated Recovery Proposal via ${diagnosis_source === 'GEMINI_AI' ? 'Gemini AI' : 'Deterministic Fallback'}`,
        // Custom Phase 4 AI fields
        ...( {
          ai_root_cause: diagnosis.root_cause,
          ai_category: diagnosis.category,
          ai_severity: diagnosis.severity,
          ai_confidence: diagnosis.confidence,
          ai_recovery_probability: diagnosis.recovery_probability,
          ai_expected_recovery: diagnosis.expected_recovery,
          ai_recommended_action: diagnosis.recommended_action,
          ai_recommended_action_type: diagnosis.recommended_action_type,
          ai_reasoning_summary: diagnosis.reasoning_summary,
          ai_customer_facing_explanation: diagnosis.customer_facing_explanation,
          ai_model: model,
          ai_prompt_version: prompt_version,
          diagnosis_source,
          ai_status: 'COMPLETED',
        } as any)
      }
    );

    // Audit: AI Diagnosis Completed / Fallback Used
    const auditAction = diagnosis_source === 'GEMINI_AI' ? 'AI_DIAGNOSIS_COMPLETED' : 'AI_FALLBACK_USED';
    await dataStore.addAuditLog({
      actor_email: options?.actorEmail || 'system@razorrecover.ai',
      actor_role: options?.actorEmail ? 'ADMIN' : 'SYSTEM',
      action: auditAction,
      entity_type: 'recovery_cases',
      entity_id: targetCase.case_id,
      previous_state: { diagnosis_in_progress: true },
      new_state: {
        diagnosis_source,
        model,
        category: diagnosis.category,
        confidence: diagnosis.confidence,
        recovery_probability: diagnosis.recovery_probability,
        requires_human_approval: diagnosis.requires_human_approval,
      },
    });

    return {
      success: true,
      case: updatedCase,
      diagnosis,
      diagnosis_source,
      model,
    };
  },
};
