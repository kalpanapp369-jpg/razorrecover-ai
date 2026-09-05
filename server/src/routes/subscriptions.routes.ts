import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { dataStore } from '../services/dataStore';

const router = Router();

// GET /api/subscriptions - List subscriptions
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let customerId: string | undefined;
    if (req.user?.role === 'CUSTOMER') {
      const customer = await dataStore.getCustomerByUserId(req.user.id);
      customerId = customer?.id;
    }
    const subscriptions = await dataStore.getSubscriptions(customerId);
    res.json({ success: true, count: subscriptions.length, data: subscriptions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
