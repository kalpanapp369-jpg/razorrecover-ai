-- ==============================================================================
-- RazorRecover AI - Supabase PostgreSQL Database Schema
-- Migration 001: Initial Schema
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- Custom Enum Types
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('CUSTOMER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_type_enum AS ENUM (
        'PAYMENT_FAILURE',
        'CHECKOUT_ABANDONMENT',
        'SUBSCRIPTION_FAILURE',
        'OVERDUE_INVOICE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level_enum AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_status_enum AS ENUM (
        'DETECTED',
        'ANALYZING',
        'RECOMMENDED',
        'PENDING_APPROVAL',
        'APPROVED',
        'EXECUTING',
        'VERIFYING',
        'RECOVERED',
        'FAILED',
        'STOPPED',
        'ESCALATED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'SUCCESS',
        'FAILED',
        'PENDING',
        'REFUNDED',
        'RECOVERED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM (
        'ACTIVE',
        'PAST_DUE',
        'CANCELLED',
        'RECOVERED',
        'UNPAID'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status_enum AS ENUM (
        'DRAFT',
        'ISSUED',
        'OVERDUE',
        'PAID',
        'VOID',
        'WRITTEN_OFF',
        'RECOVERED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 1. USERS & PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'CUSTOMER',
    full_name TEXT,
    phone TEXT,
    company TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. CUSTOMERS TABLE (Merchant's End Customers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    external_customer_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    risk_score NUMERIC(5,2) DEFAULT 0.00,
    risk_level risk_level_enum DEFAULT 'LOW',
    total_spend NUMERIC(12,2) DEFAULT 0.00,
    total_risk_amount NUMERIC(12,2) DEFAULT 0.00,
    recovered_amount NUMERIC(12,2) DEFAULT 0.00,
    lifetime_value NUMERIC(12,2) DEFAULT 0.00,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. PAYMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status payment_status_enum NOT NULL DEFAULT 'PENDING',
    gateway TEXT DEFAULT 'Razorpay',
    payment_method TEXT,
    error_code TEXT,
    error_description TEXT,
    attempts_count INT NOT NULL DEFAULT 1,
    last_attempted_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. SUBSCRIPTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    subscription_code TEXT UNIQUE,
    plan_name TEXT NOT NULL,
    billing_cycle TEXT NOT NULL DEFAULT 'MONTHLY',
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status subscription_status_enum NOT NULL DEFAULT 'ACTIVE',
    next_billing_at TIMESTAMPTZ,
    grace_period_ends_at TIMESTAMPTZ,
    dunning_stage INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. INVOICES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status invoice_status_enum NOT NULL DEFAULT 'ISSUED',
    due_date DATE NOT NULL,
    days_overdue INT NOT NULL DEFAULT 0,
    payment_link TEXT,
    line_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. CHECKOUT SESSIONS TABLE (Cart Abandonment)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    session_token TEXT UNIQUE NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    cart_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    items JSONB DEFAULT '[]'::jsonb,
    dropoff_step TEXT,
    is_abandoned BOOLEAN NOT NULL DEFAULT true,
    abandoned_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    recovery_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. RECOVERY CASES TABLE (Core Recovery Entity)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recovery_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    checkout_session_id UUID REFERENCES public.checkout_sessions(id) ON DELETE SET NULL,
    issue_type issue_type_enum NOT NULL,
    amount_at_risk NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    risk_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    risk_level risk_level_enum NOT NULL DEFAULT 'MEDIUM',
    root_cause TEXT,
    confidence NUMERIC(5,2) DEFAULT 0.00,
    recommended_action TEXT,
    recovery_probability NUMERIC(5,2) DEFAULT 0.00,
    expected_recovery NUMERIC(12,2) DEFAULT 0.00,
    status case_status_enum NOT NULL DEFAULT 'DETECTED',
    requires_human_approval BOOLEAN NOT NULL DEFAULT false,
    current_step TEXT,
    last_action TEXT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. RECOVERY ACTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recovery_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.recovery_cases(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    channel TEXT NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING',
    scheduled_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    result_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. RECOVERY ATTEMPTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recovery_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.recovery_cases(id) ON DELETE CASCADE,
    action_id UUID REFERENCES public.recovery_actions(id) ON DELETE SET NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    message_body TEXT,
    status TEXT NOT NULL DEFAULT 'SENT',
    response_payload JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. AUDIT LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    previous_state JSONB DEFAULT '{}'::jsonb,
    new_state JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. RECOVERY POLICIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recovery_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    issue_type issue_type_enum,
    min_amount NUMERIC(12,2) DEFAULT 0.00,
    max_amount NUMERIC(12,2),
    max_discount_pct NUMERIC(5,2) DEFAULT 0.00,
    max_retries INT DEFAULT 3,
    auto_approve BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INT NOT NULL DEFAULT 1,
    guardrails JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 12. APPROVALS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.recovery_cases(id) ON DELETE CASCADE,
    proposed_action TEXT NOT NULL,
    requested_by TEXT DEFAULT 'RazorRecover AI Agent',
    status TEXT NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 13. RECOVERY PREDICTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recovery_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.recovery_cases(id) ON DELETE CASCADE,
    model_version TEXT DEFAULT 'v1.0-revenue-rec',
    predicted_recovery_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    recommended_channel TEXT,
    optimal_send_time TIMESTAMPTZ,
    feature_importance JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 14. SIMULATION RUNS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    scenario_type TEXT NOT NULL DEFAULT 'HISTORICAL_PLAYBACK',
    total_cases INT NOT NULL DEFAULT 0,
    total_risk_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    simulated_recovery_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    simulated_recovered_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 15. SIMULATION CASES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.simulation_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
    issue_type issue_type_enum NOT NULL,
    amount_at_risk NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    simulated_action TEXT NOT NULL,
    simulated_outcome TEXT NOT NULL,
    recovery_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 16. AI MESSAGES TABLE (AI Copilot Chat History)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 17. TEAM MEMBERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin',
    department TEXT DEFAULT 'Finance & Ops',
    is_active BOOLEAN NOT NULL DEFAULT true,
    permissions JSONB DEFAULT '["all"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 18. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO',
    is_read BOOLEAN NOT NULL DEFAULT false,
    case_id UUID REFERENCES public.recovery_cases(id) ON DELETE SET NULL,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_risk_level ON public.customers(risk_level);

CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

CREATE INDEX IF NOT EXISTS idx_recovery_cases_case_id ON public.recovery_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_recovery_cases_customer_id ON public.recovery_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_recovery_cases_status ON public.recovery_cases(status);
CREATE INDEX IF NOT EXISTS idx_recovery_cases_issue_type ON public.recovery_cases(issue_type);
CREATE INDEX IF NOT EXISTS idx_recovery_cases_risk_level ON public.recovery_cases(risk_level);

CREATE INDEX IF NOT EXISTS idx_recovery_actions_case_id ON public.recovery_actions(case_id);
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_case_id ON public.recovery_attempts(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_case_id ON public.approvals(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ==============================================================================
-- AUTOMATIC updated_at TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_%I ON %I;', t, t);
        EXECUTE format('CREATE TRIGGER trg_update_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', t, t);
    END LOOP;
END $$;
