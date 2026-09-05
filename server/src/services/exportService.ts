import { RecoveryCase, PaymentRecord, AuditLog } from '../types';

/**
 * Escapes and sanitizes a value for safe CSV output.
 * Prevents CSV formula injection by prefixing formula triggers (=, +, -, @, \t, \r) with '.
 */
function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // CSV Formula Injection Prevention:
  // If the cell begins with formula trigger characters, prefix with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Sanitize double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export const exportService = {
  /**
   * Generates sanitized CSV string for Recovery Cases.
   */
  exportCasesCsv(cases: RecoveryCase[]): string {
    const headers = [
      'Case ID',
      'Customer Name',
      'Customer Email',
      'Issue Type',
      'Amount at Risk (INR)',
      'Risk Score',
      'Risk Level',
      'Confidence (%)',
      'Recovery Probability (%)',
      'Expected Recovery (INR)',
      'Status',
      'Root Cause',
      'Recommended Action',
      'Current Step',
      'Created At',
      'Updated At',
    ];

    const rows = cases.map((c) => [
      escapeCsvField(c.case_id),
      escapeCsvField(c.customer?.name || 'Customer'),
      escapeCsvField(c.customer?.email || ''),
      escapeCsvField(c.issue_type),
      escapeCsvField(c.amount_at_risk),
      escapeCsvField(c.risk_score),
      escapeCsvField(c.risk_level),
      escapeCsvField(c.confidence),
      escapeCsvField(c.recovery_probability),
      escapeCsvField(c.expected_recovery),
      escapeCsvField(c.status),
      escapeCsvField(c.root_cause || ''),
      escapeCsvField(c.recommended_action || ''),
      escapeCsvField(c.current_step || ''),
      escapeCsvField(c.created_at),
      escapeCsvField(c.updated_at),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  /**
   * Generates sanitized CSV string for Payments.
   */
  exportPaymentsCsv(payments: PaymentRecord[]): string {
    const headers = [
      'Transaction ID',
      'Customer ID',
      'Customer Email',
      'Amount (INR)',
      'Currency',
      'Status',
      'Gateway',
      'Payment Method',
      'Decline Code',
      'Decline Description',
      'Attempts Count',
      'Created At',
      'Updated At',
    ];

    const rows = payments.map((p) => [
      escapeCsvField(p.transaction_id),
      escapeCsvField(p.customer_id),
      escapeCsvField(p.customer?.email || ''),
      escapeCsvField(p.amount),
      escapeCsvField(p.currency),
      escapeCsvField(p.status),
      escapeCsvField(p.gateway),
      escapeCsvField(p.payment_method || 'Razorpay Gateway'),
      escapeCsvField(p.error_code || ''),
      escapeCsvField(p.error_description || ''),
      escapeCsvField(p.attempts_count),
      escapeCsvField(p.created_at),
      escapeCsvField(p.updated_at),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  /**
   * Generates sanitized CSV string for Recovery Analytics.
   */
  exportAnalyticsCsv(analytics: any): string {
    const lines: string[] = [];

    lines.push('"Section","Metric","Value"');
    lines.push(`"KPI","Total Protected Volume",${escapeCsvField(analytics.kpis?.totalProtectedVolume || 0)}`);
    lines.push(`"KPI","Total Amount at Risk",${escapeCsvField(analytics.kpis?.amountAtRisk || 0)}`);
    lines.push(`"KPI","Total Amount Recovered",${escapeCsvField(analytics.kpis?.amountRecovered || 0)}`);
    lines.push(`"KPI","Recovery Rate",${escapeCsvField(`${analytics.kpis?.recoveryRate || 0}%`)}`);
    lines.push(`"KPI","Average Recovery Time",${escapeCsvField(analytics.kpis?.averageRecoveryTime || 'N/A')}`);
    lines.push(`"KPI","Active Cases",${escapeCsvField(analytics.kpis?.activeCases || 0)}`);
    lines.push(`"KPI","Pending Approvals",${escapeCsvField(analytics.kpis?.pendingApprovals || 0)}`);

    if (analytics.failureAnalysis?.byRootCause) {
      for (const item of analytics.failureAnalysis.byRootCause) {
        lines.push(`"Failure Breakdown",${escapeCsvField(item.category)},${escapeCsvField(item.count)}`);
      }
    }

    return lines.join('\n');
  },

  /**
   * Generates sanitized CSV string for Audit Logs.
   */
  exportAuditLogsCsv(logs: AuditLog[]): string {
    const headers = [
      'Log ID',
      'Actor Email',
      'Actor Role',
      'Action',
      'Entity Type',
      'Entity ID',
      'IP Address',
      'Timestamp',
    ];

    const rows = logs.map((l) => [
      escapeCsvField(l.id),
      escapeCsvField(l.actor_email),
      escapeCsvField(l.actor_role),
      escapeCsvField(l.action),
      escapeCsvField(l.entity_type),
      escapeCsvField(l.entity_id),
      escapeCsvField(l.ip_address || '127.0.0.1'),
      escapeCsvField(l.created_at),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
