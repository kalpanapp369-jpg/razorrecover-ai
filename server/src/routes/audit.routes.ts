import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { dataStore } from '../services/dataStore';

const router = Router();

const auditQuerySchema = z.object({
  action: z.string().optional(),
  actor: z.string().optional(),
  entity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/audit-logs/stats - Aggregate audit analytics
router.get('/stats', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const stats = await dataStore.getAuditAnalytics();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/audit-logs - List audit logs with pagination & filtering
router.get('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = auditQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Invalid query parameters',
      });
    }

    const { action, actor, entity, startDate, endDate, page, pageSize } = parseResult.data;

    let logs = await dataStore.getAuditLogs();

    if (action) logs = logs.filter((l) => l.action.toLowerCase().includes(action.toLowerCase()));
    if (actor) logs = logs.filter((l) => (l.actor_email || l.actor_role || '').toLowerCase().includes(actor.toLowerCase()));
    if (entity) logs = logs.filter((l) => (l.entity_type || '').toLowerCase().includes(entity.toLowerCase()) || (l.entity_id || '').includes(entity));
    if (startDate) logs = logs.filter((l) => new Date(l.created_at) >= new Date(startDate));
    if (endDate) logs = logs.filter((l) => new Date(l.created_at) <= new Date(endDate));

    const total = logs.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = logs.slice(startIndex, startIndex + pageSize);

    res.json({
      success: true,
      data: paginatedItems,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
