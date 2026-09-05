-- ==============================================================================
-- RazorRecover AI - Supabase PostgreSQL Database Schema
-- Migration 002: Seed Demo Data
-- ==============================================================================

-- 1. Insert Demo Users (Admin and Customer)
INSERT INTO public.users (id, email, role, full_name, company, phone, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@razorrecover.ai', 'ADMIN', 'Arjun Mehta (Admin)', 'RazorRecover AI', '+91 98765 43210', true),
    ('22222222-2222-2222-2222-222222222222', 'customer@example.com', 'CUSTOMER', 'Rohan Sharma (Customer)', 'Apex Growth Labs', '+91 91234 56789', true),
    ('33333333-3333-3333-3333-333333333333', 'finance@stellar.io', 'CUSTOMER', 'Priya Deshmukh', 'Stellar Cloud Tech', '+91 99887 76655', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Customers
INSERT INTO public.customers (id, user_id, external_customer_id, name, email, phone, company, status, risk_score, risk_level, total_spend, total_risk_amount, recovered_amount, lifetime_value)
VALUES
    ('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'CUST-001', 'Rohan Sharma', 'customer@example.com', '+91 91234 56789', 'Apex Growth Labs', 'AT_RISK', 84.50, 'HIGH', 125000.00, 48500.00, 18500.00, 240000.00),
    ('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'CUST-002', 'Priya Deshmukh', 'finance@stellar.io', '+91 99887 76655', 'Stellar Cloud Tech', 'AT_RISK', 92.00, 'CRITICAL', 340000.00, 120000.00, 45000.00, 680000.00),
    ('c3333333-3333-3333-3333-333333333333', NULL, 'CUST-003', 'Vikram Malhotra', 'vikram@zenithretail.in', '+91 98450 11223', 'Zenith Retail India', 'ACTIVE', 35.00, 'LOW', 78000.00, 12500.00, 12500.00, 150000.00),
    ('c4444444-4444-4444-4444-444444444444', NULL, 'CUST-004', 'Ananya Roy', 'ananya@nexusfintech.com', '+91 97112 33445', 'Nexus Fintech', 'AT_RISK', 71.20, 'HIGH', 210000.00, 65000.00, 0.00, 420000.00),
    ('c5555555-5555-5555-5555-555555555555', NULL, 'CUST-005', 'Karan Patel', 'karan@hyperflow.dev', '+91 95556 77889', 'HyperFlow Devs', 'ACTIVE', 18.00, 'LOW', 45000.00, 0.00, 0.00, 95000.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Payments
INSERT INTO public.payments (id, customer_id, transaction_id, amount, currency, status, gateway, payment_method, error_code, error_description, attempts_count, last_attempted_at)
VALUES
    ('ba111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'pay_rzp_894129', 24500.00, 'INR', 'FAILED', 'Razorpay', 'HDFC Credit Card', 'BAD_REQUEST_PAYMENT_DECLINED', 'Card limit exceeded or international transaction declined by issuing bank', 2, now() - interval '2 hours'),
    ('ba222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'pay_rzp_991823', 60000.00, 'INR', 'FAILED', 'Razorpay', 'ICICI NetBanking', 'GATEWAY_ERROR_TIMEOUT', 'Bank network timeout during OTP 3D secure verification', 3, now() - interval '5 hours'),
    ('ba333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'pay_rzp_331100', 12500.00, 'INR', 'RECOVERED', 'Razorpay', 'UPI (Google Pay)', NULL, 'Recovered via smart WhatsApp fallback link', 2, now() - interval '1 day'),
    ('ba444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'pay_rzp_774921', 65000.00, 'INR', 'FAILED', 'Razorpay', 'Axis Corporate Card', 'INSUFFICIENT_FUNDS', 'Insufficient card balance for monthly enterprise license', 1, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Subscriptions
INSERT INTO public.subscriptions (id, customer_id, subscription_code, plan_name, billing_cycle, amount, currency, status, next_billing_at, grace_period_ends_at, dunning_stage)
VALUES
    ('bb111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'sub_scale_001', 'Scale Plan (Annual)', 'ANNUAL', 24000.00, 'INR', 'PAST_DUE', now() - interval '3 days', now() + interval '4 days', 2),
    ('bb222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'sub_ent_002', 'Enterprise Growth Tier', 'MONTHLY', 60000.00, 'INR', 'PAST_DUE', now() - interval '1 day', now() + interval '6 days', 1),
    ('bb333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'sub_pro_003', 'Pro Team Tier', 'MONTHLY', 12500.00, 'INR', 'ACTIVE', now() + interval '20 days', NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Invoices
INSERT INTO public.invoices (id, customer_id, invoice_number, amount, amount_paid, currency, status, due_date, days_overdue, payment_link)
VALUES
    ('bc111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'INV-2026-0891', 60000.00, 0.00, 'INR', 'OVERDUE', (now() - interval '14 days')::date, 14, 'https://rzp.io/i/rec_inv_891'),
    ('bc222222-2222-2222-2222-222222222222', 'c4444444-4444-4444-4444-444444444444', 'INV-2026-0892', 65000.00, 0.00, 'INR', 'OVERDUE', (now() - interval '7 days')::date, 7, 'https://rzp.io/i/rec_inv_892'),
    ('bc333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'INV-2026-0870', 24500.00, 24500.00, 'INR', 'PAID', (now() - interval '25 days')::date, 0, 'https://rzp.io/i/rec_inv_870')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Checkout Sessions
INSERT INTO public.checkout_sessions (id, customer_id, session_token, customer_email, customer_phone, cart_value, currency, items, dropoff_step, is_abandoned, abandoned_at, recovery_url)
VALUES
    ('bd111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'chk_sess_908234', 'customer@example.com', '+91 91234 56789', 32000.00, 'INR', '[{"name": "AI Revenue Suite Addon", "qty": 1, "price": 32000}]'::jsonb, 'PAYMENT_METHOD_SELECT', true, now() - interval '45 minutes', 'https://razorrecover.ai/checkout/resume?token=chk_908234')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Recovery Cases (The core engine records)
INSERT INTO public.recovery_cases (
    id, case_id, customer_id, payment_id, subscription_id, invoice_id, checkout_session_id,
    issue_type, amount_at_risk, risk_score, risk_level, root_cause, confidence,
    recommended_action, recovery_probability, expected_recovery, status,
    requires_human_approval, current_step, last_action
)
VALUES
    (
        'be111111-1111-1111-1111-111111111111',
        'REC-2026-001',
        'c2222222-2222-2222-2222-222222222222',
        'ba222222-2222-2222-2222-222222222222',
        'bb222222-2222-2222-2222-222222222222',
        'bc111111-1111-1111-1111-111111111111',
        NULL,
        'OVERDUE_INVOICE',
        60000.00,
        92.00,
        'CRITICAL',
        'Bank gateway timeout during monthly subscription renewal; invoice overdue by 14 days',
        94.50,
        'Send high-priority WhatsApp reminder with 1-click Razorpay UPI link + 5% prompt settlement credit',
        82.00,
        49200.00,
        'PENDING_APPROVAL',
        true,
        'Awaiting Finance Manager sign-off on 5% settlement credit',
        'Generated smart recovery proposal'
    ),
    (
        'be222222-2222-2222-2222-222222222222',
        'REC-2026-002',
        'c1111111-1111-1111-1111-111111111111',
        'ba111111-1111-1111-1111-111111111111',
        'bb111111-1111-1111-1111-111111111111',
        NULL,
        NULL,
        'PAYMENT_FAILURE',
        24500.00,
        84.50,
        'HIGH',
        'Credit card daily limit exceeded on HDFC card during recurring batch run',
        89.00,
        'Auto-schedule smart retry at 10:30 AM next business morning with fallback SMS payment link',
        78.00,
        19110.00,
        'RECOMMENDED',
        false,
        'Queued for automatic scheduled execution',
        'Analyzed transaction failure history'
    ),
    (
        'be333333-3333-3333-3333-333333333333',
        'REC-2026-003',
        'c1111111-1111-1111-1111-111111111111',
        NULL,
        NULL,
        NULL,
        'bd111111-1111-1111-1111-111111111111',
        'CHECKOUT_ABANDONMENT',
        32000.00,
        65.00,
        'MEDIUM',
        'User hesitated at payment method selection step for AI Revenue Suite Addon',
        76.00,
        'Dispatch contextual WhatsApp rescue sequence with quick-checkout link',
        68.50,
        21920.00,
        'EXECUTING',
        false,
        'WhatsApp rescue template dispatched to recipient',
        'Triggered WhatsApp webhook delivery'
    ),
    (
        'be444444-4444-4444-4444-444444444444',
        'REC-2026-004',
        'c4444444-4444-4444-4444-444444444444',
        'ba444444-4444-4444-4444-444444444444',
        NULL,
        'bc222222-2222-2222-2222-222222222222',
        NULL,
        'SUBSCRIPTION_FAILURE',
        65000.00,
        71.20,
        'HIGH',
        'Corporate card balance depleted; finance contact changed recently',
        81.00,
        'Trigger multi-channel dunning email + SMS notification to secondary billing admin',
        74.00,
        48100.00,
        'ANALYZING',
        false,
        'Cross-referencing secondary contact records in database',
        'Ingested failed webhook event'
    ),
    (
        'be555555-5555-5555-5555-555555555555',
        'REC-2026-005',
        'c3333333-3333-3333-3333-333333333333',
        'ba333333-3333-3333-3333-333333333333',
        'bb333333-3333-3333-3333-333333333333',
        NULL,
        NULL,
        'PAYMENT_FAILURE',
        12500.00,
        35.00,
        'LOW',
        '3DS OTP timeout on mobile browser session',
        98.00,
        'Automated UPI payment link delivered via WhatsApp',
        95.00,
        12500.00,
        'RECOVERED',
        false,
        'Payment verified on Razorpay gateway (pay_rzp_331100)',
        'Payment settled successfully'
    )
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Recovery Actions
INSERT INTO public.recovery_actions (id, case_id, action_type, channel, parameters, status, scheduled_at, executed_at, result_summary)
VALUES
    ('bf111111-1111-1111-1111-111111111111', 'be111111-1111-1111-1111-111111111111', 'SETTLEMENT_OFFER_WHATSAPP', 'WHATSAPP', '{"discount_pct": 5, "template": "urgent_invoice_settlement"}'::jsonb, 'PENDING', now() + interval '1 hour', NULL, 'Awaiting approval'),
    ('bf222222-2222-2222-2222-222222222222', 'be333333-3333-3333-3333-333333333333', 'CHECKOUT_RESCUE_MSG', 'WHATSAPP', '{"abandoned_item": "AI Revenue Suite Addon", "discount_code": "RECOVER10"}'::jsonb, 'EXECUTED', now() - interval '20 minutes', now() - interval '18 minutes', 'Delivered to recipient WhatsApp'),
    ('bf333333-3333-3333-3333-333333333333', 'be555555-5555-5555-5555-555555555555', 'SMART_RETRY_FALLBACK_LINK', 'WHATSAPP', '{"gateway": "Razorpay UPI", "fallback_link": "https://rzp.io/l/rec331100"}'::jsonb, 'EXECUTED', now() - interval '1 day', now() - interval '1 day', 'Paid in full via UPI QR')
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Recovery Attempts
INSERT INTO public.recovery_attempts (id, case_id, action_id, attempt_number, channel, recipient, message_body, status, sent_at, delivered_at, opened_at, converted_at)
VALUES
    ('aa111111-1111-1111-1111-111111111111', 'be555555-5555-5555-5555-555555555555', 'bf333333-3333-3333-3333-333333333333', 1, 'WHATSAPP', '+91 98450 11223', 'Hi Vikram, your subscription renewal payment encountered a network timeout. Complete it seamlessly with one click here: https://rzp.io/l/rec331100', 'CONVERTED', now() - interval '1 day', now() - interval '1 day', now() - interval '1 day', now() - interval '23 hours')
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Audit Logs
INSERT INTO public.audit_logs (id, actor_id, actor_email, actor_role, action, entity_type, entity_id, previous_state, new_state, ip_address)
VALUES
    ('ab111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'admin@razorrecover.ai', 'ADMIN', 'POLICY_UPDATE', 'recovery_policies', NULL, '{"max_retries": 2}'::jsonb, '{"max_retries": 3}'::jsonb, '127.0.0.1'),
    ('ab222222-2222-2222-2222-222222222222', NULL, 'system@razorrecover.ai', 'SYSTEM', 'CASE_DETECTED', 'recovery_cases', 'be111111-1111-1111-1111-111111111111', '{}'::jsonb, '{"status": "DETECTED", "risk_score": 92}'::jsonb, '127.0.0.1'),
    ('ab333333-3333-3333-3333-333333333333', NULL, 'system@razorrecover.ai', 'SYSTEM', 'CASE_RECOVERED', 'recovery_cases', 'be555555-5555-5555-5555-555555555555', '{"status": "EXECUTING"}'::jsonb, '{"status": "RECOVERED", "amount": 12500}'::jsonb, '127.0.0.1')
ON CONFLICT (id) DO NOTHING;

-- 11. Insert Recovery Policies
INSERT INTO public.recovery_policies (id, name, description, issue_type, min_amount, max_amount, max_discount_pct, max_retries, auto_approve, is_active, priority)
VALUES
    ('ac111111-1111-1111-1111-111111111111', 'Payment Failure Smart Retry Policy', 'Automatically schedules smart retries with optimal routing for failed card charges under ₹50,000', 'PAYMENT_FAILURE', 100.00, 50000.00, 0.00, 3, true, true, 1),
    ('ac222222-2222-2222-2222-222222222222', 'Checkout Cart Recovery Discount Rule', 'Allows automated AI coupon delivery up to 10% for high-intent abandoned carts exceeding ₹10,000', 'CHECKOUT_ABANDONMENT', 10000.00, 100000.00, 10.00, 2, true, true, 2),
    ('ac333333-3333-3333-3333-333333333333', 'Enterprise Overdue Invoice Escalation', 'Requires human approval before offering custom settlement credits on invoices over ₹50,000', 'OVERDUE_INVOICE', 50000.00, 1000000.00, 5.00, 4, false, true, 3)
ON CONFLICT (id) DO NOTHING;

-- 12. Insert Approvals
INSERT INTO public.approvals (id, case_id, proposed_action, requested_by, status, notes)
VALUES
    ('ad111111-1111-1111-1111-111111111111', 'be111111-1111-1111-1111-111111111111', 'Apply 5% prompt settlement discount (₹3,000) and dispatch priority WhatsApp payment link', 'RazorRecover AI Agent', 'PENDING', 'Stellar Cloud Tech is an enterprise account overdue by 14 days')
ON CONFLICT (id) DO NOTHING;

-- 13. Insert Recovery Predictions
INSERT INTO public.recovery_predictions (id, case_id, model_version, predicted_recovery_rate, recommended_channel, optimal_send_time, feature_importance)
VALUES
    ('ae111111-1111-1111-1111-111111111111', 'be111111-1111-1111-1111-111111111111', 'v1.0-fintech-rec', 82.00, 'WHATSAPP', now() + interval '2 hours', '{"invoice_age": 0.42, "prior_spend": 0.35, "gateway_error": 0.23}'::jsonb),
    ('ae222222-2222-2222-2222-222222222222', 'be222222-2222-2222-2222-222222222222', 'v1.0-fintech-rec', 78.00, 'SMART_RETRY', now() + interval '12 hours', '{"card_type": 0.51, "failure_reason": 0.30, "time_of_day": 0.19}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 14. Insert Simulation Runs
INSERT INTO public.simulation_runs (id, name, description, scenario_type, total_cases, total_risk_amount, simulated_recovery_rate, simulated_recovered_amount, status)
VALUES
    ('af111111-1111-1111-1111-111111111111', 'Q3 2026 Historical Recovery Playback', 'Backtested 500 failed Razorpay transactions with multi-channel intelligent retry routing', 'HISTORICAL_PLAYBACK', 500, 1850000.00, 76.40, 1413400.00, 'COMPLETED'),
    ('af222222-2222-2222-2222-222222222222', 'Black Friday Checkout Abandonment Surge', 'Stress-testing recovery agent response under high-concurrency cart drops', 'STRESS_TEST', 1200, 4500000.00, 68.20, 3069000.00, 'COMPLETED')
ON CONFLICT (id) DO NOTHING;

-- 15. Insert Simulation Cases
INSERT INTO public.simulation_cases (id, simulation_run_id, issue_type, amount_at_risk, simulated_action, simulated_outcome, recovery_amount)
VALUES
    ('ca111111-1111-1111-1111-111111111111', 'af111111-1111-1111-1111-111111111111', 'PAYMENT_FAILURE', 15000.00, 'Dynamic UPI Fallback', 'SUCCESS', 15000.00),
    ('ca222222-2222-2222-2222-222222222222', 'af111111-1111-1111-1111-111111111111', 'CHECKOUT_ABANDONMENT', 8500.00, '5% WhatsApp Cart Rescue', 'SUCCESS', 8075.00),
    ('ca333333-3333-3333-3333-333333333333', 'af111111-1111-1111-1111-111111111111', 'SUBSCRIPTION_FAILURE', 45000.00, 'Smart Dunning Sequence', 'SUCCESS', 45000.00)
ON CONFLICT (id) DO NOTHING;

-- 16. Insert AI Messages (Copilot history preview)
INSERT INTO public.ai_messages (id, session_id, role, content, metadata, tokens_used)
VALUES
    ('cb111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'assistant', 'Hello! I am your RazorRecover AI Assistant. I am monitoring your transactions, cart abandonment, and overdue invoices to minimize revenue leakage. How can I assist your recovery ops today?', '{}'::jsonb, 45),
    ('cb222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user', 'What is our current revenue at risk this week?', '{}'::jsonb, 18),
    ('cb333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'assistant', 'Currently, ₹1,81,000 across 4 active cases is at risk. 1 critical invoice case (REC-2026-001) requires your approval for a 5% settlement offer to recover ₹60,000.', '{"referenced_case": "REC-2026-001"}'::jsonb, 68)
ON CONFLICT (id) DO NOTHING;

-- 17. Insert Team Members
INSERT INTO public.team_members (id, user_id, full_name, email, role, department, is_active)
VALUES
    ('cc111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Arjun Mehta', 'admin@razorrecover.ai', 'Head of Revenue Ops', 'Finance & Ops', true),
    ('cc222222-2222-2222-2222-222222222222', NULL, 'Neha Gupta', 'neha.gupta@razorrecover.ai', 'Senior Recovery Specialist', 'Customer Success', true)
ON CONFLICT (id) DO NOTHING;

-- 18. Insert Notifications
INSERT INTO public.notifications (id, user_id, title, message, type, is_read, case_id)
VALUES
    ('cd111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'High-Value Invoice Overdue', 'Case REC-2026-001 (₹60,000) requires human approval for a 5% settlement discount.', 'CRITICAL', false, 'be111111-1111-1111-1111-111111111111'),
    ('cd222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Payment Recovered', 'Case REC-2026-005 (₹12,500) successfully recovered via Smart UPI Fallback.', 'SUCCESS', true, 'be555555-5555-5555-5555-555555555555')
ON CONFLICT (id) DO NOTHING;
