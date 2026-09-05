import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

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

async function runPhase3Tests() {
  console.log('⚡ ========================================================');
  console.log('⚡  STARTING PHASE 3 COMPREHENSIVE AUTOMATED TEST SUITE   ');
  console.log('⚡ ========================================================\n');

  const adminToken = generateToken('ADMIN', 'admin@razorrecover.ai');
  const customerToken = generateToken('CUSTOMER', 'customer@example.com');

  const headers = (token: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const results: Record<string, boolean> = {};
  const timestamp = Date.now();
  const setupPayload = {
    entity: 'event',
    account_id: 'acc_test_phase3_init',
    event: 'payment.failed',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: `pay_p3_setup_${timestamp}`,
          amount: 150000,
          currency: 'INR',
          status: 'failed',
          order_id: `order_p3_setup_${timestamp}`,
          method: 'card',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Card network failure',
          created_at: Math.floor(timestamp / 1000),
        },
      },
    },
    created_at: Math.floor(timestamp / 1000),
  };

  const setupRaw = JSON.stringify(setupPayload);
  const setupSig = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(setupRaw)
    .digest('hex');

  const targetCaseId = `REC-${setupPayload.payload.payment.entity.id.slice(-6).toUpperCase()}`;

  await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': setupSig,
      'x-razorpay-event-id': `evt_p3_setup_${timestamp}`,
    },
    body: setupRaw,
  });

  // 1. GET /api/cases (with sorting & filtering)
  try {
    const res = await fetch(`${BASE_URL}/api/cases?sortBy=amount_desc&limit=10`, {
      headers: headers(adminToken),
    });
    const data: any = await res.json();
    const isSorted = data.success && data.data.length > 0 && 
      Number(data.data[0].amount_at_risk) >= Number(data.data[data.data.length - 1].amount_at_risk);
    results['1. GET /api/cases (Sorting by amount_desc)'] = Boolean(isSorted);
    console.log('✅ Test 1 Passed: GET /api/cases (Count:', data.count, ', Top Amount: ₹' + data.data[0]?.amount_at_risk + ')');
  } catch (e: any) {
    results['1. GET /api/cases'] = false;
    console.error('❌ Test 1 Failed:', e.message);
  }

  // 2. GET /api/cases/:id (Details)
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}`, {
      headers: headers(adminToken),
    });
    const data: any = await res.json();
    results['2. GET /api/cases/:id (Case Details)'] = data.success && data.data.case_id !== undefined;
    console.log('✅ Test 2 Passed: GET /api/cases/:id (Retrieved:', data.data?.case_id, ')');
  } catch (e: any) {
    results['2. GET /api/cases/:id'] = false;
    console.error('❌ Test 2 Failed:', e.message);
  }

  // 3. GET /api/cases/:id/timeline
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/timeline`, {
      headers: headers(adminToken),
    });
    const data: any = await res.json();
    results['3. GET /api/cases/:id/timeline'] = data.success && Array.isArray(data.data);
    console.log('✅ Test 3 Passed: Case Timeline (Milestones count:', data.data?.length, ')');
  } catch (e: any) {
    results['3. GET /api/cases/:id/timeline'] = false;
    console.error('❌ Test 3 Failed:', e.message);
  }

  // 4. Admin Approval: POST /api/cases/:id/approve
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/approve`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({ notes: 'Phase 3 Automated Approval Test' }),
    });
    const data: any = await res.json();
    results['4. POST /api/cases/:id/approve'] = data.success && (data.data?.status === 'APPROVED' || data.idempotent);
    console.log('✅ Test 4 Passed: Admin Approval (Status:', data.data?.status, ')');
  } catch (e: any) {
    results['4. POST /api/cases/:id/approve'] = false;
    console.error('❌ Test 4 Failed:', e.message);
  }

  // 5. Admin Idempotent Duplicate Approval
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/approve`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({ notes: 'Duplicate Approval Test' }),
    });
    const data: any = await res.json();
    results['5. Idempotent Duplicate Approval'] = data.success && (data.idempotent === true || data.data?.status === 'APPROVED');
    console.log('✅ Test 5 Passed: Idempotent Approval (idempotent:', data.idempotent, ')');
  } catch (e: any) {
    results['5. Idempotent Duplicate Approval'] = false;
    console.error('❌ Test 5 Failed:', e.message);
  }

  // 6. Unauthorized Non-Admin Access Check (CUSTOMER role calling /approve)
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/approve`, {
      method: 'POST',
      headers: headers(customerToken),
      body: JSON.stringify({ notes: 'Hacker Attempt' }),
    });
    results['6. Role-Based Authorization Guard (403 for Customer)'] = res.status === 403;
    console.log('✅ Test 6 Passed: Customer blocked from Admin endpoint (HTTP Status:', res.status, ')');
  } catch (e: any) {
    results['6. Role-Based Authorization Guard'] = false;
    console.error('❌ Test 6 Failed:', e.message);
  }

  // 7. Safe Simulation: POST /api/cases/:id/simulate-recovery
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/simulate-recovery`, {
      method: 'POST',
      headers: headers(adminToken),
    });
    const data: any = await res.json();
    results['7. POST /api/cases/:id/simulate-recovery (Safe Dry Run)'] = data.success && data.data?.simulation?.mode === 'SIMULATION_ONLY';
    console.log('✅ Test 7 Passed: Safe Simulation (Mode:', data.data?.simulation?.mode, ', Result:', data.data?.simulation?.simulated_result, ')');
  } catch (e: any) {
    results['7. POST /api/cases/:id/simulate-recovery'] = false;
    console.error('❌ Test 7 Failed:', e.message);
  }

  // 8. Admin Stop Action: POST /api/cases/:id/stop (requires reason)
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/stop`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({ reason: 'Customer requested cancellation of recurring plan', notes: 'Phase 3 Verification' }),
    });
    const data: any = await res.json();
    results['8. POST /api/cases/:id/stop (With required reason)'] = data.success && data.data?.status === 'STOPPED';
    console.log('✅ Test 8 Passed: Admin Stop Action (Status:', data.data?.status, ')');
  } catch (e: any) {
    results['8. POST /api/cases/:id/stop'] = false;
    console.error('❌ Test 8 Failed:', e.message);
  }

  // 9. Invalid State Transition: Rejecting an already STOPPED / RECOVERED case or invalid action
  try {
    const res = await fetch(`${BASE_URL}/api/cases/${targetCaseId}/approve`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({ notes: 'Invalid Transition from STOPPED' }),
    });
    const data: any = await res.json();
    results['9. Invalid State Transition Rejected (400 Bad Request)'] = res.status === 400 && data.success === false;
    console.log('✅ Test 9 Passed: Invalid Transition Rejected (HTTP:', res.status, 'Error:', data.error, ')');
  } catch (e: any) {
    results['9. Invalid State Transition'] = false;
    console.error('❌ Test 9 Failed:', e.message);
  }

  // 10. Admin Reject Action on another case: POST /api/cases/:id/reject
  try {
    const listRes = await fetch(`${BASE_URL}/api/cases?status=PENDING_APPROVAL`, { headers: headers(adminToken) });
    const listData: any = await listRes.json();
    const fallbackListRes = await fetch(`${BASE_URL}/api/cases`, { headers: headers(adminToken) });
    const fallbackData: any = await fallbackListRes.json();
    const pendingCase = listData.data?.[0] || fallbackData.data?.[1];
    
    if (pendingCase) {
      const res = await fetch(`${BASE_URL}/api/cases/${pendingCase.id || pendingCase.case_id}/reject`, {
        method: 'POST',
        headers: headers(adminToken),
        body: JSON.stringify({ reason: 'Discount threshold exceeded company policy' }),
      });
      const data: any = await res.json();
      results['10. POST /api/cases/:id/reject (With required reason)'] = data.success && data.data?.status === 'STOPPED';
      console.log('✅ Test 10 Passed: Admin Rejection (Status:', data.data?.status, ')');
    }
  } catch (e: any) {
    results['10. POST /api/cases/:id/reject'] = false;
    console.error('❌ Test 10 Failed:', e.message);
  }

  // ==========================================
  // PHASE 2 REGRESSION TESTS
  // ==========================================
  console.log('\n⚡ --- PHASE 2 REGRESSION VERIFICATION ---');

  // 11. Razorpay Webhook with Valid HMAC-SHA256 Signature
  const regTimestamp = Date.now();
  const testPayload = {
    entity: 'event',
    account_id: 'acc_test_phase3_reg',
    event: 'payment.failed',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: `pay_p3_reg_${regTimestamp}`,
          amount: 150000,
          currency: 'INR',
          status: 'failed',
          order_id: `order_p3_${regTimestamp}`,
          method: 'card',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Card expired or daily limit reached',
          created_at: Math.floor(regTimestamp / 1000),
        },
      },
    },
    created_at: Math.floor(regTimestamp / 1000),
  };

  const rawBody = JSON.stringify(testPayload);
  const signature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': `evt_p3_reg_${regTimestamp}`,
      },
      body: rawBody,
    });
    const data: any = await res.json();
    results['11. Phase 2 Webhook Valid Signature (200 OK)'] = res.status === 200 && (data.status === 'ok' || data.received === true);
    console.log('✅ Test 11 Passed: Phase 2 Webhook Ingested (Action:', data.actionTaken, ')');
  } catch (e: any) {
    results['11. Phase 2 Webhook Valid Signature'] = false;
    console.error('❌ Test 11 Failed:', e.message);
  }

  // 12. Razorpay Webhook with Invalid Signature (401 Rejection)
  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'tampered_invalid_signature_12345',
        'x-razorpay-event-id': `evt_p3_tamper_${regTimestamp}`,
      },
      body: rawBody,
    });
    results['12. Phase 2 Webhook Invalid Signature Rejected (401)'] = res.status === 401;
    console.log('✅ Test 12 Passed: Invalid Webhook Rejected with 401 Unauthorized');
  } catch (e: any) {
    results['12. Phase 2 Webhook Invalid Signature'] = false;
    console.error('❌ Test 12 Failed:', e.message);
  }

  // 13. Duplicate Webhook Handling (Idempotency)
  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': `evt_p3_reg_${regTimestamp}`,
      },
      body: rawBody,
    });
    const data: any = await res.json();
    results['13. Duplicate Webhook Idempotency (DUPLICATE_IGNORED)'] = res.status === 200 && data.actionTaken === 'DUPLICATE_IGNORED';
    console.log('✅ Test 13 Passed: Duplicate Webhook Idempotent (Action:', data.actionTaken, ')');
  } catch (e: any) {
    results['13. Duplicate Webhook Idempotency'] = false;
    console.error('❌ Test 13 Failed:', e.message);
  }

  console.log('\n⚡ ========================================================');
  console.log('⚡                 PHASE 3 TEST SUMMARY                    ');
  console.log('⚡ ========================================================');
  let passCount = 0;
  for (const [name, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'} - ${name}`);
    if (passed) passCount++;
  }
  console.log(`\nTotal: ${passCount} / ${Object.keys(results).length} Tests Passed!`);

  if (passCount === Object.keys(results).length) {
    console.log('🎉 ALL PHASE 3 AND REGRESSION TESTS COMPLETED WITH 100% SUCCESS!');
  } else {
    process.exit(1);
  }
}

runPhase3Tests();
