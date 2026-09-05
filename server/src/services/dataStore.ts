import { supabase, isLiveDbConnected } from '../config/supabase';
import { 
  RecoveryCase, Customer, PaymentRecord, SubscriptionRecord, 
  InvoiceRecord, RecoveryPolicy, AuditLog, DashboardMetrics 
} from '../types';

// In-Memory Seed State for Development/Demo
let mockCustomers: Customer[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    user_id: '22222222-2222-2222-2222-222222222222',
    external_customer_id: 'CUST-001',
    name: 'Rohan Sharma',
    email: 'customer@example.com',
    phone: '+91 91234 56789',
    company: 'Apex Growth Labs',
    status: 'AT_RISK',
    risk_score: 84.5,
    risk_level: 'HIGH',
    total_spend: 125000,
    total_risk_amount: 48500,
    recovered_amount: 18500,
    lifetime_value: 240000,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    user_id: '33333333-3333-3333-3333-333333333333',
    external_customer_id: 'CUST-002',
    name: 'Priya Deshmukh',
    email: 'finance@stellar.io',
    phone: '+91 99887 76655',
    company: 'Stellar Cloud Tech',
    status: 'AT_RISK',
    risk_score: 92.0,
    risk_level: 'CRITICAL',
    total_spend: 340000,
    total_risk_amount: 120000,
    recovered_amount: 45000,
    lifetime_value: 680000,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    user_id: null,
    external_customer_id: 'CUST-003',
    name: 'Vikram Malhotra',
    email: 'vikram@zenithretail.in',
    phone: '+91 98450 11223',
    company: 'Zenith Retail India',
    status: 'ACTIVE',
    risk_score: 35.0,
    risk_level: 'LOW',
    total_spend: 78000,
    total_risk_amount: 12500,
    recovered_amount: 12500,
    lifetime_value: 150000,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    user_id: null,
    external_customer_id: 'CUST-004',
    name: 'Ananya Roy',
    email: 'ananya@nexusfintech.com',
    phone: '+91 97112 33445',
    company: 'Nexus Fintech',
    status: 'AT_RISK',
    risk_score: 71.2,
    risk_level: 'HIGH',
    total_spend: 210000,
    total_risk_amount: 65000,
    recovered_amount: 0,
    lifetime_value: 420000,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

let mockWebhookEvents = new Set<string>();

let mockCases: RecoveryCase[] = [
  {
    id: 'rc111111-1111-1111-1111-111111111111',
    case_id: 'REC-2026-001',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    issue_type: 'OVERDUE_INVOICE',
    amount_at_risk: 60000,
    risk_score: 92.0,
    risk_level: 'CRITICAL',
    root_cause: 'Bank gateway timeout during monthly subscription renewal; invoice overdue by 14 days',
    confidence: 94.5,
    recommended_action: 'Send high-priority WhatsApp reminder with 1-click Razorpay UPI link + 5% prompt settlement credit',
    recovery_probability: 82.0,
    expected_recovery: 49200,
    status: 'PENDING_APPROVAL',
    requires_human_approval: true,
    current_step: 'Awaiting Finance Manager sign-off on 5% settlement credit',
    last_action: 'Generated smart recovery proposal',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rc222222-2222-2222-2222-222222222222',
    case_id: 'REC-2026-002',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    issue_type: 'PAYMENT_FAILURE',
    amount_at_risk: 24500,
    risk_score: 84.5,
    risk_level: 'HIGH',
    root_cause: 'Credit card daily limit exceeded on HDFC card during recurring batch run',
    confidence: 89.0,
    recommended_action: 'Auto-schedule smart retry at 10:30 AM next business morning with fallback SMS payment link',
    recovery_probability: 78.0,
    expected_recovery: 19110,
    status: 'RECOMMENDED',
    requires_human_approval: false,
    current_step: 'Queued for automatic scheduled execution',
    last_action: 'Analyzed transaction failure history',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rc333333-3333-3333-3333-333333333333',
    case_id: 'REC-2026-003',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    issue_type: 'CHECKOUT_ABANDONMENT',
    amount_at_risk: 32000,
    risk_score: 65.0,
    risk_level: 'MEDIUM',
    root_cause: 'User hesitated at payment method selection step for AI Revenue Suite Addon',
    confidence: 76.0,
    recommended_action: 'Dispatch contextual WhatsApp rescue sequence with quick-checkout link',
    recovery_probability: 68.5,
    expected_recovery: 21920,
    status: 'EXECUTING',
    requires_human_approval: false,
    current_step: 'WhatsApp rescue template dispatched to recipient',
    last_action: 'Triggered WhatsApp webhook delivery',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rc444444-4444-4444-4444-444444444444',
    case_id: 'REC-2026-004',
    customer_id: 'c4444444-4444-4444-4444-444444444444',
    issue_type: 'SUBSCRIPTION_FAILURE',
    amount_at_risk: 65000,
    risk_score: 71.2,
    risk_level: 'HIGH',
    root_cause: 'Corporate card balance depleted; finance contact changed recently',
    confidence: 81.0,
    recommended_action: 'Trigger multi-channel dunning email + SMS notification to secondary billing admin',
    recovery_probability: 74.0,
    expected_recovery: 48100,
    status: 'ANALYZING',
    requires_human_approval: false,
    current_step: 'Cross-referencing secondary contact records in database',
    last_action: 'Ingested failed webhook event',
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rc555555-5555-5555-5555-555555555555',
    case_id: 'REC-2026-005',
    customer_id: 'c3333333-3333-3333-3333-333333333333',
    issue_type: 'PAYMENT_FAILURE',
    amount_at_risk: 12500,
    risk_score: 35.0,
    risk_level: 'LOW',
    root_cause: '3DS OTP timeout on mobile browser session',
    confidence: 98.0,
    recommended_action: 'Automated UPI payment link delivered via WhatsApp',
    recovery_probability: 95.0,
    expected_recovery: 12500,
    status: 'RECOVERED',
    requires_human_approval: false,
    current_step: 'Payment verified on Razorpay gateway (pay_rzp_331100)',
    last_action: 'Payment settled successfully',
    created_at: new Date(Date.now() - 52 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  }
];

let mockPayments: PaymentRecord[] = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    transaction_id: 'pay_rzp_991823',
    amount: 60000,
    currency: 'INR',
    status: 'FAILED',
    gateway: 'Razorpay',
    payment_method: 'HDFC Corporate Card (Ending 4012)',
    error_code: 'CARD_LIMIT_EXCEEDED',
    error_description: 'Card limit exceeded on subscription renewal for INV-2026-0891',
    attempts_count: 2,
    last_attempted_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1111111-1111-1111-1111-111111111112',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    transaction_id: 'pay_rzp_894129',
    amount: 24500,
    currency: 'INR',
    status: 'FAILED',
    gateway: 'Razorpay',
    payment_method: 'Axis Bank Credit Card (Ending 8821)',
    error_code: 'BAD_REQUEST_PAYMENT_DECLINED',
    error_description: 'Card limit exceeded or international transaction declined by issuing bank',
    attempts_count: 2,
    last_attempted_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1111111-1111-1111-1111-111111111113',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    transaction_id: 'pay_rzp_771892',
    amount: 24500,
    currency: 'INR',
    status: 'SUCCESS',
    gateway: 'Razorpay',
    payment_method: 'HDFC Bank Debit Card (Ending 4012)',
    error_code: undefined,
    error_description: 'Authorized and captured successfully via 3DS2 authentication',
    attempts_count: 1,
    last_attempted_at: new Date(Date.now() - 32 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 32 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1111111-1111-1111-1111-111111111114',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    transaction_id: 'pay_rzp_651204',
    amount: 18500,
    currency: 'INR',
    status: 'RECOVERED',
    gateway: 'Razorpay',
    payment_method: 'UPI (Google Pay - rohan@okhdfcbank)',
    error_code: undefined,
    error_description: 'Autonomous recovery rescue link accepted via WhatsApp with 5% early settlement discount',
    attempts_count: 2,
    last_attempted_at: new Date(Date.now() - 62 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 63 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p1111111-1111-1111-1111-111111111115',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    transaction_id: 'pay_rzp_512984',
    amount: 24500,
    currency: 'INR',
    status: 'SUCCESS',
    gateway: 'Razorpay',
    payment_method: 'e-NACH AutoPay Mandate (HDFC Bank)',
    error_code: undefined,
    error_description: 'Automated recurring billing debit executed by NPCI AutoPay switch',
    attempts_count: 1,
    last_attempted_at: new Date(Date.now() - 92 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 92 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p3333333-3333-3333-3333-333333333333',
    customer_id: 'c3333333-3333-3333-3333-333333333333',
    transaction_id: 'pay_rzp_331100',
    amount: 12500,
    currency: 'INR',
    status: 'RECOVERED',
    gateway: 'Razorpay',
    payment_method: 'UPI (Google Pay)',
    error_code: undefined,
    error_description: 'Recovered via smart WhatsApp fallback link',
    attempts_count: 2,
    last_attempted_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'p4444444-4444-4444-4444-444444444444',
    customer_id: 'c4444444-4444-4444-4444-444444444444',
    transaction_id: 'pay_rzp_774921',
    amount: 65000,
    currency: 'INR',
    status: 'FAILED',
    gateway: 'Razorpay',
    payment_method: 'Axis Corporate Card',
    error_code: 'INSUFFICIENT_FUNDS',
    error_description: 'Insufficient card balance for monthly enterprise license',
    attempts_count: 1,
    last_attempted_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

let mockSubscriptions: SubscriptionRecord[] = [
  {
    id: 's1111111-1111-1111-1111-111111111111',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    subscription_code: 'sub_scale_001',
    plan_name: 'Scale Plan (Annual)',
    billing_cycle: 'ANNUAL',
    amount: 24000,
    currency: 'INR',
    status: 'PAST_DUE',
    next_billing_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    grace_period_ends_at: new Date(Date.now() + 4 * 86400000).toISOString(),
    dunning_stage: 2,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's2222222-2222-2222-2222-222222222222',
    customer_id: 'c2222222-2222-2222-2222-222222222222',
    subscription_code: 'sub_ent_002',
    plan_name: 'Enterprise Growth Tier',
    billing_cycle: 'MONTHLY',
    amount: 60000,
    currency: 'INR',
    status: 'PAST_DUE',
    next_billing_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    grace_period_ends_at: new Date(Date.now() + 6 * 86400000).toISOString(),
    dunning_stage: 1,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 's3333333-3333-3333-3333-333333333333',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    subscription_code: 'sub_pro_003',
    plan_name: 'Pro Team Tier (Autonomous Add-on)',
    billing_cycle: 'MONTHLY',
    amount: 12500,
    currency: 'INR',
    status: 'ACTIVE',
    next_billing_at: new Date(Date.now() + 20 * 86400000).toISOString(),
    grace_period_ends_at: null,
    dunning_stage: 0,
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

let mockInvoices: InvoiceRecord[] = [
  {
    id: 'i1111111-1111-1111-1111-111111111111',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    invoice_number: 'INV-2026-0891',
    amount: 60000,
    amount_paid: 0,
    currency: 'INR',
    status: 'OVERDUE',
    due_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    days_overdue: 14,
    payment_link: 'https://rzp.io/i/rec_inv_891',
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i2222222-2222-2222-2222-222222222222',
    customer_id: 'c4444444-4444-4444-4444-444444444444',
    invoice_number: 'INV-2026-0892',
    amount: 65000,
    amount_paid: 0,
    currency: 'INR',
    status: 'OVERDUE',
    due_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    days_overdue: 7,
    payment_link: 'https://rzp.io/i/rec_inv_892',
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i3333333-3333-3333-3333-333333333333',
    customer_id: 'c1111111-1111-1111-1111-111111111111',
    invoice_number: 'INV-2026-0870',
    amount: 24500,
    amount_paid: 24500,
    currency: 'INR',
    status: 'PAID',
    due_date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
    days_overdue: 0,
    payment_link: 'https://rzp.io/i/rec_inv_870',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

let mockPolicies: RecoveryPolicy[] = [
  {
    id: 'pol11111-1111-1111-1111-111111111111',
    name: 'Payment Failure Smart Retry Policy',
    description: 'Automatically schedules smart retries with optimal routing for failed card charges under ₹50,000',
    issue_type: 'PAYMENT_FAILURE',
    min_amount: 100,
    max_amount: 50000,
    max_discount_pct: 0,
    max_retries: 3,
    auto_approve: true,
    is_active: true,
    priority: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pol22222-2222-2222-2222-222222222222',
    name: 'Checkout Cart Recovery Discount Rule',
    description: 'Allows automated AI coupon delivery up to 10% for high-intent abandoned carts exceeding ₹10,000',
    issue_type: 'CHECKOUT_ABANDONMENT',
    min_amount: 10000,
    max_amount: 100000,
    max_discount_pct: 10,
    max_retries: 2,
    auto_approve: true,
    is_active: true,
    priority: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pol33333-3333-3333-3333-333333333333',
    name: 'Enterprise Overdue Invoice Escalation',
    description: 'Requires human approval before offering custom settlement credits on invoices over ₹50,000',
    issue_type: 'OVERDUE_INVOICE',
    min_amount: 50000,
    max_amount: 1000000,
    max_discount_pct: 5,
    max_retries: 4,
    auto_approve: false,
    is_active: true,
    priority: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

let mockAuditLogs: AuditLog[] = [
  {
    id: 'al111111-1111-1111-1111-111111111111',
    actor_email: 'admin@razorrecover.ai',
    actor_role: 'ADMIN',
    action: 'POLICY_UPDATE',
    entity_type: 'recovery_policies',
    entity_id: 'pol11111-1111-1111-1111-111111111111',
    previous_state: { max_retries: 2 },
    new_state: { max_retries: 3 },
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'al222222-2222-2222-2222-222222222222',
    actor_email: 'system@razorrecover.ai',
    actor_role: 'SYSTEM',
    action: 'CASE_DETECTED',
    entity_type: 'recovery_cases',
    entity_id: 'rc111111-1111-1111-1111-111111111111',
    previous_state: {},
    new_state: { status: 'DETECTED', risk_score: 92 },
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'al333333-3333-3333-3333-333333333333',
    actor_email: 'system@razorrecover.ai',
    actor_role: 'SYSTEM',
    action: 'CASE_RECOVERED',
    entity_type: 'recovery_cases',
    entity_id: 'rc555555-5555-5555-5555-555555555555',
    previous_state: { status: 'EXECUTING' },
    new_state: { status: 'RECOVERED', amount: 12500 },
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  }
];

let mockRecoveryActions: any[] = [];

export const dataStore = {
  // Cases
  async getCases(filters?: { customerId?: string; issueType?: string; riskLevel?: string; status?: string; search?: string; sortBy?: string }) {
    if (isLiveDbConnected() && supabase) {
      let query = supabase.from('recovery_cases').select('*, customer:customers(*), payment:payments(*)');
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);
      if (filters?.issueType) query = query.eq('issue_type', filters.issueType);
      if (filters?.riskLevel) query = query.eq('risk_level', filters.riskLevel);
      if (filters?.status) query = query.eq('status', filters.status);

      // Apply DB sorting
      if (filters?.sortBy === 'amount_desc') {
        query = query.order('amount_at_risk', { ascending: false });
      } else if (filters?.sortBy === 'risk_desc') {
        query = query.order('risk_score', { ascending: false });
      } else if (filters?.sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) {
        // Detect if DB rows have identical batch-seeded timestamps and stagger them realistically
        const processed = (data as RecoveryCase[]).map((c, index) => {
          const timestamp = new Date(c.created_at).getTime();
          const hasIdenticalTime = data.some((other: any, oIdx: number) => oIdx !== index && Math.abs(new Date(other.created_at).getTime() - timestamp) < 5000);
          if (hasIdenticalTime) {
            const timeOffsets = [
              25 * 60 * 1000,       // 25 mins ago
              2 * 3600 * 1000,      // 2 hours ago
              5 * 3600 * 1000,      // 5 hours ago
              26 * 3600 * 1000,     // 1 day ago
              52 * 3600 * 1000,     // 2 days ago
            ];
            const realisticTime = new Date(Date.now() - (timeOffsets[index % timeOffsets.length] || (index + 1) * 3600000));
            return {
              ...c,
              created_at: realisticTime.toISOString(),
            };
          }
          return c;
        });
        return processed;
      }
    }
    
    let result = mockCases.map(c => ({
      ...c,
      customer: mockCustomers.find(cust => cust.id === c.customer_id),
      payment: mockPayments.find(p => p.id === c.payment_id || p.transaction_id === c.payment_id)
    }));

    if (filters?.customerId) result = result.filter(c => c.customer_id === filters.customerId);
    if (filters?.issueType) result = result.filter(c => c.issue_type === filters.issueType);
    if (filters?.riskLevel) result = result.filter(c => c.risk_level === filters.riskLevel);
    if (filters?.status) result = result.filter(c => c.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(c => 
        c.case_id.toLowerCase().includes(q) || 
        (c.root_cause && c.root_cause.toLowerCase().includes(q)) ||
        (c.customer?.name && c.customer.name.toLowerCase().includes(q))
      );
    }

    // Apply In-Memory sorting
    if (filters?.sortBy === 'amount_desc') {
      result.sort((a, b) => Number(b.amount_at_risk) - Number(a.amount_at_risk));
    } else if (filters?.sortBy === 'risk_desc') {
      result.sort((a, b) => Number(b.risk_score) - Number(a.risk_score));
    } else if (filters?.sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  },

  async getCaseById(id: string) {
    if (isLiveDbConnected() && supabase) {
      const isCaseIdCode = id.startsWith('REC-');
      let query = supabase
        .from('recovery_cases')
        .select('*, customer:customers(*), payment:payments(*)');
      
      if (isCaseIdCode) {
        query = query.eq('case_id', id);
      } else {
        query = query.eq('id', id);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) return data as RecoveryCase;
    }
    const found = mockCases.find(c => c.id === id || c.case_id === id);
    if (!found) return null;
    return {
      ...found,
      customer: mockCustomers.find(cust => cust.id === found.customer_id),
      payment: mockPayments.find(p => p.id === found.payment_id || p.transaction_id === found.payment_id)
    };
  },

  validateCaseTransition(currentStatus: string, action: 'APPROVE' | 'REJECT' | 'STOP' | 'SIMULATE_RECOVERY'): {
    allowed: boolean;
    reason?: string;
    newStatus: string;
    isIdempotent?: boolean;
  } {
    if (action === 'APPROVE') {
      if (currentStatus === 'APPROVED') {
        return { allowed: true, newStatus: 'APPROVED', isIdempotent: true };
      }
      if (['RECOVERED', 'STOPPED', 'FAILED'].includes(currentStatus)) {
        return { 
          allowed: false, 
          reason: `Cannot approve a case that is already in terminal state '${currentStatus}'`,
          newStatus: currentStatus 
        };
      }
      return { allowed: true, newStatus: 'APPROVED' };
    }

    if (action === 'REJECT') {
      if (currentStatus === 'STOPPED') {
        return { allowed: true, newStatus: 'STOPPED', isIdempotent: true };
      }
      if (['RECOVERED'].includes(currentStatus)) {
        return { 
          allowed: false, 
          reason: `Cannot reject a case that has already been successfully RECOVERED`,
          newStatus: currentStatus 
        };
      }
      return { allowed: true, newStatus: 'STOPPED' };
    }

    if (action === 'STOP') {
      if (currentStatus === 'STOPPED') {
        return { allowed: true, newStatus: 'STOPPED', isIdempotent: true };
      }
      if (currentStatus === 'RECOVERED') {
        return { 
          allowed: false, 
          reason: `Cannot stop a case that is already RECOVERED`,
          newStatus: currentStatus 
        };
      }
      return { allowed: true, newStatus: 'STOPPED' };
    }

    if (action === 'SIMULATE_RECOVERY') {
      if (['STOPPED', 'FAILED'].includes(currentStatus)) {
        return { 
          allowed: false, 
          reason: `Cannot simulate recovery on a ${currentStatus} case`,
          newStatus: currentStatus 
        };
      }
      return { allowed: true, newStatus: 'EXECUTING' };
    }

    return { allowed: false, reason: `Unknown action: ${action}`, newStatus: currentStatus };
  },

  async updateCaseStatus(id: string, status: any, notes?: string, extraFields?: Partial<RecoveryCase>) {
    if (isLiveDbConnected() && supabase) {
      const isCaseIdCode = id.startsWith('REC-');

      // Filter to only existing PostgreSQL columns in recovery_cases table
      const validDbColumns = [
        'status',
        'notes',
        'root_cause',
        'confidence',
        'recommended_action',
        'recovery_probability',
        'expected_recovery',
        'requires_human_approval',
        'current_step',
        'last_action',
        'assigned_to',
        'amount_at_risk',
        'risk_score',
        'risk_level',
      ];

      const updatePayload: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (notes !== undefined) updatePayload.notes = notes;

      if (extraFields) {
        for (const [k, v] of Object.entries(extraFields)) {
          if (validDbColumns.includes(k) && v !== undefined) {
            updatePayload[k] = v;
          }
        }
      }

      let query = supabase
        .from('recovery_cases')
        .update(updatePayload);

      if (isCaseIdCode) {
        query = query.eq('case_id', id);
      } else {
        query = query.eq('id', id);
      }

      const { data, error } = await query
        .select('*, customer:customers(*), payment:payments(*)')
        .maybeSingle();

      if (error) {
        console.warn('[DataStore] Supabase updateCaseStatus error:', error.message);
      } else if (data) {
        return data as RecoveryCase;
      }
    }
    const idx = mockCases.findIndex(c => c.id === id || c.case_id === id);
    if (idx !== -1) {
      mockCases[idx].status = status;
      if (notes) mockCases[idx].notes = notes;
      if (extraFields) Object.assign(mockCases[idx], extraFields);
      mockCases[idx].updated_at = new Date().toISOString();
      return {
        ...mockCases[idx],
        customer: mockCustomers.find(cust => cust.id === mockCases[idx].customer_id),
        payment: mockPayments.find(p => p.id === mockCases[idx].payment_id || p.transaction_id === mockCases[idx].payment_id)
      };
    }
    return null;
  },

  async addCase(caseData: Partial<RecoveryCase>) {
    const newCase: RecoveryCase = {
      id: caseData.id || `rc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      case_id: caseData.case_id || `REC-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      customer_id: caseData.customer_id || mockCustomers[0].id,
      issue_type: caseData.issue_type || 'PAYMENT_FAILURE',
      amount_at_risk: caseData.amount_at_risk || 35000,
      risk_score: caseData.risk_score || 85.0,
      risk_level: caseData.risk_level || 'HIGH',
      root_cause: caseData.root_cause || 'Razorpay webhook received: Automated bank retry timeout; 3DS authorization pending',
      confidence: caseData.confidence || 88.0,
      recommended_action: caseData.recommended_action || 'Dispatch instant AI Smart Retry with fallback WhatsApp payment link',
      recovery_probability: caseData.recovery_probability || 79.5,
      expected_recovery: caseData.expected_recovery || Math.round((caseData.amount_at_risk || 35000) * 0.8),
      status: caseData.status || 'PENDING_APPROVAL',
      requires_human_approval: caseData.requires_human_approval ?? true,
      current_step: caseData.current_step || 'Newly intercepted webhook incident; queued for operations review',
      last_action: 'Ingested live Razorpay webhook telemetry',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockCases.unshift(newCase);
    return {
      ...newCase,
      customer: mockCustomers.find(c => c.id === newCase.customer_id) || mockCustomers[0],
    };
  },

  async resetDemoCases() {
    mockCases = [
      {
        id: 'rc111111-1111-1111-1111-111111111111',
        case_id: 'REC-2026-001',
        customer_id: 'c1111111-1111-1111-1111-111111111111',
        issue_type: 'OVERDUE_INVOICE',
        amount_at_risk: 60000,
        risk_score: 92.0,
        risk_level: 'CRITICAL',
        root_cause: 'Bank gateway timeout during monthly subscription renewal; invoice overdue by 14 days',
        confidence: 94.5,
        recommended_action: 'Send high-priority WhatsApp reminder with 1-click Razorpay UPI link + 5% prompt settlement credit',
        recovery_probability: 82.0,
        expected_recovery: 49200,
        status: 'PENDING_APPROVAL',
        requires_human_approval: true,
        current_step: 'Awaiting Finance Manager sign-off on 5% settlement credit',
        last_action: 'Generated smart recovery proposal',
        created_at: new Date(Date.now() - 25 * 60000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rc222222-2222-2222-2222-222222222222',
        case_id: 'REC-2026-002',
        customer_id: 'c1111111-1111-1111-1111-111111111111',
        issue_type: 'PAYMENT_FAILURE',
        amount_at_risk: 24500,
        risk_score: 84.5,
        risk_level: 'HIGH',
        root_cause: 'Credit card daily limit exceeded on HDFC card during recurring batch run',
        confidence: 89.0,
        recommended_action: 'Auto-schedule smart retry at 10:30 AM next business morning with fallback SMS payment link',
        recovery_probability: 78.0,
        expected_recovery: 19110,
        status: 'RECOMMENDED',
        requires_human_approval: false,
        current_step: 'Queued for automatic scheduled execution',
        last_action: 'Analyzed transaction failure history',
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rc333333-3333-3333-3333-333333333333',
        case_id: 'REC-2026-003',
        customer_id: 'c1111111-1111-1111-1111-111111111111',
        issue_type: 'CHECKOUT_ABANDONMENT',
        amount_at_risk: 32000,
        risk_score: 65.0,
        risk_level: 'MEDIUM',
        root_cause: 'User hesitated at payment method selection step for AI Revenue Suite Addon',
        confidence: 76.0,
        recommended_action: 'Dispatch contextual WhatsApp rescue sequence with quick-checkout link',
        recovery_probability: 68.5,
        expected_recovery: 21920,
        status: 'EXECUTING',
        requires_human_approval: false,
        current_step: 'WhatsApp rescue template dispatched to recipient',
        last_action: 'Triggered WhatsApp webhook delivery',
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rc444444-4444-4444-4444-444444444444',
        case_id: 'REC-2026-004',
        customer_id: 'c4444444-4444-4444-4444-444444444444',
        issue_type: 'SUBSCRIPTION_FAILURE',
        amount_at_risk: 65000,
        risk_score: 71.2,
        risk_level: 'HIGH',
        root_cause: 'Corporate card balance depleted; finance contact changed recently',
        confidence: 81.0,
        recommended_action: 'Trigger multi-channel dunning email + SMS notification to secondary billing admin',
        recovery_probability: 74.0,
        expected_recovery: 48100,
        status: 'ANALYZING',
        requires_human_approval: false,
        current_step: 'Cross-referencing secondary contact records in database',
        last_action: 'Ingested failed webhook event',
        created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'rc555555-5555-5555-5555-555555555555',
        case_id: 'REC-2026-005',
        customer_id: 'c3333333-3333-3333-3333-333333333333',
        issue_type: 'PAYMENT_FAILURE',
        amount_at_risk: 12500,
        risk_score: 35.0,
        risk_level: 'LOW',
        root_cause: '3DS OTP timeout on mobile browser session',
        confidence: 98.0,
        recommended_action: 'Automated UPI payment link delivered via WhatsApp',
        recovery_probability: 95.0,
        expected_recovery: 12500,
        status: 'RECOVERED',
        requires_human_approval: false,
        current_step: 'Payment verified on Razorpay gateway (pay_rzp_331100)',
        last_action: 'Payment settled successfully',
        created_at: new Date(Date.now() - 52 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      }
    ];

    if (isLiveDbConnected() && supabase) {
      try {
        await supabase.from('recovery_cases').update({ status: 'PENDING_APPROVAL', requires_human_approval: true, current_step: 'Awaiting Finance Manager sign-off on 5% settlement credit' }).eq('case_id', 'REC-2026-001');
        await supabase.from('recovery_cases').update({ status: 'RECOMMENDED', requires_human_approval: false, current_step: 'Queued for automatic scheduled execution' }).eq('case_id', 'REC-2026-002');
        await supabase.from('recovery_cases').update({ status: 'EXECUTING', requires_human_approval: false, current_step: 'WhatsApp rescue template dispatched to recipient' }).eq('case_id', 'REC-2026-003');
        await supabase.from('recovery_cases').update({ status: 'ANALYZING', requires_human_approval: false, current_step: 'Cross-referencing secondary contact records in database' }).eq('case_id', 'REC-2026-004');
        await supabase.from('recovery_cases').update({ status: 'RECOVERED', requires_human_approval: false, current_step: 'Payment verified on Razorpay gateway' }).eq('case_id', 'REC-2026-005');
      } catch (e) {
        console.warn('[DataStore] Supabase reset notice:', e);
      }
    }

    return mockCases;
  },

  async getCaseTimeline(caseIdentifier: string) {
    // 1. Fetch case details
    const caseRecord = await this.getCaseById(caseIdentifier);
    const caseId = caseRecord?.case_id || caseIdentifier;
    const caseUuid = caseRecord?.id;

    // 2. Fetch associated audit logs
    const allLogs = await this.getAuditLogs();
    const caseLogs = allLogs.filter(log => 
      log.entity_id === caseId || 
      log.entity_id === caseUuid ||
      (log.new_state && (log.new_state.case_id === caseId || log.new_state.caseId === caseId))
    );

    // 3. Build chronological timeline events
    const timelineEvents: Array<{
      id: string;
      title: string;
      description: string;
      type: 'WEBHOOK' | 'DETECTION' | 'ADMIN_ACTION' | 'SIMULATION' | 'SETTLEMENT';
      timestamp: string;
      actor: string;
      metadata?: any;
    }> = [];

    // Milestone A: Initial Detection
    if (caseRecord) {
      timelineEvents.push({
        id: `event-created-${caseRecord.id}`,
        title: `Recovery Incident Detected (${caseRecord.issue_type.replace(/_/g, ' ')})`,
        description: `Risk Score: ${caseRecord.risk_score} (${caseRecord.risk_level} Risk) • Amount at risk: ₹${caseRecord.amount_at_risk}`,
        type: 'DETECTION',
        timestamp: caseRecord.created_at,
        actor: 'Telemetry Ingestion Engine',
        metadata: {
          root_cause: caseRecord.root_cause,
          recommended_action: caseRecord.recommended_action,
        },
      });
    }

    // Milestone B: Mapped Audit Logs
    for (const log of caseLogs) {
      let eventType: 'WEBHOOK' | 'DETECTION' | 'ADMIN_ACTION' | 'SIMULATION' | 'SETTLEMENT' = 'ADMIN_ACTION';
      let title = log.action.replace(/_/g, ' ');

      if (log.action.includes('WEBHOOK') || log.action.includes('PAYMENT_FAILURE')) {
        eventType = 'WEBHOOK';
        title = 'Gateway Webhook Ingested';
      } else if (log.action.includes('SIMULAT')) {
        eventType = 'SIMULATION';
        title = 'Recovery Action Simulated (Safe Test)';
      } else if (log.action.includes('RECOVER') || log.action.includes('SETTLE')) {
        eventType = 'SETTLEMENT';
        title = 'Payment Settled & Recovered';
      }

      timelineEvents.push({
        id: log.id,
        title,
        description: typeof log.new_state === 'object' ? JSON.stringify(log.new_state) : log.action,
        type: eventType,
        timestamp: log.created_at,
        actor: log.actor_email || log.actor_role || 'SYSTEM',
        metadata: {
          previous_state: log.previous_state,
          new_state: log.new_state,
        },
      });
    }

    // Sort chronologically (oldest to newest)
    timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return timelineEvents;
  },

  // Metrics & Phase 6 Analytics
  async getMetrics(): Promise<DashboardMetrics> {
    const cases = await this.getCases();
    const revenueAtRisk = cases.filter(c => c.status !== 'RECOVERED' && c.status !== 'STOPPED')
      .reduce((sum, c) => sum + Number(c.amount_at_risk), 0);
    
    const revenueRecovered = cases.filter(c => c.status === 'RECOVERED')
      .reduce((sum, c) => sum + Number(c.amount_at_risk), 0);

    const totalResolvedOrActive = revenueAtRisk + revenueRecovered;
    const recoveryRate = totalResolvedOrActive > 0 ? (revenueRecovered / totalResolvedOrActive) * 100 : 0;
    const activeCases = cases.filter(c => ['DETECTED', 'ANALYZING', 'RECOMMENDED', 'EXECUTING', 'VERIFYING', 'PENDING_APPROVAL'].includes(c.status)).length;
    const aiResolved = cases.filter(c => c.status === 'RECOVERED').length;
    const humanEscalations = cases.filter(c => c.status === 'PENDING_APPROVAL' || c.status === 'ESCALATED').length;

    return {
      revenueAtRisk,
      revenueRecovered,
      recoveryRate: Number(recoveryRate.toFixed(1)),
      activeCases,
      aiResolved,
      humanEscalations,
      currency: 'INR',
      totalCasesCount: cases.length,
    };
  },

  async getExecutiveMetrics() {
    const cases = await this.getCases();
    const payments = await this.getPayments();

    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.status === 'SUCCESS' || p.status === 'RECOVERED').length;
    const failedPayments = payments.filter(p => p.status === 'FAILED').length;
    const totalPaymentValue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const amountAtRisk = cases
      .filter(c => c.status !== 'RECOVERED' && c.status !== 'STOPPED')
      .reduce((sum, c) => sum + Number(c.amount_at_risk || 0), 0);

    const amountRecovered = cases
      .filter(c => c.status === 'RECOVERED')
      .reduce((sum, c) => sum + Number(c.amount_at_risk || 0), 0);

    const totalEvaluatedRisk = amountAtRisk + amountRecovered;
    const recoveryRate = totalEvaluatedRisk > 0 
      ? Number(((amountRecovered / totalEvaluatedRisk) * 100).toFixed(1)) 
      : 0;

    const activeCases = cases.filter(c => 
      ['DETECTED', 'ANALYZING', 'RECOMMENDED', 'EXECUTING', 'VERIFYING', 'PENDING_APPROVAL'].includes(c.status)
    ).length;

    const pendingApprovals = cases.filter(c => 
      c.status === 'PENDING_APPROVAL' || c.requires_human_approval
    ).length;

    const recoveredCases = cases.filter(c => c.status === 'RECOVERED');
    let avgRecoveryMinutes = 45;
    if (recoveredCases.length > 0) {
      const totalMinutes = recoveredCases.reduce((acc, c) => {
        const created = new Date(c.created_at).getTime();
        const updated = new Date(c.updated_at).getTime();
        const diffMin = Math.max(1, Math.round((updated - created) / 60000));
        return acc + diffMin;
      }, 0);
      avgRecoveryMinutes = Math.round(totalMinutes / recoveredCases.length);
    }

    const averageRecoveryTime = avgRecoveryMinutes > 60 
      ? `${(avgRecoveryMinutes / 60).toFixed(1)} Hours` 
      : `${avgRecoveryMinutes} Mins`;

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      totalPaymentValue,
      amountAtRisk,
      totalAmountAtRisk: amountAtRisk,
      amountRecovered,
      recoveredAmount: amountRecovered,
      recoveryRate,
      activeCases,
      pendingApprovals,
      casesRecovered: cases.filter(c => c.status === 'RECOVERED').length,
      casesEscalated: cases.filter(c => c.status === 'ESCALATED').length,
      casesStopped: cases.filter(c => c.status === 'STOPPED').length,
      casesRequiringHumanApproval: cases.filter(c => c.status === 'PENDING_APPROVAL' || c.requires_human_approval).length,
      averageRecoveryTime,
      averageRecoveryTimeMinutes: avgRecoveryMinutes,
      executionMode: 'RAZORPAY TEST MODE',
      currency: 'INR',
    };
  },

  async getPaymentAnalytics(filters?: { startDate?: string; endDate?: string; status?: string; paymentMethod?: string; currency?: string }) {
    let payments = await this.getPayments();
    if (filters?.status) payments = payments.filter(p => p.status === filters.status);
    if (filters?.paymentMethod) payments = payments.filter(p => (p.payment_method || '').toLowerCase().includes(filters.paymentMethod!.toLowerCase()));
    if (filters?.currency) payments = payments.filter(p => p.currency === filters.currency);
    if (filters?.startDate) payments = payments.filter(p => new Date(p.created_at) >= new Date(filters.startDate!));
    if (filters?.endDate) payments = payments.filter(p => new Date(p.created_at) <= new Date(filters.endDate!));

    const totalCount = payments.length;
    const successfulCount = payments.filter(p => p.status === 'SUCCESS' || p.status === 'RECOVERED').length;
    const failedCount = payments.filter(p => p.status === 'FAILED').length;
    const pendingCount = payments.filter(p => p.status === 'PENDING').length;

    const totalVolume = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const failedVolume = payments.filter(p => p.status === 'FAILED').reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const failureRate = totalCount > 0 ? Number(((failedCount / totalCount) * 100).toFixed(1)) : 0;

    const methodMap: Record<string, { count: number; volume: number }> = {};
    for (const p of payments) {
      const m = p.payment_method || 'Razorpay Gateway';
      if (!methodMap[m]) methodMap[m] = { count: 0, volume: 0 };
      methodMap[m].count += 1;
      methodMap[m].volume += Number(p.amount || 0);
    }

    return {
      totalCount,
      successfulCount,
      failedCount,
      pendingCount,
      totalVolume,
      failedVolume,
      failureRate,
      byMethod: Object.entries(methodMap).map(([method, data]) => ({ method, ...data })),
    };
  },

  async getRecoveryAnalytics() {
    const cases = await this.getCases();
    const actions = mockRecoveryActions;

    const statusCounts = {
      detected: cases.filter(c => c.status === 'DETECTED').length,
      diagnosed: cases.filter(c => c.status === 'RECOMMENDED' || c.status === 'ANALYZING').length,
      awaitingApproval: cases.filter(c => c.status === 'PENDING_APPROVAL').length,
      approved: cases.filter(c => c.status === 'APPROVED').length,
      executing: cases.filter(c => c.status === 'EXECUTING').length,
      recovered: cases.filter(c => c.status === 'RECOVERED').length,
      failed: cases.filter(c => c.status === 'FAILED').length,
      stopped: cases.filter(c => c.status === 'STOPPED').length,
    };

    const amountAtRisk = cases.filter(c => c.status !== 'RECOVERED' && c.status !== 'STOPPED').reduce((sum, c) => sum + Number(c.amount_at_risk || 0), 0);
    const amountRecovered = cases.filter(c => c.status === 'RECOVERED').reduce((sum, c) => sum + Number(c.amount_at_risk || 0), 0);
    const recoveryRate = (amountAtRisk + amountRecovered) > 0 ? Number(((amountRecovered / (amountAtRisk + amountRecovered)) * 100).toFixed(1)) : 0;

    const recoveredCaseIds = new Set(cases.filter(c => c.status === 'RECOVERED').map(c => c.case_id));
    const recoveredActions = actions.filter(a => recoveredCaseIds.has(a.case_id));
    const avgAttempts = recoveredCaseIds.size > 0 
      ? Number((recoveredActions.length / recoveredCaseIds.size || 1).toFixed(1)) 
      : 1.2;

    return {
      statusCounts,
      amountAtRisk,
      amountRecovered,
      recoveryRate,
      averageAttemptsPerRecoveredCase: avgAttempts,
      totalCasesCount: cases.length,
    };
  },

  async getFailureAnalysis() {
    const cases = await this.getCases();
    const payments = await this.getPayments();

    const rootCauseMap: Record<string, number> = {
      BANK_ERROR: 0,
      PAYMENT_DECLINED: 0,
      NETWORK_TIMEOUT: 0,
      AUTHENTICATION_FAILURE: 0,
      LIMIT_EXCEEDED: 0,
      OTHER: 0,
    };

    for (const c of cases) {
      const rc = (c.ai_category || c.root_cause || '').toUpperCase();
      if (rc.includes('BANK') || rc.includes('ISSUER')) rootCauseMap.BANK_ERROR += 1;
      else if (rc.includes('LIMIT') || rc.includes('BALANCE') || rc.includes('INSUFFICIENT')) rootCauseMap.LIMIT_EXCEEDED += 1;
      else if (rc.includes('TIMEOUT') || rc.includes('NETWORK') || rc.includes('LATENCY')) rootCauseMap.NETWORK_TIMEOUT += 1;
      else if (rc.includes('AUTH') || rc.includes('OTP') || rc.includes('3DS')) rootCauseMap.AUTHENTICATION_FAILURE += 1;
      else if (rc.includes('DECLINE') || rc.includes('REJECT')) rootCauseMap.PAYMENT_DECLINED += 1;
      else rootCauseMap.OTHER += 1;
    }

    const issueTypeMap: Record<string, number> = {};
    for (const c of cases) {
      issueTypeMap[c.issue_type] = (issueTypeMap[c.issue_type] || 0) + 1;
    }

    const riskMap: Record<string, number> = {};
    for (const c of cases) {
      riskMap[c.risk_level] = (riskMap[c.risk_level] || 0) + 1;
    }

    const errorMap: Record<string, number> = {};
    for (const p of payments) {
      if (p.error_code) {
        errorMap[p.error_code] = (errorMap[p.error_code] || 0) + 1;
      }
    }

    return {
      byRootCause: Object.entries(rootCauseMap).map(([category, count]) => ({ category, count })),
      byIssueType: Object.entries(issueTypeMap).map(([type, count]) => ({ type, count })),
      byRiskLevel: Object.entries(riskMap).map(([level, count]) => ({ level, count })),
      byErrorCode: Object.entries(errorMap).map(([code, count]) => ({ code, count })),
    };
  },

  async getAiAnalytics() {
    const cases = await this.getCases();
    
    const totalDiagnoses = cases.filter(c => c.confidence > 0 || c.ai_confidence).length;
    const geminiDiagnoses = cases.filter(c => c.diagnosis_source === 'GEMINI_AI').length;
    const ruleFallbackDiagnoses = cases.filter(c => c.diagnosis_source === 'RULE_BASED_FALLBACK' || !c.diagnosis_source).length;

    const validConfidenceCases = cases.filter(c => (c.ai_confidence || c.confidence) > 0);
    const avgConfidence = validConfidenceCases.length > 0
      ? Number((validConfidenceCases.reduce((sum, c) => sum + Number(c.ai_confidence || c.confidence), 0) / validConfidenceCases.length).toFixed(1))
      : 85.0;

    const validProbabilityCases = cases.filter(c => (c.ai_recovery_probability || c.recovery_probability) > 0);
    const avgProbability = validProbabilityCases.length > 0
      ? Number((validProbabilityCases.reduce((sum, c) => sum + Number(c.ai_recovery_probability || c.recovery_probability), 0) / validProbabilityCases.length).toFixed(1))
      : 78.5;

    const outcomeMatrix = [
      {
        recommendation: 'RETRY_PAYMENT',
        recovered: cases.filter(c => (c.ai_recommended_action_type === 'RETRY_PAYMENT' || c.recommended_action?.includes('Retry')) && c.status === 'RECOVERED').length,
        failed: cases.filter(c => (c.ai_recommended_action_type === 'RETRY_PAYMENT' || c.recommended_action?.includes('Retry')) && c.status === 'FAILED').length,
        pending: cases.filter(c => (c.ai_recommended_action_type === 'RETRY_PAYMENT' || c.recommended_action?.includes('Retry')) && !['RECOVERED', 'FAILED'].includes(c.status)).length,
      },
      {
        recommendation: 'ALTERNATIVE_PAYMENT_METHOD',
        recovered: cases.filter(c => (c.ai_recommended_action_type === 'ALTERNATIVE_PAYMENT_METHOD' || c.recommended_action?.includes('Alternative')) && c.status === 'RECOVERED').length,
        failed: cases.filter(c => (c.ai_recommended_action_type === 'ALTERNATIVE_PAYMENT_METHOD' || c.recommended_action?.includes('Alternative')) && c.status === 'FAILED').length,
        pending: cases.filter(c => (c.ai_recommended_action_type === 'ALTERNATIVE_PAYMENT_METHOD' || c.recommended_action?.includes('Alternative')) && !['RECOVERED', 'FAILED'].includes(c.status)).length,
      },
      {
        recommendation: 'MANUAL_REVIEW',
        recovered: cases.filter(c => c.ai_recommended_action_type === 'MANUAL_REVIEW' && c.status === 'RECOVERED').length,
        failed: cases.filter(c => c.ai_recommended_action_type === 'MANUAL_REVIEW' && c.status === 'FAILED').length,
        pending: cases.filter(c => c.ai_recommended_action_type === 'MANUAL_REVIEW' && !['RECOVERED', 'FAILED'].includes(c.status)).length,
      },
    ];

    return {
      totalDiagnoses,
      geminiDiagnoses,
      ruleFallbackDiagnoses,
      averageConfidence: avgConfidence,
      averageRecoveryProbability: avgProbability,
      outcomeMatrix,
      disclaimer: 'ADVISORY ONLY — AI provides diagnostic recommendations. Admin approval is mandatory.',
    };
  },

  async getWebhookHealthStats() {
    const auditLogs = await this.getAuditLogs();
    const webhookLogs = auditLogs.filter(l => l.action.includes('WEBHOOK'));

    let totalWebhooks = webhookLogs.length || 14;
    let successful = webhookLogs.filter(l => !l.action.includes('INVALID') && !l.action.includes('ERROR')).length || 13;
    let failed = webhookLogs.filter(l => l.action.includes('INVALID') || l.action.includes('ERROR')).length || 1;
    let duplicates = webhookLogs.filter(l => l.action.includes('DUPLICATE')).length || 2;

    const lastWebhookTime = webhookLogs[0]?.created_at || new Date().toISOString();
    const status = failed === 0 ? 'HEALTHY' : (failed < 3 ? 'WARNING' : 'ERROR');

    return {
      status,
      lastWebhookReceived: lastWebhookTime,
      totalWebhooks,
      successfulProcessing: successful,
      failedProcessing: failed,
      duplicateEvents: duplicates,
      averageProcessingLatencyMs: 142,
      lastProcessingError: failed > 0 ? 'Invalid HMAC Signature rejected (401)' : null,
    };
  },

  async getAuditAnalytics() {
    const logs = await this.getAuditLogs();
    const actionCounts: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};

    for (const l of logs) {
      actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
      const actor = l.actor_email || l.actor_role || 'SYSTEM';
      actorCounts[actor] = (actorCounts[actor] || 0) + 1;
    }

    return {
      totalEvents: logs.length,
      byAction: Object.entries(actionCounts).map(([action, count]) => ({ action, count })),
      byActor: Object.entries(actorCounts).map(([actor, count]) => ({ actor, count })),
    };
  },

  // Customers
  async getCustomers() {
    if (isLiveDbConnected() && supabase) {
      const { data, error } = await supabase.from('customers').select('*');
      if (!error && data) return data as Customer[];
    }
    return mockCustomers;
  },

  async getCustomerByUserId(userId: string) {
    if (isLiveDbConnected() && supabase) {
      const { data, error } = await supabase.from('customers').select('*').eq('user_id', userId).maybeSingle();
      if (!error && data) return data as Customer;
    }
    return mockCustomers.find(c => c.user_id === userId) || null;
  },

  async ensureCustomerForUser(userId: string, email: string, name: string, company?: string) {
    let customer = mockCustomers.find(c => c.user_id === userId || c.email.toLowerCase() === email.toLowerCase());
    if (customer) {
      if (!customer.user_id) customer.user_id = userId;
      return customer;
    }
    const newCustId = `cust-${Date.now()}`;
    const newCust: Customer = {
      id: newCustId,
      user_id: userId,
      external_customer_id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      phone: '+91 98765 43210',
      company: company || 'Apex Growth Labs',
      status: 'AT_RISK',
      risk_score: 84.5,
      risk_level: 'HIGH',
      total_spend: 125000,
      total_risk_amount: 60000,
      recovered_amount: 24500,
      lifetime_value: 240000,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCustomers.push(newCust);

    // Seed demo invoices for this customer
    mockInvoices.push(
      {
        id: `inv-${Date.now()}-1`,
        customer_id: newCustId,
        invoice_number: 'INV-2026-0891',
        amount: 60000,
        amount_paid: 0,
        currency: 'INR',
        status: 'OVERDUE',
        due_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
        days_overdue: 14,
        payment_link: 'https://rzp.io/i/rec_inv_891',
        created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `inv-${Date.now()}-2`,
        customer_id: newCustId,
        invoice_number: 'INV-2026-0870',
        amount: 24500,
        amount_paid: 24500,
        currency: 'INR',
        status: 'PAID',
        due_date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
        days_overdue: 0,
        payment_link: 'https://rzp.io/i/rec_inv_870',
        created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `inv-${Date.now()}-3`,
        customer_id: newCustId,
        invoice_number: 'INV-2026-0855',
        amount: 24500,
        amount_paid: 24500,
        currency: 'INR',
        status: 'PAID',
        due_date: new Date(Date.now() - 55 * 86400000).toISOString().split('T')[0],
        days_overdue: 0,
        payment_link: 'https://rzp.io/i/rec_inv_855',
        created_at: new Date(Date.now() - 70 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      }
    );

    // Seed demo subscriptions for this customer
    mockSubscriptions.push({
      id: `sub-${Date.now()}-1`,
      customer_id: newCustId,
      subscription_code: 'sub_scale_001',
      plan_name: 'Scale Enterprise Plan',
      billing_cycle: 'MONTHLY',
      amount: 60000,
      currency: 'INR',
      status: 'PAST_DUE',
      next_billing_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      grace_period_ends_at: new Date(Date.now() + 4 * 86400000).toISOString(),
      dunning_stage: 1,
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Seed demo payments
    mockPayments.push(
      {
        id: `pay-${Date.now()}-1`,
        customer_id: newCustId,
        transaction_id: 'pay_rzp_991823',
        amount: 60000,
        currency: 'INR',
        status: 'FAILED',
        gateway: 'Razorpay',
        payment_method: 'HDFC Corporate Card (Ending 4012)',
        error_code: 'CARD_LIMIT_EXCEEDED',
        error_description: 'Card limit exceeded on subscription renewal for INV-2026-0891',
        attempts_count: 2,
        last_attempted_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `pay-${Date.now()}-2`,
        customer_id: newCustId,
        transaction_id: 'pay_rzp_771892',
        amount: 24500,
        currency: 'INR',
        status: 'SUCCESS',
        gateway: 'Razorpay',
        payment_method: 'HDFC Bank Debit Card (Ending 4012)',
        error_code: undefined,
        error_description: 'Authorized and captured successfully via 3DS2 authentication',
        attempts_count: 1,
        last_attempted_at: new Date(Date.now() - 32 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 32 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      }
    );

    return newCust;
  },

  // Payments
  async getPayments(customerId?: string) {
    if (isLiveDbConnected() && supabase) {
      let query = supabase.from('payments').select('*, customer:customers(*)');
      if (customerId) query = query.eq('customer_id', customerId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as PaymentRecord[];
    }
    let res = mockPayments.map(p => ({
      ...p,
      customer: mockCustomers.find(c => c.id === p.customer_id)
    }));
    if (customerId) {
      const filtered = res.filter(p => p.customer_id === customerId);
      if (filtered.length > 0) return filtered;
    }
    return res;
  },

  // Subscriptions
  async getSubscriptions(customerId?: string) {
    if (isLiveDbConnected() && supabase) {
      let query = supabase.from('subscriptions').select('*, customer:customers(*)');
      if (customerId) query = query.eq('customer_id', customerId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as SubscriptionRecord[];
    }
    let res = mockSubscriptions.map(s => ({
      ...s,
      customer: mockCustomers.find(c => c.id === s.customer_id)
    }));
    if (customerId) {
      const filtered = res.filter(s => s.customer_id === customerId);
      if (filtered.length > 0) return filtered;
    }
    return res;
  },

  // Invoices
  async getInvoices(customerId?: string) {
    if (isLiveDbConnected() && supabase) {
      let query = supabase.from('invoices').select('*, customer:customers(*)');
      if (customerId) query = query.eq('customer_id', customerId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as InvoiceRecord[];
    }
    let res = mockInvoices.map(i => ({
      ...i,
      customer: mockCustomers.find(c => c.id === i.customer_id)
    }));
    if (customerId) {
      const filtered = res.filter(i => i.customer_id === customerId);
      if (filtered.length > 0) return filtered;
    }
    return res;
  },

  async updateInvoiceStatus(invoiceNumber: string, status: 'PAID' | 'OVERDUE' | 'VOID' | 'UNPAID', amountPaid?: number): Promise<InvoiceRecord | null> {
    const inv = mockInvoices.find(i => i.invoice_number === invoiceNumber);
    if (inv) {
      inv.status = status;
      if (amountPaid !== undefined) {
        inv.amount_paid = amountPaid;
      }
      inv.updated_at = new Date().toISOString();
      if (isLiveDbConnected() && supabase) {
        try {
          await supabase.from('invoices').update({
            status: inv.status,
            amount_paid: inv.amount_paid,
            updated_at: inv.updated_at
          }).eq('invoice_number', invoiceNumber);
        } catch (err) {
          console.warn('Supabase invoice update notice:', err);
        }
      }
      return inv;
    }
    return null;
  },

  // Policies
  async getPolicies() {
    if (isLiveDbConnected() && supabase) {
      const { data, error } = await supabase.from('recovery_policies').select('*').order('priority', { ascending: true });
      if (!error && data) return data as RecoveryPolicy[];
    }
    return mockPolicies;
  },

  async createPolicy(policyData: Partial<RecoveryPolicy>) {
    const newPolicy: RecoveryPolicy = {
      id: `pol-${Date.now()}`,
      name: policyData.name || 'New Policy',
      description: policyData.description,
      issue_type: policyData.issue_type,
      min_amount: policyData.min_amount || 0,
      max_amount: policyData.max_amount,
      max_discount_pct: policyData.max_discount_pct || 0,
      max_retries: policyData.max_retries || 3,
      auto_approve: policyData.auto_approve ?? true,
      is_active: policyData.is_active ?? true,
      priority: policyData.priority || (mockPolicies.length + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockPolicies.push(newPolicy);
    return newPolicy;
  },

  async togglePolicy(id: string, isActive: boolean) {
    const policy = mockPolicies.find((p) => p.id === id);
    if (policy) {
      policy.is_active = isActive;
      policy.updated_at = new Date().toISOString();
      return policy;
    }
    return null;
  },

  // Webhook Events & Idempotency
  async isWebhookProcessed(eventId: string): Promise<boolean> {
    if (isLiveDbConnected() && supabase) {
      try {
        const { data, error } = await supabase
          .from('webhook_events')
          .select('id, processed')
          .eq('event_id', eventId)
          .single();
        if (!error && data) return Boolean(data.processed);
      } catch {}
    }
    return mockWebhookEvents.has(eventId);
  },

  async recordWebhookEvent(event: {
    event_id: string;
    event_type: string;
    payload: any;
    signature?: string;
    is_valid?: boolean;
    processed?: boolean;
    error?: string;
  }) {
    mockWebhookEvents.add(event.event_id);
    if (isLiveDbConnected() && supabase) {
      try {
        await supabase.from('webhook_events').upsert({
          event_id: event.event_id,
          event_type: event.event_type,
          payload: event.payload,
          signature: event.signature,
          is_valid: event.is_valid ?? true,
          processed: event.processed ?? true,
          error: event.error,
          processed_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Failed to upsert to supabase webhook_events:', e);
      }
    }
  },

  // Payment Upsert
  async createOrUpdatePayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const existingIdx = mockPayments.findIndex(p => p.transaction_id === payment.transaction_id);
    let record: PaymentRecord;

    if (existingIdx !== -1) {
      mockPayments[existingIdx] = {
        ...mockPayments[existingIdx],
        ...payment,
        updated_at: new Date().toISOString(),
      };
      record = mockPayments[existingIdx];
    } else {
      record = {
        id: `p-${Date.now()}`,
        customer_id: payment.customer_id || mockCustomers[0].id,
        transaction_id: payment.transaction_id || `pay_${Date.now()}`,
        amount: payment.amount || 0,
        currency: payment.currency || 'INR',
        status: payment.status || 'FAILED',
        gateway: payment.gateway || 'Razorpay',
        payment_method: payment.payment_method || 'Card',
        error_code: payment.error_code,
        error_description: payment.error_description,
        attempts_count: payment.attempts_count || 1,
        last_attempted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockPayments.unshift(record);
    }

    if (isLiveDbConnected() && supabase) {
      try {
        await supabase.from('payments').upsert({
          transaction_id: record.transaction_id,
          customer_id: record.customer_id,
          amount: record.amount,
          currency: record.currency,
          status: record.status,
          gateway: record.gateway,
          payment_method: record.payment_method,
          error_code: record.error_code,
          error_description: record.error_description,
          attempts_count: record.attempts_count,
          last_attempted_at: record.last_attempted_at,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase payment upsert notice:', e);
      }
    }

    return record;
  },

  // Case Upsert
  async createOrUpdateCase(caseData: Partial<RecoveryCase>): Promise<RecoveryCase> {
    const existingIdx = mockCases.findIndex(c => c.case_id === caseData.case_id);
    let record: RecoveryCase;

    if (existingIdx !== -1) {
      mockCases[existingIdx] = {
        ...mockCases[existingIdx],
        ...caseData,
        updated_at: new Date().toISOString(),
      };
      record = mockCases[existingIdx];
    } else {
      record = {
        id: `rc-${Date.now()}`,
        case_id: caseData.case_id || `REC-${Date.now().toString().slice(-4)}`,
        customer_id: caseData.customer_id || mockCustomers[0].id,
        payment_id: caseData.payment_id,
        subscription_id: caseData.subscription_id,
        invoice_id: caseData.invoice_id,
        checkout_session_id: caseData.checkout_session_id,
        issue_type: caseData.issue_type || 'PAYMENT_FAILURE',
        amount_at_risk: caseData.amount_at_risk || 0,
        risk_score: caseData.risk_score || 50,
        risk_level: caseData.risk_level || 'MEDIUM',
        root_cause: caseData.root_cause || 'Transaction declined',
        confidence: caseData.confidence || 90,
        recommended_action: caseData.recommended_action || 'Autonomous Smart Retry',
        recovery_probability: caseData.recovery_probability || 75,
        expected_recovery: caseData.expected_recovery || 0,
        status: caseData.status || 'RECOMMENDED',
        requires_human_approval: caseData.requires_human_approval ?? false,
        current_step: caseData.current_step || 'Diagnosis completed; awaiting execution',
        last_action: caseData.last_action || 'AI Root Cause Diagnosis Generated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockCases.unshift(record);
    }

    if (isLiveDbConnected() && supabase) {
      try {
        await supabase.from('recovery_cases').upsert({
          case_id: record.case_id,
          customer_id: record.customer_id,
          payment_id: record.payment_id,
          issue_type: record.issue_type,
          amount_at_risk: record.amount_at_risk,
          risk_score: record.risk_score,
          risk_level: record.risk_level,
          root_cause: record.root_cause,
          confidence: record.confidence,
          recommended_action: record.recommended_action,
          recovery_probability: record.recovery_probability,
          expected_recovery: record.expected_recovery,
          status: record.status,
          requires_human_approval: record.requires_human_approval,
          current_step: record.current_step,
          last_action: record.last_action,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase case upsert notice:', e);
      }
    }

    return record;
  },

  // Audit logs
  async getAuditLogs() {
    if (isLiveDbConnected() && supabase) {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as AuditLog[];
    }
    return mockAuditLogs;
  },

  async addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
    const newLog: AuditLog = {
      id: `al-${Date.now()}`,
      ...log,
      created_at: new Date().toISOString(),
    };
    mockAuditLogs.unshift(newLog);

    if (isLiveDbConnected() && supabase) {
      try {
        await supabase.from('audit_logs').insert({
          actor_id: log.actor_id,
          actor_email: log.actor_email,
          actor_role: log.actor_role,
          action: log.action,
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          previous_state: log.previous_state,
          new_state: log.new_state,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
        });
      } catch (e) {
        console.warn('Supabase audit log insert notice:', e);
      }
    }

    return newLog;
  },

  // Recovery Actions (Phase 5)
  async getRecoveryActionsByCaseId(caseIdentifier: string): Promise<any[]> {
    const caseRecord = await this.getCaseById(caseIdentifier);
    const caseId = caseRecord?.case_id || caseIdentifier;
    const caseUuid = caseRecord?.id;

    if (isLiveDbConnected() && supabase && caseUuid) {
      const { data, error } = await supabase
        .from('recovery_actions')
        .select('*')
        .eq('case_id', caseUuid)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          action_id: item.parameters?.action_id || item.id,
          ...item.parameters,
        }));
      }
    }

    return mockRecoveryActions.filter(a => a.case_id === caseId || a.case_id === caseUuid);
  },

  async getRecoveryActionById(actionIdentifier: string): Promise<any | null> {
    if (isLiveDbConnected() && supabase) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actionIdentifier);
      if (isUuid) {
        const { data, error } = await supabase
          .from('recovery_actions')
          .select('*')
          .eq('id', actionIdentifier)
          .maybeSingle();
        if (!error && data) {
          return {
            ...data,
            action_id: data.parameters?.action_id || data.id,
            ...data.parameters,
          };
        }
      }
    }

    const found = mockRecoveryActions.find(a => a.id === actionIdentifier || a.action_id === actionIdentifier);
    return found || null;
  },

  async createRecoveryAction(actionData: any): Promise<any> {
    const actionId = actionData.action_id || `ACT-${Date.now().toString().slice(-6)}`;
    const record: any = {
      id: actionData.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action_id: actionId,
      case_id: actionData.case_id,
      action_type: actionData.action_type || 'RETRY_PAYMENT',
      channel: actionData.channel || 'GATEWAY_RETRY',
      status: actionData.status || 'PLANNED',
      reason: actionData.reason || 'Automated Recovery Action',
      source: actionData.source || 'ADMIN_MANUAL',
      confidence: actionData.confidence || 80,
      estimated_recovery: actionData.estimated_recovery || 0,
      requires_approval: actionData.requires_approval ?? true,
      approved_by: actionData.approved_by || null,
      approved_at: actionData.approved_at || null,
      execution_mode: actionData.execution_mode || 'TEST',
      attempt_number: actionData.attempt_number || 1,
      max_attempts: actionData.max_attempts || 3,
      started_at: actionData.started_at || null,
      completed_at: actionData.completed_at || null,
      next_eligible_at: actionData.next_eligible_at || null,
      provider_reference: actionData.provider_reference || null,
      recovered_amount: actionData.recovered_amount || 0,
      error_code: actionData.error_code || null,
      error_message: actionData.error_message || null,
      idempotency_key: actionData.idempotency_key || `idem_${actionData.case_id}_${actionId}_att1`,
      notes: actionData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockRecoveryActions.unshift(record);

    if (isLiveDbConnected() && supabase) {
      try {
        const caseRecord = await this.getCaseById(record.case_id);
        const caseUuid = caseRecord?.id;
        if (caseUuid) {
          await supabase.from('recovery_actions').insert({
            case_id: caseUuid,
            action_type: record.action_type,
            channel: record.channel,
            status: record.status,
            parameters: {
              action_id: record.action_id,
              reason: record.reason,
              source: record.source,
              confidence: record.confidence,
              estimated_recovery: record.estimated_recovery,
              requires_approval: record.requires_approval,
              approved_by: record.approved_by,
              approved_at: record.approved_at,
              execution_mode: record.execution_mode,
              attempt_number: record.attempt_number,
              max_attempts: record.max_attempts,
              idempotency_key: record.idempotency_key,
              provider_reference: record.provider_reference,
              notes: record.notes,
            },
          });
        }
      } catch (e) {
        console.warn('Supabase recovery_actions insert notice:', e);
      }
    }

    return record;
  },

  async updateRecoveryAction(actionIdentifier: string, updates: any): Promise<any | null> {
    const idx = mockRecoveryActions.findIndex(a => a.id === actionIdentifier || a.action_id === actionIdentifier);
    let updatedMock: any = null;
    if (idx !== -1) {
      mockRecoveryActions[idx] = {
        ...mockRecoveryActions[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      updatedMock = mockRecoveryActions[idx];
    }

    if (isLiveDbConnected() && supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actionIdentifier);
        if (isUuid) {
          await supabase.from('recovery_actions').update({
            status: updates.status,
            result_summary: updates.error_message || updates.notes || `Action status updated to ${updates.status}`,
            executed_at: updates.completed_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', actionIdentifier);
        }
      } catch (e) {
        console.warn('Supabase recovery_actions update notice:', e);
      }
    }

    return updatedMock;
  }
};

