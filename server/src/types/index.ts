export type UserRole = 'ADMIN' | 'CUSTOMER';

export type IssueType = 
  | 'PAYMENT_FAILURE' 
  | 'CHECKOUT_ABANDONMENT' 
  | 'SUBSCRIPTION_FAILURE' 
  | 'OVERDUE_INVOICE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type CaseStatus = 
  | 'DETECTED' 
  | 'ANALYZING' 
  | 'RECOMMENDED' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'EXECUTING' 
  | 'VERIFYING' 
  | 'RECOVERED' 
  | 'FAILED' 
  | 'STOPPED' 
  | 'ESCALATED';

export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED' | 'RECOVERED';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'RECOVERED' | 'UNPAID';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'OVERDUE' | 'PAID' | 'VOID' | 'WRITTEN_OFF' | 'RECOVERED';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  phone?: string | null;
  company?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id?: string | null;
  external_customer_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: string;
  risk_score: number;
  risk_level: RiskLevel;
  total_spend: number;
  total_risk_amount: number;
  recovered_amount: number;
  lifetime_value: number;
  created_at: string;
  updated_at: string;
}

export interface RecoveryCase {
  id: string;
  case_id: string;
  customer_id: string;
  payment_id?: string | null;
  subscription_id?: string | null;
  invoice_id?: string | null;
  checkout_session_id?: string | null;
  issue_type: IssueType;
  amount_at_risk: number;
  risk_score: number;
  risk_level: RiskLevel;
  root_cause: string | null;
  confidence: number;
  recommended_action: string | null;
  recovery_probability: number;
  expected_recovery: number;
  status: CaseStatus;
  requires_human_approval: boolean;
  current_step: string | null;
  last_action: string | null;
  assigned_to?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  // Gemini AI Fields (Phase 4)
  diagnosis_source?: 'GEMINI_AI' | 'RULE_BASED_FALLBACK' | string | null;
  ai_category?: string | null;
  ai_root_cause?: string | null;
  ai_confidence?: number | null;
  ai_recovery_probability?: number | null;
  ai_expected_recovery?: number | null;
  ai_recommended_action?: string | null;
  ai_recommended_action_type?: string | null;
  ai_reasoning_summary?: string | null;
  ai_customer_facing_explanation?: string | null;
  ai_model?: string | null;
  ai_diagnosed_at?: string | null;
}

export interface PaymentRecord {
  id: string;
  customer_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: string;
  payment_method?: string | null;
  error_code?: string | null;
  error_description?: string | null;
  attempts_count: number;
  last_attempted_at?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface SubscriptionRecord {
  id: string;
  customer_id: string;
  subscription_code: string;
  plan_name: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  next_billing_at?: string | null;
  grace_period_ends_at?: string | null;
  dunning_stage: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface InvoiceRecord {
  id: string;
  customer_id: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string;
  days_overdue: number;
  payment_link?: string | null;
  line_items?: any[];
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface RecoveryPolicy {
  id: string;
  name: string;
  description?: string | null;
  issue_type?: IssueType | null;
  min_amount?: number;
  max_amount?: number;
  max_discount_pct?: number;
  max_retries?: number;
  auto_approve: boolean;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface DashboardMetrics {
  revenueAtRisk: number;
  revenueRecovered: number;
  recoveryRate: number;
  activeCases: number;
  aiResolved: number;
  humanEscalations: number;
  currency: string;
  totalCasesCount: number;
}
