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

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
  company?: string | null;
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
  customer?: Customer;
  payment?: PaymentRecord;
  ai_root_cause?: string;
  ai_category?: string;
  ai_severity?: string;
  ai_confidence?: number;
  ai_recovery_probability?: number;
  ai_expected_recovery?: number;
  ai_recommended_action?: string;
  ai_recommended_action_type?: string;
  ai_reasoning_summary?: string;
  ai_customer_facing_explanation?: string;
  ai_model?: string;
  diagnosis_source?: string;
  ai_status?: string;
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

export interface RecoveryAction {
  id: string;
  action_id: string;
  case_id: string;
  action_type: 'RETRY_PAYMENT' | 'ALTERNATIVE_PAYMENT_METHOD' | 'MANUAL_REVIEW' | 'NO_ACTION';
  channel: string;
  status: 'PLANNED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'SUCCEEDED' | 'EXECUTED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  reason: string;
  source: string;
  confidence: number;
  estimated_recovery: number;
  requires_approval: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  execution_mode: 'TEST' | 'SIMULATION';
  attempt_number: number;
  max_attempts: number;
  started_at?: string | null;
  completed_at?: string | null;
  next_eligible_at?: string | null;
  provider_reference?: string | null;
  recovered_amount: number;
  error_code?: string | null;
  error_message?: string | null;
  idempotency_key?: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
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
  requires_human_approval?: boolean;
  auto_execute?: boolean;
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
  // Executive KPI additions
  totalPayments?: number;
  successfulPayments?: number;
  failedPayments?: number;
  totalPaymentValue?: number;
  amountAtRisk?: number;
  amountRecovered?: number;
  pendingApprovals?: number;
  averageRecoveryTime?: string;
  executionMode?: string;
}

export interface ExecutiveKpis {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalPaymentValue: number;
  amountAtRisk: number;
  amountRecovered: number;
  recoveryRate: number;
  activeCases: number;
  pendingApprovals: number;
  averageRecoveryTime: string;
  averageRecoveryTimeMinutes: number;
  executionMode: string;
  currency: string;
}

export interface PaymentAnalyticsData {
  totalCount: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
  totalVolume: number;
  failedVolume: number;
  failureRate: number;
  byMethod: Array<{ method: string; count: number; volume: number }>;
}

export interface RecoveryAnalyticsData {
  statusCounts: {
    detected: number;
    diagnosed: number;
    awaitingApproval: number;
    approved: number;
    executing: number;
    recovered: number;
    failed: number;
    stopped: number;
  };
  amountAtRisk: number;
  amountRecovered: number;
  recoveryRate: number;
  averageAttemptsPerRecoveredCase: number;
  totalCasesCount: number;
}

export interface FailureAnalysisData {
  byRootCause: Array<{ category: string; count: number }>;
  byIssueType: Array<{ type: string; count: number }>;
  byRiskLevel: Array<{ level: string; count: number }>;
  byErrorCode: Array<{ code: string; count: number }>;
}

export interface AiAnalyticsData {
  totalDiagnoses: number;
  geminiDiagnoses: number;
  ruleFallbackDiagnoses: number;
  averageConfidence: number;
  averageRecoveryProbability: number;
  outcomeMatrix: Array<{
    recommendation: string;
    recovered: number;
    failed: number;
    pending: number;
  }>;
  disclaimer: string;
}

export interface WebhookHealthData {
  status: 'HEALTHY' | 'WARNING' | 'ERROR';
  lastWebhookReceived: string;
  totalWebhooks: number;
  successfulProcessing: number;
  failedProcessing: number;
  duplicateEvents: number;
  averageProcessingLatencyMs: number;
  lastProcessingError?: string | null;
}

export interface SystemHealthData {
  status: string;
  app: string;
  version: string;
  executionMode: string;
  systems: {
    backend: { status: string; uptimeSeconds: number };
    database: { status: string; configured: boolean; connected: boolean };
    razorpay: { status: string; configured: boolean; testMode: boolean; keyIdMasked?: string | null };
    geminiAi: { status: string; model: string; role: string };
    webhooks: { status: string; lastReceived: string; totalEvents: number };
  };
  timestamp: string;
}

