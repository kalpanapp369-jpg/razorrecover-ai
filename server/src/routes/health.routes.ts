import { Router, Request, Response } from 'express';
import { testSupabaseConnection, isSupabaseConfigured } from '../config/supabase';
import { razorpayService } from '../services/razorpay/razorpayService';
import { env } from '../config/env';
import { dataStore } from '../services/dataStore';

const router = Router();

// Liveness Probe Handler
export const handleLiveness = async (_req: Request, res: Response) => {
  const dbCheck = await testSupabaseConnection();
  const razorpayStatus = razorpayService.getStatus();
  const webhookStats = await dataStore.getWebhookHealthStats();
  const geminiConfigured = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 5);

  res.json({
    status: 'healthy',
    environment: env.NODE_ENV,
    app: 'RazorRecover AI API Server',
    version: '1.0.0',
    executionMode: 'RAZORPAY TEST MODE',
    recoveryExecutionMode: env.RECOVERY_EXECUTION_MODE,
    razorpayMode: razorpayStatus.testMode ? 'TEST' : (razorpayStatus.configured ? 'LIVE' : 'unconfigured'),
    database: dbCheck.connected ? 'connected' : (isSupabaseConfigured ? 'degraded' : 'mock_store_active'),
    razorpay: razorpayStatus.testMode ? 'TEST' : (razorpayStatus.configured ? 'LIVE' : 'unconfigured'),
    webhook: webhookStats.status === 'ERROR' ? 'degraded' : 'ready',
    gemini: geminiConfigured ? 'configured' : 'fallback',
    systems: {
      razorpay: { status: razorpayStatus.testMode ? 'TEST' : 'unconfigured' },
      geminiAi: { status: geminiConfigured ? 'configured' : 'fallback' },
      database: { status: dbCheck.connected ? 'connected' : 'mock_store_active' },
      webhook: { status: webhookStats.status === 'ERROR' ? 'degraded' : 'ready' },
    },
    timestamp: new Date().toISOString(),
  });
};

// Readiness Probe Handler
export const handleReadiness = async (_req: Request, res: Response) => {
  const dbCheck = await testSupabaseConnection();
  const razorpayStatus = razorpayService.getStatus();

  const isReady = razorpayStatus.testMode;

  if (isReady) {
    return res.json({
      status: 'ready',
      database: dbCheck.connected ? 'connected' : 'mock_store_active',
      razorpay: 'TEST_MODE',
      recoveryEngine: 'ready',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(503).json({
    status: 'not_ready',
    error: 'Razorpay must be configured in TEST MODE',
    timestamp: new Date().toISOString(),
  });
};

router.get('/', handleLiveness);
router.get('/ready', handleReadiness);

export default router;
