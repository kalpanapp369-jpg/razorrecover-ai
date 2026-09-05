import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['ADMIN', 'CUSTOMER']).default('CUSTOMER'),
  company: z.string().optional(),
  phone: z.string().optional(),
});

export const caseFilterSchema = z.object({
  issueType: z.enum(['PAYMENT_FAILURE', 'CHECKOUT_ABANDONMENT', 'SUBSCRIPTION_FAILURE', 'OVERDUE_INVOICE']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum([
    'DETECTED', 'ANALYZING', 'RECOMMENDED', 'PENDING_APPROVAL', 
    'APPROVED', 'EXECUTING', 'VERIFYING', 'RECOVERED', 'FAILED', 'STOPPED', 'ESCALATED'
  ]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['amount_desc', 'risk_desc', 'newest', 'oldest']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const caseApprovalSchema = z.object({
  caseId: z.string().optional(),
  action: z.enum(['APPROVE', 'REJECT', 'STOP']),
  notes: z.string().optional(),
});

export const caseActionReasonSchema = z.object({
  reason: z.string().min(3, 'A reason of at least 3 characters is required'),
  notes: z.string().optional(),
});

export const createPolicySchema = z.object({
  name: z.string().min(3, 'Policy name is required'),
  description: z.string().optional(),
  issue_type: z.enum(['PAYMENT_FAILURE', 'CHECKOUT_ABANDONMENT', 'SUBSCRIPTION_FAILURE', 'OVERDUE_INVOICE']).optional(),
  min_amount: z.number().min(0).optional(),
  max_amount: z.number().min(0).optional(),
  max_discount_pct: z.number().min(0).max(100).optional(),
  max_retries: z.number().int().min(1).max(10).default(3),
  auto_approve: z.boolean().default(true),
  is_active: z.boolean().default(true),
  priority: z.number().int().default(1),
});

export const simulationRunSchema = z.object({
  name: z.string().min(3, 'Simulation name is required'),
  description: z.string().optional(),
  scenario_type: z.enum(['HISTORICAL_PLAYBACK', 'STRESS_TEST', 'HIGH_CHURN_SURGE']).default('HISTORICAL_PLAYBACK'),
  sample_size: z.number().int().min(10).max(5000).default(200),
  discount_strategy_pct: z.number().min(0).max(30).default(5),
});
