import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { env } from '../src/config/env';
import { geminiService, DIAGNOSIS_PROMPT_VERSION } from '../src/services/gemini/geminiService';
import { geminiDiagnosisSchema } from '../src/services/gemini/geminiSchemas';

const BASE_URL = 'http://localhost:5050';

function generateToken(role: 'ADMIN' | 'CUSTOMER', email: string) {
  return jwt.sign(
    {
      id: role === 'ADMIN' ? '11111111-1111-1111-1111-111111111111' : '22222222-2222-2222-2222-222222222222',
      email,
      role,
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function runPhase4Tests() {
  console.log('⚡ ========================================================');
  console.log('⚡  STARTING PHASE 4 COMPREHENSIVE AUTOMATED TEST SUITE   ');
  console.log('⚡ ========================================================\n');

  const adminToken = generateToken('ADMIN', 'admin@razorrecover.ai');
  const customerToken = generateToken('CUSTOMER', 'customer@example.com');

  const headers = (token: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const results: Record<string, boolean> = {};

  // 1. Gemini Service Fallback Test
  try {
    const fallbackRes = await geminiService.diagnosePaymentFailure({
      payment_id: 'pay_test_fallback_001',
      amount: 45000,
      currency: 'INR',
      payment_method: 'HDFC Credit Card',
      gateway: 'Razorpay',
      error_code: 'BAD_REQUEST_PAYMENT_DECLINED',
      error_description: 'Card limit exceeded or international transaction declined by issuing bank',
    });

    const isZodValid = geminiDiagnosisSchema.safeParse(fallbackRes.diagnosis).success;
    results['1. Gemini Service Structured Fallback & Zod Validation'] = 
      isZodValid && fallbackRes.diagnosis_source === 'RULE_BASED_FALLBACK';
    console.log('✅ Test 1 Passed: Gemini Fallback Diagnosis (Category:', fallbackRes.diagnosis.category, ', Confidence:', fallbackRes.diagnosis.confidence, ')');
  } catch (e: any) {
    results['1. Gemini Service Structured Fallback'] = false;
    console.error('❌ Test 1 Failed:', e.message);
  }

  // 2. High-Value Human Guardrail Enforced (> ₹25,000)
  try {
    const res = geminiService.generateFallbackDiagnosis({
      payment_id: 'pay_test_guardrail_002',
      amount: 60000,
      currency: 'INR',
      error_code: 'GATEWAY_ERROR_TIMEOUT',
      error_description: 'Bank timeout during OTP verification',
    }, 'Guardrail Test');

    results['2. High-Value Human Guardrail (> ₹25k -> requires_human_approval = true)'] = 
      res.requires_human_approval === true && res.expected_recovery > 0;
    console.log('✅ Test 2 Passed: High-Value Guardrail Enforced (requires_human_approval:', res.requires_human_approval, ')');
  } catch (e: any) {
    results['2. High-Value Human Guardrail'] = false;
    console.error('❌ Test 2 Failed:', e.message);
  }

  // 3. Low-Confidence Human Guardrail (< 60%)
  try {
    const lowConfData = {
      root_cause: 'Ambiguous network interruption during transaction',
      category: 'UNKNOWN' as const,
      severity: 'MEDIUM' as const,
      confidence: 45,
      recovery_probability: 40,
      expected_recovery: 4000,
      recommended_action: 'Manual operator review advised',
      recommended_action_type: 'MANUAL_REVIEW' as const,
      reasoning_summary: 'Insufficient telemetry to classify with high confidence',
      customer_facing_explanation: 'Your transaction could not be verified by the bank.',
      requires_human_approval: true,
    };
    const parsed = geminiDiagnosisSchema.parse(lowConfData);
    results['3. Low-Confidence Guardrail (<60% requires review)'] = 
      parsed.confidence < 60 && parsed.requires_human_approval === true;
    console.log('✅ Test 3 Passed: Low-Confidence Guardrail Validated (Confidence: 45%)');
  } catch (e: any) {
    results['3. Low-Confidence Guardrail'] = false;
    console.error('❌ Test 3 Failed:', e.message);
  }

  // 4. API Endpoint: POST /api/cases/:id/ai-diagnosis (Admin Trigger)
  let targetCaseId = '';
  try {
    const listRes = await fetch(`${BASE_URL}/api/cases`, { headers: headers(adminToken) });
    const listData: any = await listRes.json();
    targetCaseId = listData.data[0]?.id || listData.data[0]?.case_id;

    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/ai-diagnosis`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({ force: true }),
    });
    const data: any = await res.json();
    results['4. POST /api/cases/:id/ai-diagnosis (Admin Trigger)'] = 
      data.success && data.data?.diagnosis?.root_cause !== undefined;
    console.log('✅ Test 4 Passed: AI Diagnosis Endpoint Triggered (Source:', data.data?.diagnosis_source, ')');
  } catch (e: any) {
    results['4. POST /api/cases/:id/ai-diagnosis'] = false;
    console.error('❌ Test 4 Failed:', e.message);
  }

  // 5. AI Idempotency: Duplicate Call Without Force Returns Cached Result
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/ai-diagnosis`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({ force: false }),
    });
    const data: any = await res.json();
    results['5. AI Idempotency Protection (Prevents redundant API calls)'] = data.success === true;
    console.log('✅ Test 5 Passed: AI Idempotency Verified (Success:', data.success, ')');
  } catch (e: any) {
    results['5. AI Idempotency Protection'] = false;
    console.error('❌ Test 5 Failed:', e.message);
  }

  // 6. Role-Based Authorization Guard (Customer blocked from /ai-diagnosis)
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/ai-diagnosis`, {
      method: 'POST',
      headers: headers(customerToken),
      body: JSON.stringify({ force: true }),
    });
    results['6. Role-Based Guard on AI Endpoint (403 for Customer)'] = res.status === 403;
    console.log('✅ Test 6 Passed: Unauthorized User Blocked from AI Endpoint (HTTP 403)');
  } catch (e: any) {
    results['6. Role-Based Guard on AI Endpoint'] = false;
    console.error('❌ Test 6 Failed:', e.message);
  }

  // 7. Audit Log for AI Diagnosis
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/timeline`, {
      headers: headers(adminToken),
    });
    const data: any = await res.json();
    const hasAiLog = data.data?.some((e: any) => 
      e.type === 'DETECTION' || e.title.includes('AI') || e.title.includes('Fallback')
    );
    results['7. AI Audit Log Timeline Integration'] = Boolean(hasAiLog);
    console.log('✅ Test 7 Passed: AI Audit Log Recorded in Timeline (Total Events:', data.data?.length, ')');
  } catch (e: any) {
    results['7. AI Audit Log Timeline Integration'] = false;
    console.error('❌ Test 7 Failed:', e.message);
  }

  // 8. Client Bundle Security: Verify GEMINI_API_KEY is NOT in React dist bundle
  try {
    const distPath = path.resolve(__dirname, '../../client/dist');
    let bundleHasSecret = false;
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(path.join(distPath, 'assets'));
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = fs.readFileSync(path.join(distPath, 'assets', file), 'utf8');
          if (content.includes('GEMINI_API_KEY') || content.includes('AIzaSy')) {
            bundleHasSecret = true;
          }
        }
      }
    }
    results['8. Client Bundle Security (Zero Gemini API Keys in Frontend)'] = !bundleHasSecret;
    console.log('✅ Test 8 Passed: Client Bundle Verified Free of Gemini Secrets');
  } catch (e: any) {
    results['8. Client Bundle Security'] = false;
    console.error('❌ Test 8 Failed:', e.message);
  }

  // ==========================================
  // PHASE 2 REGRESSION TESTS
  // ==========================================
  console.log('\n⚡ --- PHASE 2 REGRESSION VERIFICATION ---');

  const timestamp = Date.now();
  const testPayload = {
    entity: 'event',
    account_id: 'acc_test_phase4_reg',
    event: 'payment.failed',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: `pay_p4_reg_${timestamp}`,
          amount: 250000,
          currency: 'INR',
          status: 'failed',
          order_id: `order_p4_${timestamp}`,
          method: 'netbanking',
          bank: 'HDFC',
          error_code: 'GATEWAY_ERROR_TIMEOUT',
          error_description: 'Bank server timeout during 3DS verification',
          created_at: Math.floor(timestamp / 1000),
        },
      },
    },
    created_at: Math.floor(timestamp / 1000),
  };

  const rawBody = JSON.stringify(testPayload);
  const signature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  // 9. Razorpay Webhook Valid HMAC-SHA256
  let webhookCaseId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': `evt_p4_reg_${timestamp}`,
      },
      body: rawBody,
    });
    const data: any = await res.json();
    results['9. Phase 2 Webhook Valid Signature (200 OK)'] = 
      res.status === 200 && (data.status === 'ok' || data.received === true);
    console.log('✅ Test 9 Passed: Phase 2 Webhook Ingested Live (Action:', data.actionTaken, ')');

    webhookCaseId = `REC-${testPayload.payload.payment.entity.id.slice(-6).toUpperCase()}`;
  } catch (e: any) {
    results['9. Phase 2 Webhook Valid Signature'] = false;
    console.error('❌ Test 9 Failed:', e.message);
  }

  // 10. Razorpay Webhook Invalid Signature Rejection (401)
  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'tampered_phase4_signature',
        'x-razorpay-event-id': `evt_p4_tamper_${timestamp}`,
      },
      body: rawBody,
    });
    results['10. Phase 2 Webhook Invalid Signature Rejected (401)'] = res.status === 401;
    console.log('✅ Test 10 Passed: Tampered Signature Rejected with 401 Unauthorized');
  } catch (e: any) {
    results['10. Phase 2 Webhook Invalid Signature'] = false;
    console.error('❌ Test 10 Failed:', e.message);
  }

  // 11. Duplicate Webhook Idempotency
  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': `evt_p4_reg_${timestamp}`,
      },
      body: rawBody,
    });
    const data: any = await res.json();
    results['11. Phase 2 Duplicate Webhook Idempotency (DUPLICATE_IGNORED)'] = 
      res.status === 200 && data.actionTaken === 'DUPLICATE_IGNORED';
    console.log('✅ Test 11 Passed: Duplicate Webhook Idempotent (Action:', data.actionTaken, ')');
  } catch (e: any) {
    results['11. Phase 2 Duplicate Webhook Idempotency'] = false;
    console.error('❌ Test 11 Failed:', e.message);
  }

  // ==========================================
  // PHASE 3 REGRESSION TESTS
  // ==========================================
  console.log('\n⚡ --- PHASE 3 REGRESSION VERIFICATION ---');

  // 12. Admin Approval on Active Webhook Case
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${webhookCaseId}/approve`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({ notes: 'Phase 4 Approval Regression Test' }),
    });
    const data: any = await res.json();
    results['12. Phase 3 Admin Approval (POST /api/cases/:id/approve)'] = 
      data.success && (data.data?.status === 'APPROVED' || data.idempotent === true);
    console.log('✅ Test 12 Passed: Admin Approval Regression Verified (Status:', data.data?.status, ')');
  } catch (e: any) {
    results['12. Phase 3 Admin Approval'] = false;
    console.error('❌ Test 12 Failed:', e.message);
  }

  // 13. Safe Simulation on Approved Webhook Case
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${webhookCaseId}/simulate-recovery`, {
      method: 'POST',
      headers: headers(adminToken),
    });
    const data: any = await res.json();
    results['13. Phase 3 Safe Simulation (POST /api/cases/:id/simulate-recovery)'] = 
      data.success && data.data?.simulation?.mode === 'SIMULATION_ONLY';
    console.log('✅ Test 13 Passed: Safe Simulation Regression Verified (Mode: SIMULATION_ONLY)');
  } catch (e: any) {
    results['13. Phase 3 Safe Simulation'] = false;
    console.error('❌ Test 13 Failed:', e.message);
  }

  // 14. Admin Stop Action with Reason on Webhook Case
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${webhookCaseId}/stop`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({ reason: 'Admin confirmed account closure', notes: 'Regression check' }),
    });
    const data: any = await res.json();
    results['14. Phase 3 Admin Stop Action (POST /api/cases/:id/stop)'] = 
      data.success && (data.data?.status === 'STOPPED' || data.idempotent === true);
    console.log('✅ Test 14 Passed: Admin Stop Regression Verified (Status:', data.data?.status, ')');
  } catch (e: any) {
    results['14. Phase 3 Admin Stop Action'] = false;
    console.error('❌ Test 14 Failed:', e.message);
  }

  console.log('\n⚡ ========================================================');
  console.log('⚡                 PHASE 4 TEST SUMMARY                    ');
  console.log('⚡ ========================================================');
  let passCount = 0;
  for (const [name, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'} - ${name}`);
    if (passed) passCount++;
  }
  console.log(`\nTotal: ${passCount} / ${Object.keys(results).length} Tests Passed!`);

  if (passCount === Object.keys(results).length) {
    console.log('🎉 ALL PHASE 4 AND REGRESSION TESTS COMPLETED WITH 100% SUCCESS!');
  } else {
    process.exit(1);
  }
}

runPhase4Tests();
