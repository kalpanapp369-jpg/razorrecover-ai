import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import crypto from 'crypto';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import casesRoutes from './routes/cases.routes';
import metricsRoutes from './routes/metrics.routes';
import customersRoutes from './routes/customers.routes';
import paymentsRoutes from './routes/payments.routes';
import subscriptionsRoutes from './routes/subscriptions.routes';
import invoicesRoutes from './routes/invoices.routes';
import simulationRoutes from './routes/simulation.routes';
import analyticsRoutes from './routes/analytics.routes';
import copilotRoutes from './routes/copilot.routes';
import auditRoutes from './routes/audit.routes';
import policiesRoutes from './routes/policies.routes';
import healthRoutes, { handleLiveness, handleReadiness } from './routes/health.routes';
import webhookRoutes from './routes/webhook.routes';

const app = express();

// 1. Request Correlation ID Middleware
app.use((req: any, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || `req_${crypto.randomUUID()}`;
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// 2. Standard Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;");
  next();
});

// 3. Strict CORS Middleware
app.use(cors({
  origin: [
    env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature', 'x-razorpay-event-id', 'x-request-id'],
}));

// 4. Body Parsers with 1MB Size Limit
app.use(express.json({
  limit: '1mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. Logging Middleware
app.use(morgan('dev'));

// Top-Level Health & Readiness Probes (Root Level)
app.get('/health', handleLiveness);
app.get('/ready', handleReadiness);

// API Routes
app.get('/api/health', handleLiveness);
app.get('/api/ready', handleReadiness);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/policies', policiesRoutes);
app.use('/api/webhooks', webhookRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = env.PORT || 5050;

const server = app.listen(PORT, () => {
  console.log(`
  ⚡ =======================================================
  ⚡  RazorRecover AI — Production Ready API Server Running
  ⚡  URL: http://localhost:${PORT}
  ⚡  Environment: ${env.NODE_ENV}
  ⚡  Operating Mode: RAZORPAY TEST MODE (${env.RECOVERY_EXECUTION_MODE})
  ⚡ =======================================================
  `);
});

// Graceful Shutdown Handlers (SIGTERM, SIGINT)
const handleGracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
  server.close(() => {
    console.log('✅ HTTP server closed. In-flight requests completed.');
    process.exit(0);
  });

  // Force close if graceful shutdown exceeds 10s
  setTimeout(() => {
    console.error('⚠️ Graceful shutdown timed out. Forcing termination.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default app;
