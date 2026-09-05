import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { RecoveryCase, RecoveryAction } from '../../types/database.types';
import {
  Search,
  X,
  Bot,
  CheckCircle2,
  XCircle,
  StopCircle,
  Play,
  Clock,
  ShieldAlert,
  ArrowUpDown,
  History,
  Info,
  CreditCard,
  Sparkles,
  Cpu,
  RefreshCw,
  FileText,
  AlertTriangle,
  Zap,
  Check,
  PlusCircle,
  Activity,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const Cases: React.FC = () => {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [caseActions, setCaseActions] = useState<RecoveryAction[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAiDiagnosis, setIsRunningAiDiagnosis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Modals for Actions
  const [actionModalType, setActionModalType] = useState<'APPROVE' | 'REJECT' | 'STOP' | 'SIMULATE' | 'PLAN_ACTION' | 'EXECUTE_ACTION' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [planActionType, setPlanActionType] = useState<'RETRY_PAYMENT' | 'ALTERNATIVE_PAYMENT_METHOD' | 'MANUAL_REVIEW' | 'NO_ACTION'>('RETRY_PAYMENT');
  const [selectedActionRecord, setSelectedActionRecord] = useState<RecoveryAction | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const { id: routeCaseId } = useParams();
  const navigate = useNavigate();

  const loadCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getCases({
        search: search || undefined,
        issueType: issueTypeFilter || undefined,
        riskLevel: riskFilter || undefined,
        status: statusFilter || undefined,
        sortBy: sortBy || undefined,
      });
      if (res.success) {
        setCases(res.data);
        if (selectedCase) {
          const updated = res.data.find((c: any) => c.id === selectedCase.id || c.case_id === selectedCase.case_id);
          if (updated) setSelectedCase(updated);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load recovery cases');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCaseTimeline = async (caseId: string) => {
    setIsLoadingTimeline(true);
    try {
      const res = await api.getCaseTimeline(caseId);
      if (res.success) {
        setTimeline(res.data);
      }
    } catch (err) {
      console.warn('Failed to load timeline:', err);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  const loadCaseActions = async (caseId: string) => {
    setIsLoadingActions(true);
    try {
      const res = await api.getCaseActions(caseId);
      if (res.success) {
        setCaseActions(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load actions:', err);
    } finally {
      setIsLoadingActions(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [issueTypeFilter, riskFilter, statusFilter, sortBy]);

  // Sync route param with selected case
  useEffect(() => {
    if (routeCaseId && cases.length > 0) {
      const matched = cases.find((c) => c.case_id === routeCaseId || c.id === routeCaseId);
      if (matched) {
        setSelectedCase(matched);
      }
    }
  }, [routeCaseId, cases]);

  const handleCloseModal = () => {
    setSelectedCase(null);
    if (routeCaseId) {
      navigate('/admin/cases');
    }
  };

  useEffect(() => {
    if (selectedCase) {
      const id = selectedCase.id || selectedCase.case_id;
      loadCaseTimeline(id);
      loadCaseActions(id);
    } else {
      setTimeline([]);
      setCaseActions([]);
    }
  }, [selectedCase?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCases();
  };

  const handleRunAiDiagnosis = async () => {
    if (!selectedCase) return;
    setIsRunningAiDiagnosis(true);
    setActionMessage(null);
    try {
      const res = await api.runAiDiagnosis(selectedCase.id || selectedCase.case_id, true);
      if (res.success) {
        setActionMessage(`Gemini AI diagnosis completed via ${res.data?.diagnosis_source || 'Gemini'}!`);
        await loadCases();
        const id = selectedCase.id || selectedCase.case_id;
        await loadCaseTimeline(id);
        await loadCaseActions(id);
      }
    } catch (err: any) {
      alert(`AI Diagnosis failed: ${err.message}`);
    } finally {
      setIsRunningAiDiagnosis(false);
    }
  };

  const handlePlanActionSubmit = async () => {
    if (!selectedCase) return;
    setIsSubmittingAction(true);
    try {
      const res = await api.planRecoveryAction(selectedCase.id || selectedCase.case_id, {
        action_type: planActionType,
        reason: actionReason || `Admin scheduled ${planActionType} recovery strategy`,
        confidence: selectedCase.confidence,
        estimated_recovery: selectedCase.expected_recovery,
        requires_approval: selectedCase.requires_human_approval || Number(selectedCase.amount_at_risk) > 25000,
        notes: actionNotes,
      });

      if (res.success) {
        setActionMessage(res.message);
        setActionModalType(null);
        setActionReason('');
        setActionNotes('');
        const id = selectedCase.id || selectedCase.case_id;
        await loadCases();
        await loadCaseActions(id);
        await loadCaseTimeline(id);
      }
    } catch (err: any) {
      alert(`Action planning failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    if (!selectedCase) return;
    setIsSubmittingAction(true);
    try {
      const res = await api.approveRecoveryAction(selectedCase.id || selectedCase.case_id, actionId, 'Approved by Admin');
      if (res.success) {
        setActionMessage(res.message);
        const id = selectedCase.id || selectedCase.case_id;
        await loadCases();
        await loadCaseActions(id);
        await loadCaseTimeline(id);
      }
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleExecuteActionSubmit = async () => {
    if (!selectedCase || !selectedActionRecord) return;
    setIsSubmittingAction(true);
    try {
      const res = await api.executeRecoveryAction(
        selectedCase.id || selectedCase.case_id,
        selectedActionRecord.action_id || selectedActionRecord.id,
        actionNotes
      );
      if (res.success) {
        setActionMessage(res.message);
        setActionModalType(null);
        setSelectedActionRecord(null);
        setActionNotes('');
        const id = selectedCase.id || selectedCase.case_id;
        await loadCases();
        await loadCaseActions(id);
        await loadCaseTimeline(id);
      }
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSimulateAction = async (actionId: string) => {
    if (!selectedCase) return;
    setIsSubmittingAction(true);
    try {
      const res = await api.simulateRecoveryAction(selectedCase.id || selectedCase.case_id, actionId);
      if (res.success) {
        setActionMessage(res.message);
        const id = selectedCase.id || selectedCase.case_id;
        await loadCases();
        await loadCaseActions(id);
        await loadCaseTimeline(id);
      }
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCancelAction = async (actionId: string) => {
    if (!selectedCase) return;
    const reason = prompt('Please enter the reason for cancelling this recovery action:');
    if (!reason || reason.trim().length < 3) {
      alert('Cancellation reason of at least 3 characters is required.');
      return;
    }
    setIsSubmittingAction(true);
    try {
      const res = await api.cancelRecoveryAction(selectedCase.id || selectedCase.case_id, actionId, reason);
      if (res.success) {
        setActionMessage(res.message);
        const id = selectedCase.id || selectedCase.case_id;
        await loadCases();
        await loadCaseActions(id);
        await loadCaseTimeline(id);
      }
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDirectApproveCase = async () => {
    if (!selectedCase) return;
    setIsSubmittingAction(true);
    setActionMessage(null);
    try {
      const res = await api.approveCase(selectedCase.id || selectedCase.case_id, 'Approved by Operations Admin in Case Diagnostics');
      if (res.success) {
        setActionMessage(`✓ Case ${selectedCase.case_id} Approved! Recovery workflow dispatched.`);
        if (res.data) {
          setSelectedCase(res.data);
        } else {
          setSelectedCase({ ...selectedCase, status: 'APPROVED' as any, requires_human_approval: false });
        }
        await loadCases();
        const id = selectedCase.id || selectedCase.case_id;
        await loadCaseTimeline(id);
        await loadCaseActions(id);
      }
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDirectRejectCase = async () => {
    if (!selectedCase) return;
    setIsSubmittingAction(true);
    setActionMessage(null);
    try {
      const res = await api.rejectCase(selectedCase.id || selectedCase.case_id, 'Rejected by Operations Admin', 'Manual rejection from Control Center');
      if (res.success) {
        setActionMessage(`✕ Case ${selectedCase.case_id} Rejected. Recovery halted.`);
        if (res.data) {
          setSelectedCase(res.data);
        } else {
          setSelectedCase({ ...selectedCase, status: 'STOPPED' as any });
        }
        await loadCases();
        const id = selectedCase.id || selectedCase.case_id;
        await loadCaseTimeline(id);
        await loadCaseActions(id);
      }
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDirectStopCase = async () => {
    if (!selectedCase) return;
    setIsSubmittingAction(true);
    setActionMessage(null);
    try {
      const res = await api.stopCase(selectedCase.id || selectedCase.case_id, 'Manual stop triggered by Operations Admin', 'Stopped by Admin');
      if (res.success) {
        setActionMessage(`⏹ Case ${selectedCase.case_id} Stopped. Actions halted.`);
        if (res.data) {
          setSelectedCase(res.data);
        } else {
          setSelectedCase({ ...selectedCase, status: 'STOPPED' as any });
        }
        await loadCases();
        const id = selectedCase.id || selectedCase.case_id;
        await loadCaseTimeline(id);
        await loadCaseActions(id);
      }
    } catch (err: any) {
      alert(`Stop failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDirectSimulateRecovery = async () => {
    if (!selectedCase) return;
    setIsSubmittingAction(true);
    setActionMessage(null);
    try {
      const res = await api.simulateRecovery(selectedCase.id || selectedCase.case_id);
      if (res.success) {
        setActionMessage(`⚡ Recovery Simulation Dry-Run Completed for Case ${selectedCase.case_id} (Status: EXECUTING)`);
        if (res.data?.case) {
          setSelectedCase(res.data.case);
        } else {
          setSelectedCase({ ...selectedCase, status: 'EXECUTING' as any });
        }
        await loadCases();
        const id = selectedCase.id || selectedCase.case_id;
        await loadCaseTimeline(id);
        await loadCaseActions(id);
      }
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDirectMarkRecovered = async () => {
    if (!selectedCase) return;
    setIsSubmittingAction(true);
    setActionMessage(null);
    try {
      const res = await api.recoverCase(selectedCase.id || selectedCase.case_id);
      if (res.success) {
        setActionMessage(`🎉 Case ${selectedCase.case_id} Marked as RECOVERED! Revenue preserved.`);
        if (res.data) {
          setSelectedCase(res.data);
        } else {
          setSelectedCase({ ...selectedCase, status: 'RECOVERED' as any, requires_human_approval: false });
        }
        await loadCases();
        const id = selectedCase.id || selectedCase.case_id;
        await loadCaseTimeline(id);
        await loadCaseActions(id);
      }
    } catch (err: any) {
      alert(`Recover marking failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDirectReopenCase = async () => {
    if (!selectedCase) return;
    setIsSubmittingAction(true);
    setActionMessage(null);
    try {
      const res = await api.reopenCase(selectedCase.id || selectedCase.case_id);
      if (res.success) {
        setActionMessage(`🔄 Case ${selectedCase.case_id} Re-opened for Human Review (Status: PENDING_APPROVAL)`);
        if (res.data) {
          setSelectedCase(res.data);
        } else {
          setSelectedCase({ ...selectedCase, status: 'PENDING_APPROVAL' as any, requires_human_approval: true });
        }
        await loadCases();
        const id = selectedCase.id || selectedCase.case_id;
        await loadCaseTimeline(id);
        await loadCaseActions(id);
      }
    } catch (err: any) {
      alert(`Re-open failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleExecuteCaseAction = async () => {
    if (!selectedCase || !actionModalType) return;
    setIsSubmittingAction(true);
    setActionMessage(null);

    try {
      if (actionModalType === 'APPROVE') {
        const res = await api.approveCase(selectedCase.id || selectedCase.case_id, actionNotes || 'Approved by Admin');
        setActionMessage(res.message);
        if (res.data) setSelectedCase(res.data);
      } else if (actionModalType === 'REJECT') {
        if (!actionReason.trim()) {
          alert('Rejection reason is required');
          setIsSubmittingAction(false);
          return;
        }
        const res = await api.rejectCase(selectedCase.id || selectedCase.case_id, actionReason, actionNotes);
        setActionMessage(res.message);
        if (res.data) setSelectedCase(res.data);
      } else if (actionModalType === 'STOP') {
        if (!actionReason.trim()) {
          alert('Stop reason is required');
          setIsSubmittingAction(false);
          return;
        }
        const res = await api.stopCase(selectedCase.id || selectedCase.case_id, actionReason, actionNotes);
        setActionMessage(res.message);
        if (res.data) setSelectedCase(res.data);
      } else if (actionModalType === 'SIMULATE') {
        const res = await api.simulateRecovery(selectedCase.id || selectedCase.case_id);
        setActionMessage(res.message);
        if (res.data?.case) setSelectedCase(res.data.case);
      }

      setActionModalType(null);
      setActionReason('');
      setActionNotes('');
      await loadCases();
      if (selectedCase) {
        const id = selectedCase.id || selectedCase.case_id;
        await loadCaseTimeline(id);
        await loadCaseActions(id);
      }
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const columns: Column<RecoveryCase>[] = [
    {
      key: 'case_id',
      header: 'Case ID',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#0D94FB]">
          {item.case_id}
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
      key: 'issue_type',
      header: 'Issue Type',
      render: (item) => (
        <span className="rounded-[4px] bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs text-slate-700 font-medium">
          {item.issue_type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'amount_at_risk',
      header: 'Amount at Risk',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 font-mono">
            {formatCurrency(item.amount_at_risk)}
          </span>
          {Number(item.amount_at_risk) > 25000 && (
            <span className="ml-1.5 inline-block rounded-[4px] bg-rose-50 border border-rose-200 px-1.5 py-0.2 text-[9px] font-bold text-rose-700">
              Gated &gt;₹25k
            </span>
          )}
        </div>
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
      key: 'recovery_probability',
      header: 'Probability',
      render: (item) => (
        <span className="font-bold font-mono text-[#0D94FB]">{item.recovery_probability}%</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'action',
      header: 'Control',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCase(item);
          }}
          className="rounded-[4px] border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0D94FB] hover:bg-blue-100 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
        >
          Review & Execute
        </button>
      ),
    },
  ];

  const latestAction = caseActions[0] || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recovery Control Center"
        subtitle="Orchestrate safe recovery action workflows in TEST MODE, review Gemini diagnostics, and manage approval guardrails"
        badge={`${cases.length} Total Cases`}
      />

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="flex items-center justify-between rounded-[4px] border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 shadow-blade-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter & Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Case ID, customer, root cause..."
            className="w-full rounded-[4px] border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-slate-50 px-2.5 py-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-700 outline-none focus:text-[#0D94FB]"
            >
              <option value="newest">Newest Cases</option>
              <option value="amount_desc">Highest Amount at Risk</option>
              <option value="risk_desc">Highest Risk Score</option>
              <option value="oldest">Oldest Cases</option>
            </select>
          </div>

          {/* Issue Type Filter */}
          <select
            value={issueTypeFilter}
            onChange={(e) => setIssueTypeFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
          >
            <option value="">All Issue Types</option>
            <option value="PAYMENT_FAILURE">Payment Failure</option>
            <option value="CHECKOUT_ABANDONMENT">Checkout Abandonment</option>
            <option value="SUBSCRIPTION_FAILURE">Subscription Failure</option>
            <option value="OVERDUE_INVOICE">Overdue Invoice</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
          >
            <option value="">All Statuses</option>
            <option value="DETECTED">Detected</option>
            <option value="ANALYZING">Analyzing</option>
            <option value="RECOMMENDED">Recommended</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="EXECUTING">Executing</option>
            <option value="RECOVERED">Recovered</option>
            <option value="STOPPED">Stopped / Rejected</option>
            <option value="FAILED">Failed</option>
            <option value="ESCALATED">Escalated</option>
          </select>

          {(issueTypeFilter || riskFilter || statusFilter || search || sortBy !== 'newest') && (
            <button
              onClick={() => {
                setSearch('');
                setIssueTypeFilter('');
                setRiskFilter('');
                setStatusFilter('');
                setSortBy('newest');
              }}
              className="rounded-[4px] border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadCases} />}

      {/* Cases Table */}
      <DataTable
        columns={columns}
        data={cases}
        isLoading={isLoading}
        onRowClick={(item) => {
          setSelectedCase(item);
          navigate(`/admin/cases/${item.case_id}`);
        }}
      />

      {/* Case Details & Admin Control Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-md text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-lg font-bold text-[#0D94FB]">
                    {selectedCase.case_id}
                  </span>
                  <StatusBadge status={selectedCase.status} />
                  <RiskBadge level={selectedCase.risk_level} score={selectedCase.risk_score} />
                  {selectedCase.requires_human_approval && (
                    <span className="flex items-center gap-1 rounded-[4px] bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                      Human Approval Gated
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Customer: <strong className="text-[#0C2651]">{selectedCase.customer?.name || 'Customer'}</strong> • {selectedCase.customer?.company || selectedCase.customer?.email || 'Direct Merchant Account'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-[4px] p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {actionMessage && (
              <div className="mt-4 flex items-center justify-between gap-2 rounded-[4px] border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 shadow-blade-sm animate-fade-in-up">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{actionMessage}</span>
                </div>
                <button
                  onClick={() => setActionMessage(null)}
                  className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>
            )}

            <div className="mt-5 space-y-5">
              {/* Financial Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Amount at Risk</div>
                  <div className="mt-1 text-base font-bold text-slate-900 font-mono">
                    {formatCurrency(selectedCase.amount_at_risk)}
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Expected Recovery</div>
                  <div className="mt-1 text-base font-bold text-emerald-700 font-mono">
                    {formatCurrency(selectedCase.ai_expected_recovery || selectedCase.expected_recovery)}
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">AI Confidence</div>
                  <div className="mt-1 text-base font-bold text-slate-800 font-mono">
                    {selectedCase.ai_confidence || selectedCase.confidence}%
                  </div>
                  {Number(selectedCase.ai_confidence || selectedCase.confidence) < 60 && (
                    <span className="text-[9px] text-rose-600 font-bold block mt-0.5">Low (&lt;60%) • Review</span>
                  )}
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">AI Est. Probability</div>
                  <div className="mt-1 text-base font-bold text-[#0D94FB] font-mono">
                    {selectedCase.ai_recovery_probability || selectedCase.recovery_probability}%
                  </div>
                </div>
              </div>

              {/* Payment Telemetry Card */}
              {selectedCase.payment && (
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0C2651]">
                    <CreditCard className="h-3.5 w-3.5 text-[#0D94FB]" />
                    <span>Payment Gateway Telemetry</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Transaction ID:</span>
                      <p className="font-mono text-slate-800 font-bold mt-0.5">{selectedCase.payment.transaction_id || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Payment Instrument:</span>
                      <p className="text-slate-800 mt-0.5">{selectedCase.payment.payment_method || 'Razorpay Gateway'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Decline Code:</span>
                      <p className="font-mono text-rose-700 font-bold mt-0.5">{selectedCase.payment.error_code || 'BAD_REQUEST_ERROR'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Gemini AI Diagnosis Intelligence Card (Phase 4) */}
              <div className="rounded-[4px] border border-blue-200 bg-blue-50/50 p-4">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#0D94FB]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0C2651]">
                      Gemini AI Diagnosis & Recovery Intelligence
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-[4px] bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0D94FB] uppercase">
                      {selectedCase.diagnosis_source === 'GEMINI_AI' ? (
                        <>⚡ {selectedCase.ai_model || 'Gemini 2.5 Flash'}</>
                      ) : (
                        <>🛡️ Rule-Based Fallback</>
                      )}
                    </span>
                    <button
                      onClick={handleRunAiDiagnosis}
                      disabled={isRunningAiDiagnosis}
                      className="flex items-center gap-1 rounded-[4px] border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0D94FB] hover:bg-blue-50 disabled:opacity-50 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRunningAiDiagnosis ? 'animate-spin' : ''}`} />
                      <span>{isRunningAiDiagnosis ? 'Analyzing...' : 'Run Gemini AI'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600">AI Root Cause Diagnosis</span>
                      {selectedCase.ai_category && (
                        <span className="rounded-[4px] bg-white border border-blue-200 px-2 py-0.5 text-[10px] font-mono text-[#0D94FB]">
                          Category: {selectedCase.ai_category}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-800 leading-relaxed font-medium">
                      {selectedCase.ai_root_cause || selectedCase.root_cause || 'Transaction failure telemetry ingested from gateway.'}
                    </p>
                  </div>

                  {selectedCase.ai_reasoning_summary && (
                    <div className="rounded-[4px] border border-slate-200 bg-white p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <Cpu className="h-3 w-3 text-[#0D94FB]" />
                        AI Reasoning Summary
                      </span>
                      <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                        {selectedCase.ai_reasoning_summary}
                      </p>
                    </div>
                  )}

                  <div className="rounded-[4px] border border-amber-200 bg-amber-50/70 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                        <Bot className="h-3.5 w-3.5 text-amber-700" />
                        Recommended Recovery Strategy (Advisory Only)
                      </span>
                      {selectedCase.ai_recommended_action_type && (
                        <span className="text-[9px] font-bold text-amber-800 uppercase">
                          {selectedCase.ai_recommended_action_type}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-amber-950 font-medium leading-relaxed">
                      {selectedCase.ai_recommended_action || selectedCase.recommended_action || 'Autonomous Smart Retry Routing'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Safe Recovery Action Orchestration Engine (Phase 5) */}
              <div className="rounded-[4px] border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Recovery Action Orchestration Engine
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-[4px] bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800">
                      TEST MODE (SAFE)
                    </span>
                    <button
                      onClick={() => setActionModalType('PLAN_ACTION')}
                      disabled={selectedCase.status === 'STOPPED' || selectedCase.status === 'RECOVERED'}
                      className="flex items-center gap-1 rounded-[4px] border border-emerald-300 bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-40 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <PlusCircle className="h-3 w-3" />
                      <span>Plan New Action</span>
                    </button>
                  </div>
                </div>

                {isLoadingActions ? (
                  <div className="py-4 text-center text-xs text-slate-500">Loading action history...</div>
                ) : caseActions.length === 0 ? (
                  <div className="mt-3 rounded-[4px] border border-slate-200 bg-white p-3.5 text-xs text-slate-600 flex items-center justify-between">
                    <span>No recovery action currently planned for this case.</span>
                    <button
                      onClick={() => setActionModalType('PLAN_ACTION')}
                      disabled={selectedCase.status === 'STOPPED' || selectedCase.status === 'RECOVERED'}
                      className="text-[#0D94FB] font-semibold hover:underline"
                    >
                      + Plan Recommended Action
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {caseActions.slice(0, 2).map((action) => (
                      <div key={action.id || action.action_id} className="rounded-[4px] border border-slate-200 bg-white p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#0C2651]">{action.action_id}</span>
                            <span className="rounded-[4px] bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700">
                              {action.action_type}
                            </span>
                            <span className={`rounded-[4px] px-2 py-0.5 text-[10px] font-bold ${
                              action.status === 'SUCCEEDED' || action.status === 'EXECUTED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              action.status === 'APPROVED' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              action.status === 'EXECUTING' ? 'bg-amber-50 text-amber-900 border border-amber-200 animate-pulse' :
                              action.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                              'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}>
                              {action.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Attempt {action.attempt_number || 1} of {action.max_attempts || 3}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-700">{action.reason || 'Automated multi-channel retry orchestration rule triggered by AI policy'}</p>

                        {action.provider_reference && (
                          <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
                            Gateway Reference: <span className="text-emerald-700 font-bold">{action.provider_reference}</span>
                          </div>
                        )}

                        {/* Action Control Buttons */}
                        <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-100 items-center justify-between">
                          {(action.status === 'PLANNED' || action.status === 'PENDING_APPROVAL') && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveAction(action.action_id || action.id)}
                                disabled={isSubmittingAction}
                                className="flex items-center gap-1 rounded-[4px] bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                              >
                                <Check className="h-3 w-3" />
                                Approve Action
                              </button>
                              <button
                                onClick={() => handleCancelAction(action.action_id || action.id)}
                                disabled={isSubmittingAction}
                                className="rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {action.status === 'APPROVED' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedActionRecord(action);
                                  setActionModalType('EXECUTE_ACTION');
                                }}
                                disabled={isSubmittingAction}
                                className="flex items-center gap-1 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-3 py-1 text-[11px] font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                              >
                                <Play className="h-3 w-3 fill-current" />
                                Execute Recovery (TEST MODE)
                              </button>
                              <button
                                onClick={() => handleSimulateAction(action.action_id || action.id)}
                                disabled={isSubmittingAction}
                                className="rounded-[4px] border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                              >
                                Simulate
                              </button>
                            </div>
                          )}

                          {action.status === 'EXECUTING' && (
                            <span className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                              <Activity className="h-3.5 w-3.5 animate-spin text-amber-600" />
                              Execution in progress in simulated sandbox...
                            </span>
                          )}

                          {(action.status === 'SUCCEEDED' || action.status === 'EXECUTED') && (
                            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                              <span className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Action Successfully Executed (TEST MODE)
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedActionRecord(action);
                                  setActionModalType('EXECUTE_ACTION');
                                }}
                                disabled={isSubmittingAction}
                                className="flex items-center gap-1 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                              >
                                <Play className="h-3 w-3 fill-current" />
                                Re-Execute / Dispatch Attempt
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Case Controls */}
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#0D94FB]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0C2651]">
                      Case Lifecycle Controls
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      Status: <strong className="text-[#0C2651] font-mono">{selectedCase.status}</strong>
                    </span>
                    <StatusBadge status={selectedCase.status} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  {/* Approve Case */}
                  {selectedCase.status !== 'APPROVED' && selectedCase.status !== 'RECOVERED' && selectedCase.status !== 'STOPPED' && (
                    <button
                      onClick={handleDirectApproveCase}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isSubmittingAction ? 'Processing...' : 'Approve Case'}</span>
                    </button>
                  )}

                  {/* Simulate Recovery Workflow */}
                  {(selectedCase.status === 'APPROVED' || selectedCase.status === 'PENDING_APPROVAL' || selectedCase.status === 'RECOMMENDED' || selectedCase.status === 'EXECUTING') && (
                    <button
                      onClick={handleDirectSimulateRecovery}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isSubmittingAction ? 'Simulating...' : 'Simulate Recovery Workflow'}</span>
                    </button>
                  )}

                  {/* Mark as Recovered */}
                  {selectedCase.status !== 'RECOVERED' && selectedCase.status !== 'STOPPED' && (
                    <button
                      onClick={handleDirectMarkRecovered}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 rounded-[4px] border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{isSubmittingAction ? 'Updating...' : 'Mark as Recovered'}</span>
                    </button>
                  )}

                  {/* Reject Case */}
                  {selectedCase.status !== 'STOPPED' && selectedCase.status !== 'RECOVERED' && (
                    <button
                      onClick={handleDirectRejectCase}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 rounded-[4px] bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>{isSubmittingAction ? 'Rejecting...' : 'Reject Case'}</span>
                    </button>
                  )}

                  {/* Stop Case */}
                  {selectedCase.status !== 'STOPPED' && selectedCase.status !== 'RECOVERED' && (
                    <button
                      onClick={handleDirectStopCase}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      <StopCircle className="h-3.5 w-3.5 text-amber-600" />
                      <span>{isSubmittingAction ? 'Stopping...' : 'Stop Case'}</span>
                    </button>
                  )}

                  {/* Re-Open Case / Reset to Pending */}
                  {(selectedCase.status === 'STOPPED' || selectedCase.status === 'RECOVERED' || selectedCase.status === 'FAILED') && (
                    <button
                      onClick={handleDirectReopenCase}
                      disabled={isSubmittingAction}
                      className="flex items-center gap-1.5 rounded-[4px] bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{isSubmittingAction ? 'Re-opening...' : 'Re-Open / Reset Case'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chronological Audit Timeline */}
              <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0C2651]">
                    <History className="h-3.5 w-3.5 text-[#0D94FB]" />
                    <span>Chronological Audit Timeline</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {timeline.length} Milestone Events
                  </span>
                </div>

                {isLoadingTimeline ? (
                  <div className="py-6 text-center text-xs text-slate-500">Loading audit history...</div>
                ) : timeline.length === 0 ? (
                  <div className="py-4 text-xs text-slate-500 italic">No historical audit logs recorded for this case yet.</div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {timeline.map((event, idx) => (
                      <div key={event.id || idx} className="relative flex items-start gap-3 pl-1">
                        <div className="mt-0.5 rounded-[4px] bg-blue-50 border border-blue-200 p-1 text-[#0D94FB]">
                          <Clock className="h-3 w-3" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0C2651]">{event.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(event.timestamp)}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">{event.description}</p>
                          <div className="mt-1 text-[10px] text-slate-500">
                            Actor: <span className="font-mono text-slate-700">{event.actor}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="rounded-[4px] border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Recovery Action Dialog */}
      {actionModalType === 'PLAN_ACTION' && selectedCase && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-md text-left animate-fadeIn">
            <h3 className="text-base font-bold text-[#0C2651] flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-600" />
              <span>Plan Recovery Action (TEST MODE)</span>
            </h3>

            <p className="mt-1.5 text-xs text-slate-500">
              Case <strong className="text-[#0D94FB] font-mono">{selectedCase.case_id}</strong> ({formatCurrency(selectedCase.amount_at_risk)})
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Action Type</label>
                <select
                  value={planActionType}
                  onChange={(e: any) => setPlanActionType(e.target.value)}
                  className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                >
                  <option value="RETRY_PAYMENT">RETRY PAYMENT (Gateway Retry Routing)</option>
                  <option value="ALTERNATIVE_PAYMENT_METHOD">ALTERNATIVE PAYMENT METHOD (Payment Link)</option>
                  <option value="MANUAL_REVIEW">MANUAL REVIEW (Operations Intervention)</option>
                  <option value="NO_ACTION">NO ACTION (Monitor Only)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Strategy Justification</label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Reason for this recovery action plan..."
                  className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Internal Audit Notes</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Optional internal notes for compliance trail..."
                  rows={2}
                  className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handlePlanActionSubmit}
                className="rounded-[4px] bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmittingAction ? 'Planning...' : 'Plan Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execute Recovery Action Confirmation Dialog */}
      {actionModalType === 'EXECUTE_ACTION' && selectedCase && selectedActionRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-md text-left animate-fadeIn">
            <h3 className="text-base font-bold text-[#0C2651] flex items-center gap-2">
              <Play className="h-5 w-5 text-[#0D94FB] fill-current" />
              <span>Confirm Recovery Action Execution</span>
            </h3>

            <div className="mt-3 rounded-[4px] border border-blue-200 bg-blue-50/70 p-3 text-xs text-[#0C2651]">
              <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-[#0D94FB]">
                <Info className="h-3.5 w-3.5" />
                <span>TEST MODE Execution Only</span>
              </div>
              <p className="mt-1 leading-relaxed">
                You are about to execute action <strong className="font-mono text-slate-900">{selectedActionRecord.action_id}</strong> ({selectedActionRecord.action_type}) in Razorpay <strong>TEST MODE</strong>. Zero real customer money will be charged.
              </p>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Case ID:</span>
                <span className="font-mono font-bold text-[#0D94FB]">{selectedCase.case_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount at Risk:</span>
                <span className="font-bold text-slate-900 font-mono">{formatCurrency(selectedCase.amount_at_risk)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attempt Number:</span>
                <span className="font-semibold text-slate-800">{selectedActionRecord.attempt_number} of {selectedActionRecord.max_attempts}</span>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-slate-700">Execution Notes (Optional)</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Optional operator notes..."
                rows={2}
                className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setActionModalType(null);
                  setSelectedActionRecord(null);
                }}
                className="rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleExecuteActionSubmit}
                className="rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmittingAction ? 'Executing...' : 'Confirm TEST Execution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Action Confirmation & Reason Dialog Modal */}
      {actionModalType && actionModalType !== 'PLAN_ACTION' && actionModalType !== 'EXECUTE_ACTION' && selectedCase && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-md text-left animate-fadeIn">
            <h3 className="text-base font-bold text-[#0C2651] flex items-center gap-2">
              {actionModalType === 'APPROVE' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {actionModalType === 'REJECT' && <XCircle className="h-5 w-5 text-rose-600" />}
              {actionModalType === 'STOP' && <StopCircle className="h-5 w-5 text-amber-600" />}
              {actionModalType === 'SIMULATE' && <Play className="h-5 w-5 text-[#0D94FB]" />}
              <span>
                {actionModalType === 'APPROVE' && 'Approve Recovery Case'}
                {actionModalType === 'REJECT' && 'Reject Recovery Proposal'}
                {actionModalType === 'STOP' && 'Stop Recovery Case'}
                {actionModalType === 'SIMULATE' && 'Simulate Recovery Workflow'}
              </span>
            </h3>

            <p className="mt-1.5 text-xs text-slate-500">
              Case <strong className="text-[#0D94FB] font-mono">{selectedCase.case_id}</strong> ({formatCurrency(selectedCase.amount_at_risk)})
            </p>

            {(actionModalType === 'REJECT' || actionModalType === 'STOP') && (
              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-700">
                  Reason <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={`Reason for ${actionModalType.toLowerCase()}ing this case...`}
                  className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                />
              </div>
            )}

            <div className="mt-3">
              <label className="text-xs font-semibold text-slate-700">Additional Notes (Optional)</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Optional internal notes for the audit trail..."
                rows={2}
                className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => {
                  setActionModalType(null);
                  setActionReason('');
                  setActionNotes('');
                }}
                className="rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleExecuteCaseAction}
                className={`rounded-[4px] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] ${
                  actionModalType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : actionModalType === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : actionModalType === 'STOP'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-[#0D94FB] hover:bg-[#0B82DE]'
                }`}
              >
                {isSubmittingAction ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
