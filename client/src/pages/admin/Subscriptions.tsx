import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils';
import { SubscriptionRecord } from '../../types/database.types';
import {
  Search,
  Download,
  ArrowUpDown,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  X,
  Zap,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
  Play,
  Activity,
  MessageSquare,
  Mail,
  ShieldCheck,
  CheckCheck,
  RotateCcw,
  Sparkles,
  Send,
} from 'lucide-react';

export const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeActionLoading, setActiveActionLoading] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cycleFilter, setCycleFilter] = useState('');
  const [sortBy, setSortBy] = useState('amount_desc');

  const navigate = useNavigate();

  const loadSubscriptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getSubscriptions();
      if (res.success) {
        setSubscriptions(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !search ||
          sub.subscription_code.toLowerCase().includes(query) ||
          sub.plan_name.toLowerCase().includes(query) ||
          (sub.customer?.name && sub.customer.name.toLowerCase().includes(query)) ||
          (sub.customer?.company && sub.customer.company.toLowerCase().includes(query));

        const matchesStatus = !statusFilter || sub.status === statusFilter;
        const matchesCycle = !cycleFilter || sub.billing_cycle === cycleFilter;

        return matchesSearch && matchesStatus && matchesCycle;
      })
      .sort((a, b) => {
        if (sortBy === 'amount_desc') return (b.amount || 0) - (a.amount || 0);
        if (sortBy === 'dunning_desc') return (b.dunning_stage || 0) - (a.dunning_stage || 0);
        if (sortBy === 'date_asc') return new Date(a.next_billing_at || '').getTime() - new Date(b.next_billing_at || '').getTime();
        return 0;
      });
  }, [subscriptions, search, statusFilter, cycleFilter, sortBy]);

  // Aggregated KPIs
  const totalArr = useMemo(
    () => subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0),
    [subscriptions]
  );
  const dunningCount = useMemo(
    () => subscriptions.filter((s) => s.dunning_stage > 0 || s.status === 'PAST_DUE').length,
    [subscriptions]
  );
  const atRiskArr = useMemo(
    () =>
      subscriptions
        .filter((s) => s.dunning_stage > 0 || s.status === 'PAST_DUE')
        .reduce((sum, s) => sum + (s.amount || 0), 0),
    [subscriptions]
  );

  // -------------------------------------------------------------
  // Dunning Pipeline Interactive Stage Handlers (Stage 1, 2, 3)
  // -------------------------------------------------------------
  const handleTriggerStage1Retry = async (sub: SubscriptionRecord) => {
    setActiveActionLoading('STAGE_1');
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const updated: SubscriptionRecord = {
        ...sub,
        dunning_stage: 1,
        status: 'PAST_DUE',
      };
      setSelectedSub(updated);
      setSubscriptions((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
      setActionMessage(`✓ Stage 1 Executed: Smart Gateway Route Retry dispatched across alternate high-success bank switches.`);
    } catch (err: any) {
      alert(`Stage 1 execution failed: ${err.message}`);
    } finally {
      setActiveActionLoading(null);
    }
  };

  const handleTriggerStage2Reminders = async (sub: SubscriptionRecord) => {
    setActiveActionLoading('STAGE_2');
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const updated: SubscriptionRecord = {
        ...sub,
        dunning_stage: 2,
        status: 'PAST_DUE',
      };
      setSelectedSub(updated);
      setSubscriptions((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
      setActionMessage(`💬 Stage 2 Executed: High-priority WhatsApp message & Email rescue link sent with 5% prompt settlement credit!`);
    } catch (err: any) {
      alert(`Stage 2 dispatch failed: ${err.message}`);
    } finally {
      setActiveActionLoading(null);
    }
  };

  const handleTriggerStage3Escalate = async (sub: SubscriptionRecord) => {
    setActiveActionLoading('STAGE_3');
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const newGraceEnd = new Date(Date.now() + 7 * 86400000).toISOString();
      const updated: SubscriptionRecord = {
        ...sub,
        dunning_stage: 3,
        status: 'PAST_DUE',
        grace_period_ends_at: newGraceEnd,
      };
      setSelectedSub(updated);
      setSubscriptions((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
      setActionMessage(`🛡️ Stage 3 Executed: Grace period extended by +7 days and escalated to Operations Admin queue!`);
    } catch (err: any) {
      alert(`Stage 3 escalation failed: ${err.message}`);
    } finally {
      setActiveActionLoading(null);
    }
  };

  const handleTriggerDunningRecovered = async (sub: SubscriptionRecord) => {
    setActiveActionLoading('RECOVER');
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const updated: SubscriptionRecord = {
        ...sub,
        dunning_stage: 0,
        status: 'ACTIVE',
      };
      setSelectedSub(updated);
      setSubscriptions((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
      setActionMessage(`🎉 Subscription ${sub.subscription_code} Recovered! e-Mandate auto-pay settlement verified.`);
    } catch (err: any) {
      alert(`Recovery simulation failed: ${err.message}`);
    } finally {
      setActiveActionLoading(null);
    }
  };

  const columns: Column<SubscriptionRecord>[] = [
    {
      key: 'subscription_code',
      header: 'Subscription Code',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#0D94FB] group-hover:underline">
          {item.subscription_code}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (item) => (
        <div>
          <div className="font-bold text-[#0C2651]">{item.customer?.name || 'Customer'}</div>
          <div className="text-[11px] text-slate-500 font-mono">{item.customer?.company || item.customer?.email}</div>
        </div>
      ),
    },
    {
      key: 'plan_name',
      header: 'Plan / Tier',
      render: (item) => (
        <div>
          <div className="text-xs font-bold text-slate-800">{item.plan_name}</div>
          <div className="text-[10px] text-slate-500 uppercase font-mono">{item.billing_cycle}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Recurring ARR',
      render: (item) => (
        <span className="font-bold text-slate-900 font-mono">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'dunning_stage',
      header: 'Dunning Stage',
      render: (item) => (
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-[4px] border ${
            item.dunning_stage >= 3
              ? 'bg-purple-50 text-purple-800 border-purple-200'
              : item.dunning_stage === 2
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : item.dunning_stage === 1
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {item.dunning_stage > 0 ? `Stage ${item.dunning_stage}` : 'Active (Stage 0)'}
        </span>
      ),
    },
    {
      key: 'next_billing_at',
      header: 'Billing Date / Grace',
      render: (item) => (
        <div className="text-xs text-slate-600">
          <div>Due: {formatDate(item.next_billing_at)}</div>
          {item.grace_period_ends_at && (
            <div className="text-[10px] text-rose-700 font-semibold font-mono">
              Grace ends: {formatDate(item.grace_period_ends_at)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'action',
      header: 'Manage',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSub(item);
          }}
          className="rounded-[4px] border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0D94FB] hover:bg-blue-100 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Dunning 360°
        </button>
      ),
    },
  ];

  if (isLoading && subscriptions.length === 0) {
    return <LoadingState message="Loading recurring subscriptions and dunning engine state..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadSubscriptions} />;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Subscription Dunning & Retention Engine"
        subtitle="Orchestrate automated subscription recovery, smart retry intervals, and churn prevention"
        badge={`${subscriptions.length} Subscriptions`}
      />

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Subscriptions"
          value={subscriptions.length}
          subtitle={`Total ARR: ${formatCurrency(totalArr)}`}
          icon={Repeat}
        />
        <MetricCard
          title="In Active Dunning"
          value={dunningCount}
          subtitle="Smart retries active"
          icon={AlertTriangle}
        />
        <MetricCard
          title="At-Risk Recurring ARR"
          value={formatCurrency(atRiskArr)}
          subtitle="Targeted for rescue"
          icon={TrendingUp}
          highlight
        />
        <MetricCard
          title="Churn Prevention Yield"
          value="89.4%"
          subtitle="Saved in grace period"
          icon={CheckCircle2}
        />
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className="flex items-center justify-between rounded-[4px] border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 shadow-blade-sm animate-fade-in-up">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, customer, plan..."
            className="w-full rounded-[4px] border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-slate-50 px-2.5 py-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-700 outline-none focus:text-[#0D94FB]"
            >
              <option value="amount_desc">Highest Recurring ARR</option>
              <option value="dunning_desc">Highest Dunning Stage</option>
              <option value="date_asc">Earliest Next Billing</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
          >
            <option value="">All Billing Cycles</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>

          <button
            onClick={() => api.exportCsv('cases')}
            className="flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Subscriptions</span>
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredSubscriptions}
        isLoading={isLoading}
        onRowClick={(item) => setSelectedSub(item)}
      />

      {/* Subscription Dunning Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-md text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-lg font-bold text-[#0D94FB]">
                    {selectedSub.subscription_code}
                  </span>
                  <StatusBadge status={selectedSub.status} size="sm" />
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-[4px] border ${
                    selectedSub.dunning_stage >= 3
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : selectedSub.dunning_stage === 2
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : selectedSub.dunning_stage === 1
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    Dunning Stage {selectedSub.dunning_stage}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Customer: <strong className="text-[#0C2651]">{selectedSub.customer?.name}</strong> ({selectedSub.customer?.company || selectedSub.customer?.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="rounded-[4px] p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Financial & Schedule Highlights */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Recurring ARR</div>
                  <div className="mt-1 text-base font-bold text-slate-900 font-mono">
                    {formatCurrency(selectedSub.amount)}
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Plan Tier</div>
                  <div className="mt-1 text-xs font-bold text-[#0C2651]">{selectedSub.plan_name}</div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Billing Cycle</div>
                  <div className="mt-1 text-xs font-bold text-slate-800 uppercase font-mono">{selectedSub.billing_cycle}</div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Next Billing</div>
                  <div className="mt-1 text-xs font-bold text-slate-800 font-mono">{formatDate(selectedSub.next_billing_at)}</div>
                </div>
              </div>

              {/* Dunning Sequence Interactive Timeline (Stage 1, 2, 3) */}
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0C2651] mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#0D94FB]" />
                    <span>Autonomous Multi-Channel Dunning Pipeline</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">TEST MODE (Instant Execution)</span>
                </div>

                <div className="space-y-3">
                  {/* STAGE 1 CARD */}
                  <div className={`p-3 rounded-[4px] border transition-all ${
                    selectedSub.dunning_stage >= 1
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0C2651]">Stage 1: Smart Gateway Retry Optimization</span>
                          <span className={`rounded-[4px] px-1.5 py-0.2 text-[9px] font-bold ${
                            selectedSub.dunning_stage >= 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {selectedSub.dunning_stage >= 1 ? 'Executed' : 'Available'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Automated retry on alternate high-success gateway bank routes (Axis/HDFC/SBI switches).
                        </p>
                      </div>

                      <button
                        onClick={() => handleTriggerStage1Retry(selectedSub)}
                        disabled={activeActionLoading !== null}
                        className="shrink-0 flex items-center gap-1 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>{activeActionLoading === 'STAGE_1' ? 'Retrying...' : 'Run Stage 1'}</span>
                      </button>
                    </div>
                  </div>

                  {/* STAGE 2 CARD */}
                  <div className={`p-3 rounded-[4px] border transition-all ${
                    selectedSub.dunning_stage >= 2
                      ? 'bg-blue-50/80 border-blue-300 shadow-2xs'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0C2651]">Stage 2: WhatsApp &amp; Email Micro-Reminders</span>
                          <span className={`rounded-[4px] px-1.5 py-0.2 text-[9px] font-bold ${
                            selectedSub.dunning_stage >= 2 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {selectedSub.dunning_stage >= 2 ? 'Active & Sent' : 'Ready to Dispatch'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          1-click Razorpay UPI payment rescue link with prompt 5% settlement incentive via WhatsApp.
                        </p>
                      </div>

                      <button
                        onClick={() => handleTriggerStage2Reminders(selectedSub)}
                        disabled={activeActionLoading !== null}
                        className="shrink-0 flex items-center gap-1 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        <span>{activeActionLoading === 'STAGE_2' ? 'Sending...' : 'Dispatch Stage 2'}</span>
                      </button>
                    </div>
                  </div>

                  {/* STAGE 3 CARD */}
                  <div className={`p-3 rounded-[4px] border transition-all ${
                    selectedSub.dunning_stage >= 3
                      ? 'bg-purple-50/80 border-purple-300 shadow-2xs'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0C2651]">Stage 3: Grace Period Extension &amp; Ops Intervention</span>
                          <span className={`rounded-[4px] px-1.5 py-0.2 text-[9px] font-bold ${
                            selectedSub.dunning_stage >= 3 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {selectedSub.dunning_stage >= 3 ? 'Escalated (+7 Days)' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Grace ends: <strong className="text-slate-800 font-mono">{selectedSub.grace_period_ends_at ? formatDate(selectedSub.grace_period_ends_at) : '1 Sept 2026'}</strong> • Human review requested.
                        </p>
                      </div>

                      <button
                        onClick={() => handleTriggerStage3Escalate(selectedSub)}
                        disabled={activeActionLoading !== null}
                        className="shrink-0 flex items-center gap-1 rounded-[4px] bg-purple-600 hover:bg-purple-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <ShieldAlert className="h-3 w-3" />
                        <span>{activeActionLoading === 'STAGE_3' ? 'Escalating...' : 'Execute Stage 3'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Dock */}
              <div className="rounded-[4px] border border-emerald-200 bg-emerald-50/40 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    AutoPay Settlement Simulation
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5">Mark subscription recovered &amp; reset dunning pipeline to Active</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTriggerDunningRecovered(selectedSub)}
                    disabled={activeActionLoading !== null || selectedSub.status === 'ACTIVE'}
                    className="flex items-center gap-1.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>{activeActionLoading === 'RECOVER' ? 'Settling...' : 'Mark Dunning Recovered'}</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate(`/admin/cases?search=${encodeURIComponent(selectedSub.subscription_code)}`);
                    }}
                    className="flex items-center gap-1.5 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>View Case</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedSub(null)}
                className="rounded-[4px] border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                Close Dunning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
