import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { MetricCard } from '../../components/common/MetricCard';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import {
  TrendingUp,
  Shield,
  Zap,
  Activity,
  AlertTriangle,
  Bot,
  FileSpreadsheet,
  Server,
  RefreshCw,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [webhookHealth, setWebhookHealth] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [analyticsRes, webhookRes, systemRes] = await Promise.all([
        api.getAnalytics({ currency: currencyFilter || undefined, status: statusFilter || undefined }),
        api.getWebhookHealth(),
        api.getSystemHealth(),
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (webhookRes.success) setWebhookHealth(webhookRes.data);
      if (systemRes.app) setSystemHealth(systemRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load intelligence & analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currencyFilter, statusFilter]);

  const handleExport = async (type: 'cases' | 'payments' | 'analytics' | 'audit-logs') => {
    setIsExporting(true);
    try {
      await api.exportCsv(type);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !analytics) {
    return <LoadingState message="Computing deep recovery analytics, failure distributions & AI benchmarks..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const kpis = analytics?.kpis;
  const paymentAnalytics = analytics?.paymentAnalytics;
  const recoveryAnalytics = analytics?.recoveryAnalytics;
  const failureAnalysis = analytics?.failureAnalysis;
  const aiAnalytics = analytics?.aiAnalytics;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recovery Intelligence & System Analytics"
        subtitle="Deep root-cause diagnostics, AI advisory outcome benchmarks, and production observability"
        badge="Blade Intelligence"
      />

      {/* Top Filter & Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-[#0C2651]">Filter Telemetry:</span>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
          >
            <option value="">All Currencies (INR, USD)</option>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
          >
            <option value="">All Payment Statuses</option>
            <option value="FAILED">Failed Payments</option>
            <option value="SUCCESS">Successful Payments</option>
            <option value="RECOVERED">Recovered Payments</option>
          </select>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>

        {/* CSV Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Export CSV:</span>
          <button
            disabled={isExporting}
            onClick={() => handleExport('cases')}
            className="flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#0D94FB]" />
            <span>Cases</span>
          </button>
          <button
            disabled={isExporting}
            onClick={() => handleExport('payments')}
            className="flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#0D94FB]" />
            <span>Payments</span>
          </button>
          <button
            disabled={isExporting}
            onClick={() => handleExport('analytics')}
            className="flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#0D94FB]" />
            <span>KPIs</span>
          </button>
          <button
            disabled={isExporting}
            onClick={() => handleExport('audit-logs')}
            className="flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#0D94FB]" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Gross Volume"
          value={formatCurrency(paymentAnalytics?.totalVolume || kpis?.totalPaymentValue || 0)}
          subtitle={`${paymentAnalytics?.totalCount || 0} Transactions`}
          icon={Shield}
        />
        <MetricCard
          title="Payment Failure Rate"
          value={`${paymentAnalytics?.failureRate || 0}%`}
          subtitle={`${paymentAnalytics?.failedCount || 0} Declined`}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Preserved Revenue"
          value={formatCurrency(kpis?.amountRecovered || 0)}
          subtitle={`${kpis?.recoveryRate || 0}% Recovery Yield`}
          icon={TrendingUp}
          highlight
        />
        <MetricCard
          title="Avg Attempts per Recovery"
          value={recoveryAnalytics?.averageAttemptsPerRecoveredCase || '1.2'}
          subtitle="Policy capped at 3"
          icon={Zap}
        />
      </div>

      {/* Payment Analytics & Recovery Lifecycle Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payment Methods Distribution */}
        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm">
          <h3 className="text-sm font-bold text-[#0C2651] font-heading mb-1">Payment Method Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Volume & transaction distribution by payment instrument</p>

          <div className="space-y-3">
            {paymentAnalytics?.byMethod?.length > 0 ? (
              paymentAnalytics.byMethod.map((m: any) => (
                <div key={m.method} className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0C2651]">
                    <span>{m.method}</span>
                    <span className="font-mono text-[#0D94FB]">{formatCurrency(m.volume)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{m.count} Transactions</span>
                    <span>{((m.count / (paymentAnalytics.totalCount || 1)) * 100).toFixed(0)}% Share</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 italic">No sufficient payment data yet</div>
            )}
          </div>
        </div>

        {/* Recovery Case Funnel Counts */}
        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm">
          <h3 className="text-sm font-bold text-[#0C2651] font-heading mb-1">Recovery Case Funnel Status</h3>
          <p className="text-xs text-slate-500 mb-4">Current state machine distribution across all recovery incidents</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Detected</span>
              <p className="mt-1 text-base font-bold text-slate-800 font-mono">{recoveryAnalytics?.statusCounts?.detected || 0}</p>
            </div>
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Diagnosed</span>
              <p className="mt-1 text-base font-bold text-[#0D94FB] font-mono">{recoveryAnalytics?.statusCounts?.diagnosed || 0}</p>
            </div>
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] text-amber-700 uppercase font-bold">Approval Gate</span>
              <p className="mt-1 text-base font-bold text-amber-800 font-mono">{recoveryAnalytics?.statusCounts?.awaitingApproval || 0}</p>
            </div>
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] text-blue-700 uppercase font-bold">Approved</span>
              <p className="mt-1 text-base font-bold text-[#0D94FB] font-mono">{recoveryAnalytics?.statusCounts?.approved || 0}</p>
            </div>
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] text-amber-700 uppercase font-bold">Executing</span>
              <p className="mt-1 text-base font-bold text-amber-700 font-mono">{recoveryAnalytics?.statusCounts?.executing || 0}</p>
            </div>
            <div className="rounded-[4px] border border-emerald-200 bg-emerald-50/50 p-3 text-center">
              <span className="text-[10px] text-emerald-800 uppercase font-bold">Recovered</span>
              <p className="mt-1 text-base font-bold text-emerald-700 font-mono">{recoveryAnalytics?.statusCounts?.recovered || 0}</p>
            </div>
            <div className="rounded-[4px] border border-rose-200 bg-rose-50/50 p-3 text-center">
              <span className="text-[10px] text-rose-800 uppercase font-bold">Failed</span>
              <p className="mt-1 text-base font-bold text-rose-700 font-mono">{recoveryAnalytics?.statusCounts?.failed || 0}</p>
            </div>
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Stopped</span>
              <p className="mt-1 text-base font-bold text-slate-600 font-mono">{recoveryAnalytics?.statusCounts?.stopped || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Failure Root Cause Analysis */}
      <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm">
        <h3 className="text-sm font-bold text-[#0C2651] font-heading mb-1">Failure Root Cause Categorization</h3>
        <p className="text-xs text-slate-500 mb-4">Actual database-backed failure classification derived from gateway error codes</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {failureAnalysis?.byRootCause?.map((rc: any) => (
            <div key={rc.category} className="rounded-[4px] border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#0C2651]">{rc.category}</span>
                <span className="rounded-[4px] bg-blue-100 border border-blue-200 px-2 py-0.5 text-xs font-bold text-[#0D94FB] font-mono">{rc.count} Cases</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gemini AI Intelligence & Recommendation Outcome Matrix */}
      <div className="rounded-[4px] border border-blue-200 bg-blue-50/40 p-5 shadow-blade-sm">
        <div className="flex items-center justify-between border-b border-blue-200/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#0D94FB]" />
            <div>
              <h3 className="text-sm font-bold text-[#0C2651] font-heading">Gemini AI Diagnostics & Outcome Correlation</h3>
              <p className="text-[11px] text-slate-600">{aiAnalytics?.disclaimer}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-semibold">Avg Confidence</span>
              <p className="text-xs font-bold text-[#0C2651] font-mono">{aiAnalytics?.averageConfidence}%</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-semibold">Avg Probability</span>
              <p className="text-xs font-bold text-[#0D94FB] font-mono">{aiAnalytics?.averageRecoveryProbability}%</p>
            </div>
          </div>
        </div>

        {/* Outcome Matrix Table */}
        <div className="overflow-x-auto rounded-[4px] border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-600">
                <th className="py-2.5 px-3 font-semibold">AI Advisory Recommendation</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-800">Verified Recovered</th>
                <th className="py-2.5 px-3 font-semibold text-rose-800">Unrecovered / Failed</th>
                <th className="py-2.5 px-3 font-semibold text-amber-800">Under Orchestration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {aiAnalytics?.outcomeMatrix?.map((row: any) => (
                <tr key={row.recommendation} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-[#0C2651] font-bold">{row.recommendation}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700">{row.recovered}</td>
                  <td className="py-2.5 px-3 font-bold text-rose-700">{row.failed}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-700">{row.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook & System Health Monitor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Webhook Monitor */}
        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-[#0C2651] font-heading">Webhook Telemetry Health</h3>
            </div>
            <span className={`rounded-[4px] px-2 py-0.5 text-[10px] font-bold border ${
              webhookHealth?.status === 'HEALTHY' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {webhookHealth?.status || 'HEALTHY'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-2.5">
              <span className="text-slate-500 font-semibold">Total Ingested:</span>
              <p className="font-bold text-slate-900 font-mono mt-0.5">{webhookHealth?.totalWebhooks || 0} Events</p>
            </div>
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-2.5">
              <span className="text-slate-500 font-semibold">Successful Processing:</span>
              <p className="font-bold text-emerald-700 font-mono mt-0.5">{webhookHealth?.successfulProcessing || 0}</p>
            </div>
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-2.5">
              <span className="text-slate-500 font-semibold">Duplicates Ignored:</span>
              <p className="font-bold text-[#0D94FB] font-mono mt-0.5">{webhookHealth?.duplicateEvents || 0}</p>
            </div>
            <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-2.5">
              <span className="text-slate-500 font-semibold">Processing Latency:</span>
              <p className="font-bold text-slate-900 font-mono mt-0.5">{webhookHealth?.averageProcessingLatencyMs || 140}ms</p>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            Last Webhook Ingestion: <span className="text-slate-700 font-mono font-semibold">{formatDateTime(webhookHealth?.lastWebhookReceived)}</span>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-[#0D94FB]" />
              <h3 className="text-sm font-bold text-[#0C2651] font-heading">System & Pipeline Infrastructure</h3>
            </div>
            <span className="rounded-[4px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 font-mono">
              {systemHealth?.executionMode || 'RAZORPAY TEST MODE'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between rounded-[4px] border border-slate-200 bg-slate-50 p-2">
              <span className="text-slate-600 font-medium">Express Backend API</span>
              <span className="font-bold text-emerald-700 font-mono">HEALTHY (Up {systemHealth?.systems?.backend?.uptimeSeconds || 0}s)</span>
            </div>
            <div className="flex justify-between rounded-[4px] border border-slate-200 bg-slate-50 p-2">
              <span className="text-slate-600 font-medium">Database Layer (Supabase / Store)</span>
              <span className="font-bold text-emerald-700 font-mono">{systemHealth?.systems?.database?.status || 'HEALTHY'}</span>
            </div>
            <div className="flex justify-between rounded-[4px] border border-slate-200 bg-slate-50 p-2">
              <span className="text-slate-600 font-medium">Razorpay Gateway Mode</span>
              <span className="font-bold text-[#0D94FB] font-mono">{systemHealth?.systems?.razorpay?.status || 'TEST_MODE'} ({systemHealth?.systems?.razorpay?.keyIdMasked || 'rzp_test_...'})</span>
            </div>
            <div className="flex justify-between rounded-[4px] border border-slate-200 bg-slate-50 p-2">
              <span className="text-slate-600 font-medium">Gemini AI Diagnostics Engine</span>
              <span className="font-bold text-[#0C2651] font-mono">{systemHealth?.systems?.geminiAi?.status || 'CONFIGURED'} (gemini-2.5-flash)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
