# RazorRecover AI ⚡

> **Tagline:** *"Detect revenue leakage. Diagnose the cause. Recover it intelligently."*

**RazorRecover AI** is a full-stack SaaS platform built for the **Razorpay Hackathon (AI Revenue Recovery Track)**. It detects transaction failures, checkout abandonment, and subscription dunning, diagnoses root causes using Google Gemini AI with deterministic fallbacks, and orchestrates human-in-the-loop recovery workflows in Razorpay **TEST MODE**.

---

## 🛡️ Implementation Status & Capabilities

### ✅ Implemented & Working in the Codebase

- **Razorpay Webhook Ingestion & HMAC Verification:** Cryptographic HMAC-SHA256 signature verification against raw request buffers. Handles `payment.failed`, `payment.captured`, `payment.authorized`, `order.paid`, `invoice.paid`, and subscription events with duplicate replay idempotency (`DUPLICATE_IGNORED`).
- **Razorpay TEST MODE Retry Execution:** Genuine Razorpay TEST MODE order creation and retry routing for `RETRY_PAYMENT` recovery actions.
- **Google Gemini AI Diagnostics:** Server-side advisory diagnosis powered by `@google/genai` (`gemini-2.5-flash`) with structured Zod schema validation and automatic fallback to rule-based classification when offline.
- **Admin Approval & Human-in-the-Loop Governance:** Mandatory admin sign-off for high-value cases (> ₹25,000), low AI confidence (< 60%), and policy-flagged recovery actions.
- **Multi-Tenant Customer Access Control (RBAC):** `ADMIN` role has global case visibility; `CUSTOMER` role is strictly partitioned to view only their own cases, payments, invoices, and audit timelines.
- **Recovery Policy & Stopping Rules Engine:** Maximum 3 recovery attempts per case, automatic escalation to `MANUAL_REVIEW`, cooldown windows, and terminal state safeguards.
- **Simulation Engine Powered by Seeded Case Telemetry:** What-if backtesting engine calculates total risk volume, recovery probability, and ARR saved using actual seeded cases from `dataStore`.
- **Immutable Audit Trail:** Comprehensive event logging with actor attribution, previous/new state diffs, and chronological timeline reconstruction.
- **Executive Analytics & Reporting:** Real-time KPI aggregation, failure category clustering, and CSV export with formula injection prevention (`=, +, -, @` escaping).
- **Security & Production Hardening:** Granular sliding-window rate limiting on auth, AI, export, and action endpoints; security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options); correlation tracking via `X-Request-Id`; stack trace suppression in production.

---

### ⚠️ Demo & Simulation Scope (Clearly Disclosed)

- **Demo-Mode Authentication:** Uses JWT-based session tokens with demo users (`admin@razorrecover.ai` and `customer@example.com`). Signups and session records are held in memory rather than production Supabase Auth.
- **Razorpay TEST MODE Only:** Operates exclusively with test credentials (`rzp_test_...`). No real money movement, live card charges, or production gateway credentials are used.
- **Communication Channels (Simulated):** Outreach channels (WhatsApp, SMS, Email dunning) are modeled as simulated workflows for hackathon demonstration; no real external SMS or WhatsApp messages are dispatched.
- **Gemini AI Advisory Guardrail:** Gemini AI recommendations are strictly advisory and cannot approve or execute payment recovery actions autonomously.

---

## 🗄️ Database Architecture

The PostgreSQL schema is located in `supabase/migrations/001_initial_schema.sql` with sample demo records in `002_seed_demo_data.sql`. The backend includes a built-in fault-tolerant in-memory repository (`dataStore.ts`) that mirrors the schema:

1. `users` — Demo user accounts and roles (`ADMIN`, `CUSTOMER`).
2. `customers` — Customer accounts with risk scoring and lifetime value metrics.
3. `payments` — Transaction logs with gateway error codes, decline reasons, and retry counters.
4. `subscriptions` — Recurring billing subscriptions and dunning stages.
5. `invoices` — Receivables ledger, due dates, aging buckets, and payment links.
6. `recovery_cases` — Central recovery cases with amount at risk, risk scores, root cause, confidence, and status.
7. `recovery_actions` — Planned and executed recovery actions (Retry, Alternative Payment, Manual Review).
8. `audit_logs` — Immutable audit trail with actor IDs and state diffs.
9. `recovery_policies` — Recovery policy rules, threshold caps, and approval guardrails.
10. `simulation_runs` — Scenario backtesting runs powered by real case telemetry.

---

## 🧭 Application Routing & Role Boundaries

### Role-Based Access:
- **`ADMIN`:** Full access to all 13 Operations Control Center views (Dashboard, Recovery Queue, Cases, Customers, Payments, Subscriptions, Invoices, Simulation, Analytics, Copilot, Audit Logs, Policies, Settings).
- **`CUSTOMER`:** Access strictly restricted to customer-owned views (Customer Dashboard, Payments, Subscriptions, Invoices, Resolution Center, Profile). Customers cannot access cases or timelines belonging to other customers.

---

## ⚡ Quick Start & Running Locally

### 1. Install Dependencies

```bash
# Root, server, and client dependencies
npm run install:all
```

### 2. Environment Configuration

Copy the example environment templates:
```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

*(All `.env.example` templates contain safe placeholders only. Real secrets are never committed).*

### 3. Run Development Servers

```bash
# Starts Express backend on :5050 and Vite frontend on :5174
npm run dev
```

Open your browser at: **`http://localhost:5174`**

---

## 🔑 Demo Test Credentials

| Role | Email | Password | Landing View |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@razorrecover.ai` | `password123` | `/admin/dashboard` |
| **Customer** | `customer@example.com` | `password123` | `/customer/dashboard` |

---

## 🧪 Automated Testing & Verification

Run the test harnesses from `server/`:

```bash
# Run all test suites
npx ts-node scripts/test_phase3.ts
npx ts-node scripts/test_phase4.ts
npx ts-node scripts/test_phase5.ts
npx ts-node scripts/test_phase6.ts
npx ts-node scripts/test_phase7.ts
npx ts-node scripts/test_phase8.ts
```

Compile TypeScript and build assets:

```bash
# Backend build check
cd server && npm run build

# Frontend build check
cd client && npm run build
```
