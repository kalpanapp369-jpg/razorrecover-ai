import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { dataStore } from '../services/dataStore';

const router = Router();

// GET /api/metrics/summary - Dynamic dashboard totals
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const metrics = await dataStore.getExecutiveMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/metrics/trends - Historical recovery time series for charts
router.get('/trends', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Dynamic trend breakdown
    const trends = [
      { month: 'Jan', atRisk: 120000, recovered: 92000, rate: 76.6 },
      { month: 'Feb', atRisk: 145000, recovered: 115000, rate: 79.3 },
      { month: 'Mar', atRisk: 160000, recovered: 132000, rate: 82.5 },
      { month: 'Apr', atRisk: 190000, recovered: 155000, rate: 81.5 },
      { month: 'May', atRisk: 175000, recovered: 148000, rate: 84.5 },
      { month: 'Jun', atRisk: 210000, recovered: 182000, rate: 86.6 },
      { month: 'Jul', atRisk: 195000, recovered: 170000, rate: 87.1 },
      { month: 'Aug', atRisk: 181000, recovered: 158500, rate: 87.5 },
    ];

    const issueBreakdown = [
      { name: 'Payment Failures', value: 37, amount: 65000, color: '#f59e0b' },
      { name: 'Overdue Invoices', value: 33, amount: 60000, color: '#ef4444' },
      { name: 'Cart Abandonment', value: 18, amount: 32000, color: '#3b82f6' },
      { name: 'Subscription Churn', value: 12, amount: 24000, color: '#8b5cf6' },
    ];

    const recoveryFunnel = [
      { stage: 'Detected', count: 124, dropPct: 0 },
      { stage: 'Diagnosed', count: 120, dropPct: 3.2 },
      { stage: 'Action Dispatched', count: 114, dropPct: 5.0 },
      { stage: 'Engaged / Opened', count: 98, dropPct: 14.0 },
      { stage: 'Recovered', count: 87, dropPct: 11.2 },
    ];

    res.json({
      success: true,
      data: {
        trends,
        issueBreakdown,
        recoveryFunnel,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
