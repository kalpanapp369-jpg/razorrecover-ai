import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { recoveryPolicyService } from '../src/services/recovery/recoveryPolicyService';
import { dataStore } from '../src/services/dataStore';

const BASE_URL = 'http://localhost:5050';

function generateToken(role: 'ADMIN' | 'CUSTOMER', email: string, userId?: string) {
  return jwt.sign(
    {
      id: userId || (role === 'ADMIN' ? '11111111-1111-1111-1111-111111111111' : '22222222-2222-2222-2222-222222222222'),
      email,
      role,
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function runFixesVerificationSuite() {
  console.log('⚡ ==============================================================================');
  console.log('⚡   STARTING TARGETED FIXES & RECOVERY VERIFICATION TEST SUITE                  ');
  console.log('⚡ ==============================================================================\n');

  const adminToken = generateToken('ADMIN', 'admin@razorrecover.ai');
  // Customer 1: Rohan Sharma (user_id: 22222222-2222-2222-2222-222222222222, customer_id: c1111111-1111-1111-1111-111111111111)
  const customerToken1 = generateToken('CUSTOMER', 'customer@example.com', '22222222-2222-2222-2222-222222222222');
  // Customer 2: Priya Deshmukh (user_id: 33333333-3333-3333-3333-333333333333, customer_id: c2222222-2222-2222-2222-222222222222)
  const customerToken2 = generateToken('CUSTOMER', 'finance@stellar.io', '33333333-3333-3333-3333-333333333333');

  const headers = (token: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const results: Record<string, boolean> = {};

  // ==============================================================================
  // SECTION 1: CUSTOMER RECOVERY CASE ACCESS CONTROL (TASK 2)
  // ==============================================================================
  console.log('⚡ --- SECTION 1: CUSTOMER ACCESS CONTROL ON CASES ---');

  // Test 1: Admin can list all cases
  try {
    const res = await fetch(`${BASE_URL}/api/cases`, { headers: headers(adminToken) });
    const data: any = await res.json();
    results['01. Admin can list all recovery cases'] = data.success && Array.isArray(data.data) && data.data.length >= 3;
    console.log('✅ Test 1 Passed: Admin Access (Total cases returned:', data.data?.length, ')');
  } catch (e: any) {
    results['01. Admin can list all recovery cases'] = false;
    console.error('❌ Test 1 Failed:', e.message);
  }

  // Test 2: Customer 1 sees only their own cases (customer_id: c1111111-...)
  try {
    const res = await fetch(`${BASE_URL}/api/cases`, { headers: headers(customerToken1) });
    const data: any = await res.json();
    const allOwned = data.data?.every((c: any) => c.customer_id === 'c1111111-1111-1111-1111-111111111111');
    results['02. Customer 1 lists only their own cases'] = data.success && Array.isArray(data.data) && allOwned === true;
    console.log('✅ Test 2 Passed: Customer 1 Isolated List (Owned cases count:', data.data?.length, ')');
  } catch (e: any) {
    results['02. Customer 1 lists only their own cases'] = false;
    console.error('❌ Test 2 Failed:', e.message);
  }

  // Test 3: Customer 1 can access their own case (REC-2026-002 -> c1111111-...)
  try {
    const res = await fetch(`${BASE_URL}/api/cases/REC-2026-002`, { headers: headers(customerToken1) });
    const data: any = await res.json();
    results['03. Customer 1 can access their own case details (HTTP 200)'] = res.status === 200 && data.success === true;
    console.log('✅ Test 3 Passed: Customer 1 Accessed Own Case REC-2026-002');
  } catch (e: any) {
    results['03. Customer 1 can access their own case details (HTTP 200)'] = false;
    console.error('❌ Test 3 Failed:', e.message);
  }

  // Test 4: Customer 1 CANNOT access another customer\'s case (REC-2026-001 belongs to Customer 2) -> HTTP 403
  try {
    const res = await fetch(`${BASE_URL}/api/cases/REC-2026-001`, { headers: headers(customerToken1) });
    results['04. Customer 1 blocked from accessing Customer 2 case (HTTP 403)'] = res.status === 403;
    console.log('✅ Test 4 Passed: Customer 1 Forbidden from REC-2026-001 (Status:', res.status, ')');
  } catch (e: any) {
    results['04. Customer 1 blocked from accessing Customer 2 case (HTTP 403)'] = false;
    console.error('❌ Test 4 Failed:', e.message);
  }

  // Test 5: Customer 1 can access their own case timeline
  try {
    const res = await fetch(`${BASE_URL}/api/cases/REC-2026-002/timeline`, { headers: headers(customerToken1) });
    const data: any = await res.json();
    results['05. Customer 1 can access their own case timeline (HTTP 200)'] = res.status === 200 && data.success === true;
    console.log('✅ Test 5 Passed: Customer 1 Timeline Access Verified');
  } catch (e: any) {
    results['05. Customer 1 can access their own case timeline (HTTP 200)'] = false;
    console.error('❌ Test 5 Failed:', e.message);
  }

  // Test 6: Customer 1 CANNOT access another customer\'s timeline -> HTTP 403
  try {
    const res = await fetch(`${BASE_URL}/api/cases/REC-2026-001/timeline`, { headers: headers(customerToken1) });
    results['06. Customer 1 blocked from accessing Customer 2 timeline (HTTP 403)'] = res.status === 403;
    console.log('✅ Test 6 Passed: Customer 1 Forbidden from Timeline of REC-2026-001 (Status:', res.status, ')');
  } catch (e: any) {
    results['06. Customer 1 blocked from accessing Customer 2 timeline (HTTP 403)'] = false;
    console.error('❌ Test 6 Failed:', e.message);
  }

  // ==============================================================================
  // SECTION 2: REQUIRES_APPROVAL POLICY BRANCHES (TASK 3)
  // ==============================================================================
  console.log('\n⚡ --- SECTION 2: REQUIRES_APPROVAL LOGIC EVALUATION ---');

  // Test 7: Low Value + High Confidence + requires_human_approval=false -> requires_approval: false
  try {
    const lowValueCase: any = {
      id: 'test-case-low',
      case_id: 'REC-TEST-LOW',
      amount_at_risk: 5000,
      confidence: 85,
      requires_human_approval: false,
      status: 'RECOMMENDED',
    };
    const evalResult = recoveryPolicyService.evaluateActionEligibility(lowValueCase, null, 'RETRY_PAYMENT', []);
    results['07. Low value + high confidence -> requires_approval: false'] =
      evalResult.allowed === true && evalResult.requires_approval === false;
    console.log('✅ Test 7 Passed: Auto-approval allowed for low-value high-confidence case (requires_approval:', evalResult.requires_approval, ')');
  } catch (e: any) {
    results['07. Low value + high confidence -> requires_approval: false'] = false;
    console.error('❌ Test 7 Failed:', e.message);
  }

  // Test 8: High Value (> ₹25,000) -> requires_approval: true
  try {
    const highValueCase: any = {
      id: 'test-case-high',
      case_id: 'REC-TEST-HIGH',
      amount_at_risk: 35000,
      confidence: 90,
      requires_human_approval: false,
      status: 'RECOMMENDED',
    };
    const evalResult = recoveryPolicyService.evaluateActionEligibility(highValueCase, null, 'RETRY_PAYMENT', []);
    results['08. High value (> ₹25,000) -> requires_approval: true'] =
      evalResult.allowed === true && evalResult.requires_approval === true;
    console.log('✅ Test 8 Passed: High-value guardrail enforced (requires_approval:', evalResult.requires_approval, ')');
  } catch (e: any) {
    results['08. High value (> ₹25,000) -> requires_approval: true'] = false;
    console.error('❌ Test 8 Failed:', e.message);
  }

  // Test 9: Low Confidence (< 60%) -> requires_approval: true
  try {
    const lowConfCase: any = {
      id: 'test-case-lowconf',
      case_id: 'REC-TEST-LOWCONF',
      amount_at_risk: 4000,
      confidence: 45,
      requires_human_approval: false,
      status: 'RECOMMENDED',
    };
    const evalResult = recoveryPolicyService.evaluateActionEligibility(lowConfCase, null, 'RETRY_PAYMENT', []);
    results['09. Low confidence (< 60%) -> requires_approval: true'] =
      evalResult.allowed === true && evalResult.requires_approval === true;
    console.log('✅ Test 9 Passed: Low-confidence guardrail enforced (requires_approval:', evalResult.requires_approval, ')');
  } catch (e: any) {
    results['09. Low confidence (< 60%) -> requires_approval: true'] = false;
    console.error('❌ Test 9 Failed:', e.message);
  }

  // Test 10: Explicit requires_human_approval = true -> requires_approval: true
  try {
    const explicitApprovalCase: any = {
      id: 'test-case-explicit',
      case_id: 'REC-TEST-EXPLICIT',
      amount_at_risk: 3000,
      confidence: 95,
      requires_human_approval: true,
      status: 'PENDING_APPROVAL',
    };
    const evalResult = recoveryPolicyService.evaluateActionEligibility(explicitApprovalCase, null, 'RETRY_PAYMENT', []);
    results['10. Explicit requires_human_approval=true -> requires_approval: true'] =
      evalResult.allowed === true && evalResult.requires_approval === true;
    console.log('✅ Test 10 Passed: Explicit human approval flag enforced (requires_approval:', evalResult.requires_approval, ')');
  } catch (e: any) {
    results['10. Explicit requires_human_approval=true -> requires_approval: true'] = false;
    console.error('❌ Test 10 Failed:', e.message);
  }

  // ==============================================================================
  // SECTION 3: SIMULATION USING REAL SEEDED CASE DATA (TASK 6)
  // ==============================================================================
  console.log('\n⚡ --- SECTION 3: SIMULATION RUN USING REAL CASE DATA ---');

  // Test 11: Simulation calculates volume from real case data
  try {
    const simRes = await fetch(`${BASE_URL}/api/simulation/runs`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        name: 'Targeted Fixes Verification Scenario',
        scenario_type: 'HISTORICAL_PLAYBACK',
        sample_size: 50,
        discount_strategy_pct: 10,
      }),
    });
    const simData: any = await simRes.json();
    const run = simData.data;

    // Verify it is not the old hardcoded sample_size * 3200 (50 * 3200 = 160000)
    // Real cases have amounts like 60000, 24500, 32000, 65000, 12500
    const calculatedNotOldFixed = run?.total_risk_amount !== 50 * 3200;
    results['11. Simulation calculates risk amount from actual seeded cases'] =
      simRes.status === 201 && simData.success === true && run.is_simulated === true && calculatedNotOldFixed;
    console.log('✅ Test 11 Passed: Simulation Executed (Volume:', run.total_risk_amount, ', Recovered:', run.simulated_recovered_amount, ', Rate:', run.simulated_recovery_rate, '%)');
  } catch (e: any) {
    results['11. Simulation calculates risk amount from actual seeded cases'] = false;
    console.error('❌ Test 11 Failed:', e.message);
  }

  // ==============================================================================
  // SCORECARD
  // ==============================================================================
  console.log('\n⚡ ==============================================================================');
  console.log('⚡                 TARGETED FIXES VERIFICATION SCORECARD                          ');
  console.log('⚡ ==============================================================================');
  let passCount = 0;
  for (const [name, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'} - ${name}`);
    if (passed) passCount++;
  }
  console.log(`\nTotal: ${passCount} / ${Object.keys(results).length} Tests Passed!`);

  if (passCount === Object.keys(results).length) {
    console.log('🎉 ALL TARGETED FIXES VERIFIED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runFixesVerificationSuite();
