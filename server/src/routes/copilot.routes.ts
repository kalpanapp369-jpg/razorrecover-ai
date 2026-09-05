import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { dataStore } from '../services/dataStore';

const router = Router();

let mockCopilotMessages = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: 'Hello! I am your RazorRecover AI Assistant. I monitor real-time transaction telemetry, failed checkout sessions, and overdue receivables. How can I assist you with recovery operations today?',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  }
];

// GET /api/copilot/messages
router.get('/messages', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: mockCopilotMessages });
});

// POST /api/copilot/messages - Send prompt to Copilot
router.post('/messages', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  const userMsg = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  };
  mockCopilotMessages.push(userMsg);

  // Generate contextual AI response based on live metrics
  const metrics = await dataStore.getMetrics();
  let aiReply = `I've analyzed your telemetry. Currently, ₹${metrics.revenueAtRisk.toLocaleString('en-IN')} is at risk across ${metrics.activeCases} active cases. Your current recovery rate is ${metrics.recoveryRate}%.`;
  
  const lower = message.toLowerCase();
  if (lower.includes('approval') || lower.includes('pending') || lower.includes('urgent')) {
    aiReply = `You have 1 high-priority invoice case (REC-2026-001) for Stellar Cloud Tech (₹60,000) waiting for approval to apply a 5% prompt settlement credit. Approving this is projected to recover ₹49,200 (82% probability).`;
  } else if (lower.includes('policy') || lower.includes('rule')) {
    aiReply = `Your active policies currently auto-retry card failures under ₹50,000 and apply up to 10% coupon incentives on abandoned checkout carts. Overdue invoices over ₹50,000 are safely gated behind human approval.`;
  } else if (lower.includes('failure') || lower.includes('card')) {
    aiReply = `Card network declines account for 37% of recent failures. The AI engine recommends scheduling retries between 10:00 AM - 11:30 AM on business days and sending fallback UPI links via WhatsApp for instant resolution.`;
  }

  const assistantMsg = {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    content: aiReply,
    timestamp: new Date().toISOString(),
  };
  mockCopilotMessages.push(assistantMsg);

  res.json({
    success: true,
    data: {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    },
  });
});

export default router;
