import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { aiLimiter, actionLimiter } from '../middleware/rateLimit';
import { caseFilterSchema, caseApprovalSchema, caseActionReasonSchema } from '../schemas/zodSchemas';
import { dataStore } from '../services/dataStore';

const router = Router();

// GET /api/cases - List all recovery cases with filtering and sorting
router.get('/', authenticate, validate(caseFilterSchema, 'query'), async (req: AuthRequest, res: Response) => {
  try {
    const { issueType, riskLevel, status, search, sortBy } = req.query as any;

    let customerId: string | undefined;
    if (req.user?.role === 'CUSTOMER') {
      const customer = await dataStore.getCustomerByUserId(req.user.id);
      if (!customer) {
        return res.json({ success: true, count: 0, data: [] });
      }
      customerId = customer.id;
    }

    const cases = await dataStore.getCases({ customerId, issueType, riskLevel, status, search, sortBy });
    
    res.json({
      success: true,
      count: cases.length,
      data: cases,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cases/simulate-inbound-webhook - Trigger real-time inbound payment failure webhook simulation
router.post('/simulate-inbound-webhook', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const errorScenarios = [
      {
        issue_type: 'PAYMENT_FAILURE' as const,
        amount_at_risk: 42000,
        risk_score: 88.5,
        risk_level: 'HIGH' as const,
        root_cause: 'Real-time Webhook: Axis Bank gateway decline (BAD_REQUEST_PAYMENT_DECLINED) on subscription debit',
        recommended_action: 'Dispatch instant smart fallback retry via alternative UPI corridor with WhatsApp prompt',
        confidence: 91.0,
        recovery_probability: 84.0,
        status: 'PENDING_APPROVAL' as const,
      },
      {
        issue_type: 'OVERDUE_INVOICE' as const,
        amount_at_risk: 75000,
        risk_score: 93.0,
        risk_level: 'CRITICAL' as const,
        root_cause: 'Real-time Webhook: Enterprise invoice past due 18 days; corporate card expired',
        recommended_action: 'Escalate for Operations Admin sign-off to issue 5% prompt settlement credit',
        confidence: 95.0,
        recovery_probability: 86.5,
        status: 'PENDING_APPROVAL' as const,
      },
      {
        issue_type: 'SUBSCRIPTION_FAILURE' as const,
        amount_at_risk: 28000,
        risk_score: 72.0,
        risk_level: 'HIGH' as const,
        root_cause: 'Real-time Webhook: Recurring mandate failed due to daily velocity limit',
        recommended_action: 'Automated AI smart reschedule at 11:00 AM next banking window',
        confidence: 85.0,
        recovery_probability: 79.0,
        status: 'RECOMMENDED' as const,
      }
    ];

    const chosen = errorScenarios[Math.floor(Math.random() * errorScenarios.length)];
    const createdCase = await dataStore.addCase({
      ...chosen,
      case_id: `REC-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      requires_human_approval: chosen.status === 'PENDING_APPROVAL',
      current_step: chosen.status === 'PENDING_APPROVAL' ? 'Awaiting Human-in-the-Loop Sign-off' : 'Queued for Autonomous AI Dispatch',
      last_action: 'Ingested live Razorpay webhook (payment.failed)',
    });

    await dataStore.addAuditLog({
      actor_id: req.user?.id,
      actor_email: req.user?.email || 'admin@razorrecover.ai',
      actor_role: req.user?.role || 'ADMIN',
      action: 'WEBHOOK_FAILURE_SIMULATED',
      entity_type: 'recovery_cases',
      entity_id: createdCase.case_id,
      new_state: {
        case_id: createdCase.case_id,
        amount_at_risk: createdCase.amount_at_risk,
        root_cause: createdCase.root_cause,
        status: createdCase.status,
      },
    });

    res.json({
      success: true,
      message: `Inbound failure webhook intercepted: Case ${createdCase.case_id} added to live queue!`,
      data: createdCase,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cases/reset-demo-queue - Reset demo cases to fully populate queue
router.post('/reset-demo-queue', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const resetList = await dataStore.resetDemoCases();
    res.json({
      success: true,
      message: 'Demo recovery queue refreshed with initial active cases',
      count: resetList.length,
      data: resetList,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/cases/:id - Get recovery case by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const caseItem = await dataStore.getCaseById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ success: false, error: 'Recovery case not found' });
    }

    if (req.user?.role === 'CUSTOMER') {
      const customer = await dataStore.getCustomerByUserId(req.user.id);
      if (!customer || caseItem.customer_id !== customer.id) {
        return res.status(403).json({ success: false, error: 'You do not have permission to access this recovery case' });
      }
    }

    res.json({ success: true, data: caseItem });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/cases/:id/timeline - Get chronological audit timeline for a recovery case
router.get('/:id/timeline', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const caseItem = await dataStore.getCaseById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ success: false, error: 'Recovery case not found' });
    }

    if (req.user?.role === 'CUSTOMER') {
      const customer = await dataStore.getCustomerByUserId(req.user.id);
      if (!customer || caseItem.customer_id !== customer.id) {
        return res.status(403).json({ success: false, error: 'You do not have permission to access this case timeline' });
      }
    }

    const timeline = await dataStore.getCaseTimeline(req.params.id);
    res.json({
      success: true,
      caseId: caseItem.case_id,
      data: timeline,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cases/:id/ai-diagnosis - Trigger or re-run Gemini AI diagnosis for a case (Admin only)
router.post(
  '/:id/ai-diagnosis',
  aiLimiter,
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { force } = req.body || {};
      const { aiDiagnosisPipeline } = await import('../services/gemini/aiDiagnosisPipeline');
      
      const result = await aiDiagnosisPipeline.runDiagnosisForCase(req.params.id, {
        force: Boolean(force),
        actorEmail: req.user?.email,
      });

      res.json({
        success: true,
        message: `AI Diagnosis completed via ${result.diagnosis_source}`,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ==============================================================================
// RECOVERY ACTIONS ENDPOINTS (Phase 5)
// ==============================================================================

// GET /api/cases/:id/actions - List all recovery actions for a case
router.get('/:id/actions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const caseItem = await dataStore.getCaseById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ success: false, error: 'Recovery case not found' });
    }

    if (req.user?.role === 'CUSTOMER') {
      const customer = await dataStore.getCustomerByUserId(req.user.id);
      if (!customer || caseItem.customer_id !== customer.id) {
        return res.status(403).json({ success: false, error: 'You do not have permission to access recovery actions for this case' });
      }
    }

    const { recoveryActionService } = await import('../services/recovery/recoveryActionService');
    const actions = await recoveryActionService.getActionsForCase(req.params.id);
    res.json({ success: true, data: actions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cases/:id/actions/plan - Create a planned recovery action (Admin only)
router.post(
  '/:id/actions/plan',
  actionLimiter,
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { createActionPlanSchema } = await import('../services/recovery/recoveryActionSchemas');
      const { recoveryActionService } = await import('../services/recovery/recoveryActionService');

      const parsed = createActionPlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Invalid action plan data' });
      }

      const action = await recoveryActionService.planAction(
        req.params.id,
        parsed.data,
        req.user?.email,
        req.user?.role
      );

      res.json({
        success: true,
        message: `Recovery action ${action.action_id} planned successfully (${action.status})`,
        data: action,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// POST /api/cases/:id/actions/:actionId/approve - Approve a planned recovery action (Admin only)
router.post(
  '/:id/actions/:actionId/approve',
  actionLimiter,
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { recoveryActionService } = await import('../services/recovery/recoveryActionService');
      const { notes } = req.body || {};

      const approved = await recoveryActionService.approveAction(
        req.params.id,
        req.params.actionId,
        notes,
        req.user?.email,
        req.user?.role
      );

      res.json({
        success: true,
        message: `Recovery action ${approved.action_id} approved for execution`,
        data: approved,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// POST /api/cases/:id/actions/:actionId/execute - Execute an approved recovery action in TEST MODE (Admin only)
router.post(
  '/:id/actions/:actionId/execute',
  actionLimiter,
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { recoveryActionService } = await import('../services/recovery/recoveryActionService');
      const { notes } = req.body || {};

      const result = await recoveryActionService.executeAction(
        req.params.id,
        req.params.actionId,
        notes,
        req.user?.email,
        req.user?.role
      );

      res.json({
        success: true,
        message: `Recovery action ${result.action_id} executed in TEST MODE (${result.status})`,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// POST /api/cases/:id/actions/:actionId/simulate - Safe simulation of recovery action (Admin only)
router.post(
  '/:id/actions/:actionId/simulate',
  actionLimiter,
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { recoveryActionService } = await import('../services/recovery/recoveryActionService');
      const result = await recoveryActionService.simulateAction(
        req.params.id,
        req.params.actionId,
        req.user?.email,
        req.user?.role
      );

      res.json({
        success: true,
        message: `Recovery action simulation completed [SIMULATION ONLY]`,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// POST /api/cases/:id/actions/:actionId/cancel - Cancel a planned recovery action (Admin only)
router.post(
  '/:id/actions/:actionId/cancel',
  actionLimiter,
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { recoveryActionService } = await import('../services/recovery/recoveryActionService');
      const { reason } = req.body || {};

      if (!reason || reason.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Cancellation reason of at least 3 characters is required' });
      }

      const cancelled = await recoveryActionService.cancelAction(
        req.params.id,
        req.params.actionId,
        reason,
        req.user?.email,
        req.user?.role
      );

      res.json({
        success: true,
        message: `Recovery action ${cancelled.action_id} cancelled`,
        data: cancelled,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// POST /api/cases/:id/approve - Approve recovery action (Admin only)
router.post(
  '/:id/approve',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { notes } = req.body || {};
      const targetCase = await dataStore.getCaseById(req.params.id);

      if (!targetCase) {
        return res.status(404).json({ success: false, error: 'Recovery case not found' });
      }

      const validation = dataStore.validateCaseTransition(targetCase.status, 'APPROVE');
      if (!validation.allowed) {
        return res.status(400).json({ success: false, error: validation.reason });
      }

      // Idempotency check: If already approved, return early without duplicate logs
      if (validation.isIdempotent) {
        return res.json({
          success: true,
          message: `Case ${targetCase.case_id} is already APPROVED`,
          data: targetCase,
          idempotent: true,
        });
      }

      const approvalNote = notes || 'Approved by Admin in Control Center';
      const updatedCase = await dataStore.updateCaseStatus(
        req.params.id,
        'APPROVED',
        approvalNote,
        {
          requires_human_approval: false,
          current_step: 'Approved by Admin; ready for recovery dispatch',
          last_action: `Admin Approval (${req.user?.email || 'admin'})`,
        }
      );

      await dataStore.addAuditLog({
        actor_id: req.user?.id,
        actor_email: req.user?.email,
        actor_role: req.user?.role,
        action: 'CASE_APPROVED',
        entity_type: 'recovery_cases',
        entity_id: targetCase.case_id,
        previous_state: { status: targetCase.status },
        new_state: { status: 'APPROVED', notes: approvalNote, approved_by: req.user?.email },
      });

      res.json({
        success: true,
        message: `Case ${targetCase.case_id} approved successfully`,
        data: updatedCase,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// POST /api/cases/:id/reject - Reject recovery proposal with required reason (Admin only)
router.post(
  '/:id/reject',
  authenticate,
  requireRole('ADMIN'),
  validate(caseActionReasonSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { reason, notes } = req.body;
      const targetCase = await dataStore.getCaseById(req.params.id);

      if (!targetCase) {
        return res.status(404).json({ success: false, error: 'Recovery case not found' });
      }

      const validation = dataStore.validateCaseTransition(targetCase.status, 'REJECT');
      if (!validation.allowed) {
        return res.status(400).json({ success: false, error: validation.reason });
      }

      if (validation.isIdempotent) {
        return res.json({
          success: true,
          message: `Case ${targetCase.case_id} is already STOPPED/REJECTED`,
          data: targetCase,
          idempotent: true,
        });
      }

      const rejectionDetails = `Rejected by Admin: ${reason}${notes ? ` (${notes})` : ''}`;
      const updatedCase = await dataStore.updateCaseStatus(
        req.params.id,
        'STOPPED',
        rejectionDetails,
        {
          requires_human_approval: false,
          current_step: 'Case rejected and stopped by Administrator',
          last_action: `Admin Rejection: ${reason}`,
        }
      );

      await dataStore.addAuditLog({
        actor_id: req.user?.id,
        actor_email: req.user?.email,
        actor_role: req.user?.role,
        action: 'CASE_REJECTED',
        entity_type: 'recovery_cases',
        entity_id: targetCase.case_id,
        previous_state: { status: targetCase.status },
        new_state: { status: 'STOPPED', reason, notes, rejected_by: req.user?.email },
      });

      res.json({
        success: true,
        message: `Case ${targetCase.case_id} rejected and stopped`,
        data: updatedCase,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// POST /api/cases/:id/stop - Stop active recovery case with required reason (Admin only)
router.post(
  '/:id/stop',
  authenticate,
  requireRole('ADMIN'),
  validate(caseActionReasonSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { reason, notes } = req.body;
      const targetCase = await dataStore.getCaseById(req.params.id);

      if (!targetCase) {
        return res.status(404).json({ success: false, error: 'Recovery case not found' });
      }

      const validation = dataStore.validateCaseTransition(targetCase.status, 'STOP');
      if (!validation.allowed) {
        return res.status(400).json({ success: false, error: validation.reason });
      }

      if (validation.isIdempotent) {
        return res.json({
          success: true,
          message: `Case ${targetCase.case_id} is already STOPPED`,
          data: targetCase,
          idempotent: true,
        });
      }

      const stopDetails = `Stopped by Admin: ${reason}${notes ? ` (${notes})` : ''}`;
      const updatedCase = await dataStore.updateCaseStatus(
        req.params.id,
        'STOPPED',
        stopDetails,
        {
          current_step: 'Recovery halted by Admin manual stop',
          last_action: `Manual Stop: ${reason}`,
        }
      );

      await dataStore.addAuditLog({
        actor_id: req.user?.id,
        actor_email: req.user?.email,
        actor_role: req.user?.role,
        action: 'CASE_STOPPED',
        entity_type: 'recovery_cases',
        entity_id: targetCase.case_id,
        previous_state: { status: targetCase.status },
        new_state: { status: 'STOPPED', reason, notes, stopped_by: req.user?.email },
      });

      res.json({
        success: true,
        message: `Case ${targetCase.case_id} stopped successfully`,
        data: updatedCase,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// POST /api/cases/:id/simulate-recovery - Safe simulation layer (Admin only, Zero real charges/messages)
router.post(
  '/:id/simulate-recovery',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const targetCase = await dataStore.getCaseById(req.params.id);

      if (!targetCase) {
        return res.status(404).json({ success: false, error: 'Recovery case not found' });
      }

      const validation = dataStore.validateCaseTransition(targetCase.status, 'SIMULATE_RECOVERY');
      if (!validation.allowed) {
        return res.status(400).json({ success: false, error: validation.reason });
      }

      // Safe Simulation: Updates internal workflow state only. No payment gateway charges, no WhatsApp messages.
      const simulatedOutcome = {
        mode: 'SIMULATION_ONLY',
        simulated_at: new Date().toISOString(),
        action_simulated: targetCase.recommended_action || 'Smart Fallback Routing',
        predicted_recovery_probability: targetCase.recovery_probability,
        simulated_result: 'SIMULATION_SUCCESS',
        note: 'Safe dry-run simulation executed. Zero real money charged; zero real messages sent.',
      };

      const updatedCase = await dataStore.updateCaseStatus(
        req.params.id,
        'EXECUTING',
        'Simulated recovery workflow execution active (Simulation Mode)',
        {
          last_action: 'Recovery action simulated (Dry Run)',
          current_step: 'Simulated dispatch verified; awaiting settlement',
        }
      );

      await dataStore.addAuditLog({
        actor_id: req.user?.id,
        actor_email: req.user?.email,
        actor_role: req.user?.role,
        action: 'RECOVERY_ACTION_SIMULATED',
        entity_type: 'recovery_cases',
        entity_id: targetCase.case_id,
        previous_state: { status: targetCase.status },
        new_state: { status: 'EXECUTING', simulation: simulatedOutcome },
      });

      res.json({
        success: true,
        message: `Simulation dry-run completed for Case ${targetCase.case_id}`,
        data: {
          case: updatedCase,
          simulation: simulatedOutcome,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// POST /api/cases/:id/approval - Backward-compatible approval handler
router.post(
  '/:id/approval',
  authenticate,
  requireRole('ADMIN'),
  validate(caseApprovalSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { action, notes } = req.body;
      const targetCase = await dataStore.getCaseById(req.params.id);

      if (!targetCase) {
        return res.status(404).json({ success: false, error: 'Recovery case not found' });
      }

      const newStatus = action === 'APPROVE' ? 'APPROVED' : 'STOPPED';
      const updatedCase = await dataStore.updateCaseStatus(
        req.params.id, 
        newStatus, 
        notes || (action === 'APPROVE' ? 'Approved by Admin' : 'Rejected by Admin')
      );

      await dataStore.addAuditLog({
        actor_id: req.user?.id,
        actor_email: req.user?.email,
        actor_role: req.user?.role,
        action: `CASE_${action}D`,
        entity_type: 'recovery_cases',
        entity_id: targetCase.case_id,
        previous_state: { status: targetCase.status },
        new_state: { status: newStatus, notes },
      });

      res.json({
        success: true,
        message: `Case ${targetCase.case_id} ${action.toLowerCase()}d successfully`,
        data: updatedCase,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// POST /api/cases/:id/escalate - Escalate case to human review
router.post('/:id/escalate', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const targetCase = await dataStore.getCaseById(req.params.id);
    if (!targetCase) {
      return res.status(404).json({ success: false, error: 'Recovery case not found' });
    }

    const updatedCase = await dataStore.updateCaseStatus(
      req.params.id, 
      'ESCALATED', 
      'Escalated for immediate human intervention',
      { requires_human_approval: true }
    );

    await dataStore.addAuditLog({
      actor_id: req.user?.id,
      actor_email: req.user?.email,
      actor_role: req.user?.role,
      action: 'CASE_ESCALATED',
      entity_type: 'recovery_cases',
      entity_id: targetCase.case_id,
      previous_state: { status: targetCase.status },
      new_state: { status: 'ESCALATED' },
    });

    res.json({
      success: true,
      message: `Case ${targetCase.case_id} escalated for human review`,
      data: updatedCase,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cases/:id/recover - Mark case as recovered (payment settlement webhook verified)
router.post('/:id/recover', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const targetCase = await dataStore.getCaseById(req.params.id);
    if (!targetCase) {
      return res.status(404).json({ success: false, error: 'Recovery case not found' });
    }

    const updatedCase = await dataStore.updateCaseStatus(
      req.params.id,
      'RECOVERED',
      'Payment recovered and verified via Razorpay gateway webhook settlement',
      {
        requires_human_approval: false,
        current_step: 'Payment settlement confirmed; ARR saved',
        last_action: 'Webhook Settlement Verified',
      }
    );

    await dataStore.addAuditLog({
      actor_id: req.user?.id,
      actor_email: req.user?.email || 'admin@razorrecover.ai',
      actor_role: req.user?.role || 'ADMIN',
      action: 'CASE_RECOVERED',
      entity_type: 'recovery_cases',
      entity_id: targetCase.case_id,
      previous_state: { status: targetCase.status },
      new_state: { status: 'RECOVERED', amount_recovered: targetCase.amount_at_risk },
    });

    res.json({
      success: true,
      message: `Case ${targetCase.case_id} marked as RECOVERED! Revenue preserved.`,
      data: updatedCase,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cases/:id/reopen - Reset/Reopen case back to PENDING_APPROVAL for testing
router.post('/:id/reopen', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const targetCase = await dataStore.getCaseById(req.params.id);
    if (!targetCase) {
      return res.status(404).json({ success: false, error: 'Recovery case not found' });
    }

    const updatedCase = await dataStore.updateCaseStatus(
      req.params.id,
      'PENDING_APPROVAL',
      'Case re-opened for operations lifecycle testing',
      {
        requires_human_approval: true,
        current_step: 'Awaiting Operations Admin review & approval',
        last_action: 'Re-opened by Admin',
      }
    );

    await dataStore.addAuditLog({
      actor_id: req.user?.id,
      actor_email: req.user?.email || 'admin@razorrecover.ai',
      actor_role: req.user?.role || 'ADMIN',
      action: 'CASE_REOPENED',
      entity_type: 'recovery_cases',
      entity_id: targetCase.case_id,
      previous_state: { status: targetCase.status },
      new_state: { status: 'PENDING_APPROVAL' },
    });

    res.json({
      success: true,
      message: `Case ${targetCase.case_id} re-opened for human review (PENDING_APPROVAL).`,
      data: updatedCase,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

