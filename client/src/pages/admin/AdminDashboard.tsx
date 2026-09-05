import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Percent,
  Layers,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Zap,
  CreditCard,
  Clock,
  Shield,
  Download,
  RefreshCw,
  Activity,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { RecoveryTrendChart } from '../../components/charts/RecoveryTrendChart';
import { IssueDistributionChart } from '../../components/charts/IssueDistributionChart';
import { RecoveryFunnelChart } from '../../components/charts/RecoveryFunnelChart';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { RecoveryCase, ExecutiveKpis } from '../../types/database.types';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ExecutiveKpis | null>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [recentCases, setRecentCases] = useState<RecoveryCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadDashboardData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const [metricsRes, trendsRes, casesRes] = await Promise.all([
        api.getMetricsSummary(),
        api.getMetricsTrends(),
        api.getCases(),
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (trendsRes.success) setTrendsData(trendsRes.data);
      if (casesRes.success) setRecentCases(casesRes.data.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const columns: Column<RecoveryCase>[] = [
    {
      key: 'case_id',
      header: 'Case ID',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-[#0D94FB] group-hover:underline">
          {item.case_id}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.customer?.name || 'Customer'}</div>
          <div className="text-[11px] text-slate-500 font-mono">{item.customer?.company || item.customer?.email}</div>
        </div>
      ),
    },
    {
      key: 'issue_type',
      header: 'Issue Type',
      render: (item) => (
        <span className="text-xs text-slate-700 font-medium">
          {item.issue_type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'amount_at_risk',
      header: 'Amount at Risk',
      render: (item) => (
        <span className="font-bold text-slate-900 font-mono">
          {formatCurrency(item.amount_at_risk)}
        </span>
      ),
    },
    {
      key: 'risk_level',
      header: 'Risk Level',
      render: (item) => (
        <RiskBadge level={item.risk_level} score={item.risk_score} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'created_at',
      header: 'Detected',
      render: (item) => (
        <span className="text-xs text-slate-500">
          {formatDateTime(item.created_at)}
        </span>
      ),
    },
  ];

  if (isLoading && !metrics) {
    return <LoadingState message="Connecting to RazorRecover AI Engine & Telemetry..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadDashboardData()} />;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Blade TEST MODE Safety Banner with interactive hover */}
      <div className="group flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-blue-200 bg-white p-3.5 text-xs text-[#0C2651] shadow-blade-sm hover:border-[#0D94FB]/40 hover:shadow-blade-md transition-all duration-200">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-[4px] bg-blue-50 text-[#0D94FB] border border-blue-100 group-hover:scale-105 transition-transform">
            <Shield className="h-4 w-4 text-[#0D94FB]" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D94FB] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0D94FB]"></span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Operating Mode: <strong className="font-mono text-[#0C2651] font-bold">RAZORPAY TEST MODE</strong>
            </span>
            <span className="hidden sm:inline-block text-slate-400">•</span>
            <span className="hidden sm:inline-block text-slate-500">
              Autonomous orchestration with simulated sandbox telemetry &amp; zero live charge impact.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            className="group/btn flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-2xs"
            title="Refresh financial telemetry metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 group-hover/btn:text-[#0D94FB] transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>
          <button
            onClick={() => api.exportCsv('analytics')}
            className="flex items-center gap-1.5 rounded-[4px] border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs font-semibold text-[#0D94FB] transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      <PageHeader
        title="Executive Recovery Dashboard"
        subtitle="Real-time financial telemetry, capital preservation yield, and safe action execution oversight"
        badge="Blade Telemetry"
      />

      {/* 10 Executive KPI Cards Grid with Micro-Animations */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Payments"
          value={metrics?.totalPayments || 0}
          subtitle="Processed in gateway"
          icon={CreditCard}
        />
        <MetricCard
          title="Successful Payments"
          value={metrics?.successfulPayments || 0}
          subtitle="Settled transactions"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Failed Payments"
          value={metrics?.failedPayments || 0}
          subtitle="Declines intercepted"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Total Transaction Value"
          value={formatCurrency(metrics?.totalPaymentValue || 0)}
          subtitle="Gross volume"
          icon={Layers}
        />
        <MetricCard
          title="Amount at Risk"
          value={formatCurrency(metrics?.amountAtRisk || 0)}
          subtitle="Active leakage"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Amount Recovered"
          value={formatCurrency(metrics?.amountRecovered || 0)}
          subtitle="Webhook verified"
          icon={TrendingUp}
          highlight
        />
        <MetricCard
          title="Recovery Rate"
          value={`${metrics?.recoveryRate || 0}%`}
          subtitle="Recovered / at-risk"
          icon={Percent}
          highlight
        />
        <MetricCard
          title="Active Recovery Cases"
          value={metrics?.activeCases || 0}
          subtitle="Under orchestration"
          icon={Zap}
        />
        <MetricCard
          title="Pending Approvals"
          value={metrics?.pendingApprovals || 0}
          subtitle="Human review gated"
          icon={UserCheck}
        />
        <MetricCard
          title="Avg Recovery Time"
          value={metrics?.averageRecoveryTime || '45 Mins'}
          subtitle="Detection to settlement"
          icon={Clock}
        />
      </div>

      {/* Trend & Distribution Visualizations with Hover Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm hover:shadow-blade-md hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0C2651] font-heading">Recovery Trend Over Time</h3>
                <span className="inline-flex items-center gap-1 rounded-[4px] bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <Activity className="h-3 w-3 animate-pulse" /> Live Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Monthly protected ARR yield vs revenue at risk</p>
            </div>
          </div>
          {trendsData?.trends && (
            <RecoveryTrendChart data={trendsData.trends} />
          )}
        </div>
        <div className="lg:col-span-1 rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm hover:shadow-blade-md hover:border-slate-300 transition-all duration-200">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-[#0C2651] font-heading">Incident Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Share by failure classification</p>
          </div>
          {trendsData?.issueBreakdown && (
            <IssueDistributionChart data={trendsData.issueBreakdown} />
          )}
        </div>
      </div>

      {/* Recovery Funnel Progression */}
      {trendsData?.recoveryFunnel && (
        <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm hover:shadow-blade-md hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0C2651] font-heading">Autonomous Recovery Pipeline Stages</h3>
                <span className="inline-flex items-center gap-1 rounded-[4px] bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0D94FB] border border-blue-200">
                  <Sparkles className="h-3 w-3" /> Auto-Optimized
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Funnel throughput from detection to captured revenue</p>
            </div>
          </div>
          <RecoveryFunnelChart data={trendsData.recoveryFunnel} />
        </div>
      )}

      {/* Recent Recovery Incidents with Row Hover & Direct Navigation */}
      <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm hover:shadow-blade-md hover:border-slate-300 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
            <div>
              <h3 className="text-sm font-bold text-[#0C2651] font-heading">Recent Intercepted Incidents</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest payment failure cases ingested from Razorpay webhook</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/cases')}
            className="group flex items-center gap-1.5 text-xs font-bold text-[#0D94FB] hover:text-[#0B82DE] transition-all cursor-pointer"
          >
            <span>View All Cases</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>

        <DataTable
          columns={columns}
          data={recentCases}
          isLoading={isLoading}
          onRowClick={() => navigate('/admin/cases')}
        />
      </div>
    </div>
  );
};
