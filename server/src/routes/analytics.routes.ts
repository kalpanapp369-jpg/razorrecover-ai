import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { exportLimiter } from '../middleware/rateLimit';
import { dataStore } from '../services/dataStore';
import { exportService } from '../services/exportService';

const router = Router();

// GET /api/analytics - Comprehensive deep dive analytics data (Admin only)
router.get('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      status: req.query.status as string,
      paymentMethod: req.query.paymentMethod as string,
      currency: req.query.currency as string,
    };

    const [kpis, paymentAnalytics, recoveryAnalytics, failureAnalysis, aiAnalytics] = await Promise.all([
      dataStore.getExecutiveMetrics(),
      dataStore.getPaymentAnalytics(filters),
      dataStore.getRecoveryAnalytics(),
      dataStore.getFailureAnalysis(),
      dataStore.getAiAnalytics(),
    ]);

    res.json({
      success: true,
      data: {
        kpis,
        paymentAnalytics,
        recoveryAnalytics,
        failureAnalysis,
        aiAnalytics,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analytics/webhook-health - Webhook monitoring statistics
router.get('/webhook-health', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const health = await dataStore.getWebhookHealthStats();
    res.json({
      success: true,
      data: health,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analytics/export/:type - Sanitized CSV data export
router.get('/export/:type', exportLimiter, authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const exportType = req.params.type.toLowerCase();
    let csvContent = '';
    let filename = `export_${exportType}_${Date.now()}.csv`;

    if (exportType === 'cases') {
      const cases = await dataStore.getCases();
      csvContent = exportService.exportCasesCsv(cases);
    } else if (exportType === 'payments') {
      const payments = await dataStore.getPayments();
      csvContent = exportService.exportPaymentsCsv(payments);
    } else if (exportType === 'analytics') {
      const [kpis, failureAnalysis] = await Promise.all([
        dataStore.getExecutiveMetrics(),
        dataStore.getFailureAnalysis(),
      ]);
      csvContent = exportService.exportAnalyticsCsv({ kpis, failureAnalysis });
    } else if (exportType === 'audit-logs' || exportType === 'audit') {
      const logs = await dataStore.getAuditLogs();
      csvContent = exportService.exportAuditLogsCsv(logs);
    } else {
      return res.status(400).json({
        success: false,
        error: `Unsupported export type: ${exportType}. Allowed types: cases, payments, analytics, audit-logs`,
      });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
