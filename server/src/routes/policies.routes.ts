import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPolicySchema } from '../schemas/zodSchemas';
import { dataStore } from '../services/dataStore';

const router = Router();

// GET /api/policies - List all policies
router.get('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const policies = await dataStore.getPolicies();
    res.json({ success: true, count: policies.length, data: policies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/policies - Create new recovery policy
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validate(createPolicySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const created = await dataStore.createPolicy(req.body);
      await dataStore.addAuditLog({
        actor_id: req.user?.id,
        actor_email: req.user?.email,
        actor_role: req.user?.role,
        action: 'POLICY_CREATED',
        entity_type: 'recovery_policies',
        entity_id: created.id,
        new_state: created as any,
      });

      res.status(201).json({ success: true, message: 'Policy created successfully', data: created });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// PATCH /api/policies/:id/toggle - Toggle policy active status
router.patch(
  '/:id/toggle',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const updated = await dataStore.togglePolicy(id, Boolean(is_active));
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Policy not found' });
      }
      res.json({ success: true, message: 'Policy status updated', data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
