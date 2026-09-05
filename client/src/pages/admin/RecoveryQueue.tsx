import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { RecoveryCase } from '../../types/database.types';
import {
  Check,
  X,
  Bot,
  Zap,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  Activity,
  Play,
  RotateCcw,
} from 'lucide-react';

export const RecoveryQueue: React.FC = () => {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [filterTab, setFilterTab] = useState<'ACTIVE' | 'PENDING' | 'AUTONOMOUS' | 'ALL'>('ACTIVE');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());

  const navigate = useNavigate();
  const pollTimerRef = useRef<any>(null);
  const activeQueueStatuses = ['PENDING_APPROVAL', 'RECOMMENDED', 'ANALYZING', 'EXECUTING', 'DETECTED', 'ESCALATED', 'APPROVED'];

  const loadQueue = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const res = await api.getCases();
      if (res.success && res.data) {
        const activeItems = res.data.filter((c: RecoveryCase) => activeQueueStatuses.includes(c.status));
        // If all system cases are in terminal states, automatically restore demo queue so it is never empty 0
        if (activeItems.length === 0) {
          const resetRes = await api.resetDemoQueue();
          if (resetRes.success && resetRes.data) {
            setCases(resetRes.data);
            setLastSyncedAt(new Date());
            return;
          }
        }
        setCases(res.data);
        setLastSyncedAt(new Date());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load recovery queue');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  // Real-time auto-polling every 8 seconds when autoRefresh is enabled
  useEffect(() => {
    if (autoRefresh) {
      pollTimerRef.current = setInterval(() => {
        loadQueue(true);
      }, 8000);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [autoRefresh]);

  const handleApprove = async (caseItem: RecoveryCase) => {
    setProcessingId(caseItem.id);
    setActionSuccess(null);
    try {
      const res = await api.approveCase(caseItem.id, 'Approved by Operations Admin in Recovery Queue');
      if (res.success) {
        setActionSuccess(`Case ${caseItem.case_id} approved for recovery dispatch!`);
        await loadQueue(true);
      }
    } catch (err: any) {
      setError(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (caseItem: RecoveryCase) => {
    setProcessingId(caseItem.id);
    setActionSuccess(null);
    try {
      const res = await api.rejectCase(caseItem.id, 'Manual rejection by Operations Admin');
      if (res.success) {
        setActionSuccess(`Case ${caseItem.case_id} marked as stopped.`);
        await loadQueue(true);
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSimulateInboundWebhook = async () => {
    setIsSimulating(true);
    setActionSuccess(null);
    try {
      const res = await api.simulateInboundWebhook();
      if (res.success && res.data) {
        setActionSuccess(`⚡ Live Webhook Ingested: Intercepted Case ${res.data.case_id} (${formatCurrency(res.data.amount_at_risk)}) into queue!`);
        await loadQueue(true);
      }
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetQueue = async () => {
    setIsRefreshing(true);
    setActionSuccess(null);
    try {
      const res = await api.resetDemoQueue();
      if (res.success && res.data) {
        setActionSuccess('Demo recovery queue restored with active human-in-the-loop and autonomous cases.');
        setCases(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Active cases calculations
  const activeCases = cases.filter((c: RecoveryCase) => activeQueueStatuses.includes(c.status));
  const pendingCases = cases.filter((c: RecoveryCase) => ['PENDING_APPROVAL', 'ESCALATED'].includes(c.status));
  const autonomousCases = cases.filter((c: RecoveryCase) => ['RECOMMENDED', 'EXECUTING', 'ANALYZING', 'DETECTED', 'APPROVED'].includes(c.status));

  // Filter queue items based on active tab
  const filteredCases = cases.filter((c: RecoveryCase) => {
    if (filterTab === 'ACTIVE') return activeQueueStatuses.includes(c.status);
    if (filterTab === 'PENDING') return ['PENDING_APPROVAL', 'ESCALATED'].includes(c.status);
    if (filterTab === 'AUTONOMOUS') return ['RECOMMENDED', 'EXECUTING', 'ANALYZING', 'DETECTED', 'APPROVED'].includes(c.status);
    return true; // ALL
  });

  const activeCount = activeCases.length;
  const pendingCount = pendingCases.length;
  const autonomousCount = autonomousCases.length;
  const totalQueueAmount = activeCases.reduce((acc, c) => acc + (Number(c.amount_at_risk) || 0), 0);

  if (isLoading && cases.length === 0) {
    return <LoadingState message="Connecting to Live RazorRecover Telemetry Queue..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Real-time Telemetry Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-blue-200 bg-white p-3.5 text-xs text-[#0C2651] shadow-blade-sm hover:shadow-blade-md hover:border-[#0D94FB]/40 transition-all duration-200">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-[4px] bg-blue-50 text-[#0D94FB] border border-blue-100">
            <Activity className="h-4 w-4 text-[#0D94FB]" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D94FB] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0D94FB]"></span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Live Real-Time Queue Telemetry
            </span>
            <span className="text-slate-400">•</span>
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE FEED ACTIVE
            </span>
            <span className="hidden sm:inline-block text-slate-500">
              Synced: {lastSyncedAt.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs ${
              autoRefresh
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle real-time auto sync"
          >
            <RefreshCw className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto-Sync ON (8s)' : 'Auto-Sync Paused'}</span>
          </button>

          <button
            onClick={handleSimulateInboundWebhook}
            disabled={isSimulating}
            className="flex items-center gap-1.5 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 ${isSimulating ? 'animate-bounce' : ''}`} />
            <span>{isSimulating ? 'Intercepting Webhook...' : '⚡ Simulate Inbound Webhook Failure'}</span>
          </button>

          <button
            onClick={handleResetQueue}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 cursor-pointer shadow-2xs"
            title="Reset queue with sample cases"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Reset Demo Queue</span>
          </button>
        </div>
      </div>

      <PageHeader
        title="Priority Recovery Queue"
        subtitle="Live payment failure incidents requiring human-in-the-loop approval or autonomous AI execution"
        badge={`${filteredCases.length} In Queue`}
      />

      {/* 4 Summary Telemetry Cards with Blade Elevation */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm hover:shadow-blade-md hover:border-blue-300 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Active In Queue</p>
              <div className="text-2xl font-bold font-heading text-[#0C2651] tabular-nums mt-0.5">
                {cases.filter((c) => activeQueueStatuses.includes(c.status)).length}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-blue-50 border border-blue-100 text-[#0D94FB]">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Live intercepted recovery cases</div>
        </div>

        <div className="rounded-[4px] border border-amber-300 bg-white p-4 shadow-blade-sm hover:shadow-blade-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700">Human Approval Gated</p>
              <div className="text-2xl font-bold font-heading text-amber-900 tabular-nums mt-0.5">
                {pendingCount}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-amber-50 border border-amber-200 text-amber-600">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold">Immediate review required</div>
        </div>

        <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm hover:shadow-blade-md hover:border-blue-300 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">AI Autonomous In-Flight</p>
              <div className="text-2xl font-bold font-heading text-[#0C2651] tabular-nums mt-0.5">
                {autonomousCount}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-emerald-50 border border-emerald-100 text-emerald-600">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Executing automated playbooks</div>
        </div>

        <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm hover:shadow-blade-md hover:border-blue-300 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Queue ARR at Risk</p>
              <div className="text-2xl font-bold font-heading text-[#0C2651] tabular-nums mt-0.5">
                {formatCurrency(totalQueueAmount)}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-slate-50 border border-slate-200 text-slate-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Protected ARR under recovery</div>
        </div>
      </div>

      {actionSuccess && (
        <div className="flex items-center justify-between gap-2 rounded-[4px] border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 shadow-blade-sm animate-fade-in-up">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={() => loadQueue(false)} />}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilterTab('ACTIVE')}
          className={`rounded-[4px] px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            filterTab === 'ACTIVE'
              ? 'bg-[#0C2651] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Active Queue ({cases.filter((c) => activeQueueStatuses.includes(c.status)).length})
        </button>
        <button
          onClick={() => setFilterTab('PENDING')}
          className={`rounded-[4px] px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            filterTab === 'PENDING'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending Approval ({pendingCount})
        </button>
        <button
          onClick={() => setFilterTab('AUTONOMOUS')}
          className={`rounded-[4px] px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            filterTab === 'AUTONOMOUS'
              ? 'bg-[#0D94FB] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          AI Autonomous ({autonomousCount})
        </button>
        <button
          onClick={() => setFilterTab('ALL')}
          className={`rounded-[4px] px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            filterTab === 'ALL'
              ? 'bg-[#0C2651] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All System Cases ({cases.length})
        </button>
      </div>

      {/* Queue Items List */}
      {filteredCases.length === 0 ? (
        <div className="rounded-[4px] border border-slate-200 bg-white p-8 text-center shadow-blade-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#0D94FB] mb-3">
            <Check className="h-6 w-6 text-[#0D94FB]" />
          </div>
          <h3 className="text-base font-bold text-[#0C2651]">Recovery Queue is Clear</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            All high-priority cases have been resolved or automated by AI policies. You can simulate an inbound webhook failure to test real-time handling.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSimulateInboundWebhook}
              className="inline-flex items-center gap-2 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Simulate Inbound Payment Failure Webhook</span>
            </button>
            <button
              onClick={handleResetQueue}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore Demo Queue</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredCases.map((item) => (
            <div
              key={item.id}
              className={`rounded-[4px] border p-5 shadow-blade-sm transition-all duration-200 ease-out hover:shadow-blade-hover hover:-translate-y-0.5 ${
                item.status === 'PENDING_APPROVAL' || item.status === 'ESCALATED'
                  ? 'border-amber-300 bg-white border-l-4 border-l-amber-500'
                  : item.status === 'RECOVERED'
                  ? 'border-emerald-200 bg-white border-l-4 border-l-emerald-500'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => navigate(`/admin/cases/${item.case_id}`)}
                      className="font-mono text-xs font-bold text-[#0D94FB] hover:underline cursor-pointer"
                    >
                      {item.case_id}
                    </button>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-bold text-[#0C2651]">
                      {item.customer?.name || 'Customer'} <span className="font-normal text-slate-500">({item.customer?.company || 'Merchant'})</span>
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                    <RiskBadge level={item.risk_level} score={item.risk_score} />
                    <span className="text-[11px] text-slate-400 font-mono ml-auto lg:ml-0">
                      Detected: {formatDateTime(item.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <span className="text-slate-500 font-semibold">Root Cause: </span>
                    {item.root_cause || 'Analyzing transaction telemetry...'}
                  </p>

                  <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 pt-1">
                    <div>
                      Amount at Risk: <span className="font-bold text-slate-900 font-mono">{formatCurrency(item.amount_at_risk)}</span>
                    </div>
                    <div>
                      Expected Recovery: <span className="font-bold text-emerald-700 font-mono">{formatCurrency(item.expected_recovery || Math.round(item.amount_at_risk * 0.8))}</span>
                    </div>
                    <div>
                      AI Confidence: <span className="font-semibold text-slate-800 font-mono">{item.confidence}%</span>
                    </div>
                    <div>
                      Probability: <span className="font-bold text-[#0D94FB] font-mono">{item.recovery_probability}%</span>
                    </div>
                  </div>

                  {item.recommended_action && (
                    <div className="mt-2.5 flex items-start gap-2.5 rounded-[4px] border border-blue-200 bg-blue-50/60 p-3 text-xs text-[#0C2651]">
                      <Bot className="h-4 w-4 shrink-0 text-[#0D94FB] mt-0.5" />
                      <div>
                        <span className="font-bold text-[#0C2651]">AI Recommended Action: </span>
                        {item.recommended_action}
                      </div>
                    </div>
                  )}
                </div>

                {/* Approval & Action Triggers with RazorSense Motion */}
                <div className="flex shrink-0 flex-wrap items-center gap-2 pt-2 lg:pt-0 lg:flex-col lg:items-end">
                  {item.status === 'PENDING_APPROVAL' || item.status === 'ESCALATED' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(item)}
                        disabled={processingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-2xs"
                      >
                        <X className="h-3.5 w-3.5 text-slate-500" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprove(item)}
                        disabled={processingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{processingId === item.id ? 'Approving...' : 'Approve & Execute'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                        Step: <span className="font-semibold text-[#0C2651]">{item.current_step || 'Autonomous AI Execution'}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/admin/cases/${item.case_id}`)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D94FB] hover:text-[#0B82DE] hover:underline cursor-pointer pt-1"
                  >
                    <span>View Case Diagnostics</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
