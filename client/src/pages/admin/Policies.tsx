import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { RecoveryPolicy, IssueType } from '../../types/database.types';
import {
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const Policies: React.FC = () => {
  const [policies, setPolicies] = useState<RecoveryPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState<IssueType>('PAYMENT_FAILURE');
  const [maxDiscountPct, setMaxDiscountPct] = useState(10);
  const [minAmount, setMinAmount] = useState(1000);
  const [maxAmount, setMaxAmount] = useState(100000);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [autoExecute, setAutoExecute] = useState(true);

  const loadPolicies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getPolicies();
      if (res.success) {
        setPolicies(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load recovery policies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createPolicy({
        name,
        description,
        issue_type: issueType,
        max_discount_pct: maxDiscountPct,
        min_amount: minAmount,
        max_amount: maxAmount,
        requires_human_approval: requiresApproval,
        auto_execute: autoExecute,
        is_active: true,
      });

      if (res.success) {
        setShowModal(false);
        resetForm();
        await loadPolicies();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create recovery policy');
    }
  };

  const handleTogglePolicy = async (policy: RecoveryPolicy) => {
    try {
      const res = await api.togglePolicy(policy.id, !policy.is_active);
      if (res.success) {
        setPolicies((prev) =>
          prev.map((p) => (p.id === policy.id ? { ...p, is_active: !p.is_active } : p))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle policy status');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIssueType('PAYMENT_FAILURE');
    setMaxDiscountPct(10);
    setMinAmount(1000);
    setMaxAmount(100000);
    setRequiresApproval(false);
    setAutoExecute(true);
  };

  const columns: Column<RecoveryPolicy>[] = [
    {
      key: 'name',
      header: 'Policy Rule Name',
      render: (item) => (
        <div>
          <div className="font-bold text-[#0C2651]">{item.name}</div>
          <div className="text-[11px] text-slate-500">{item.description}</div>
        </div>
      ),
    },
    {
      key: 'issue_type',
      header: 'Trigger Condition',
      render: (item) => (
        <span className="rounded-[4px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 font-semibold">
          {item.issue_type}
        </span>
      ),
    },
    {
      key: 'limits',
      header: 'Threshold Boundaries',
      render: (item) => (
        <div className="text-xs text-slate-600">
          <div>Amount: <span className="font-mono font-bold text-slate-800">{formatCurrency(item.min_amount || 0)} – {formatCurrency(item.max_amount || 0)}</span></div>
          <div>Max Incentive: <span className="font-mono font-bold text-[#0D94FB]">{item.max_discount_pct || 0}%</span></div>
        </div>
      ),
    },
    {
      key: 'guardrails',
      header: 'Human Sign-off',
      render: (item) => (
        <div className="text-xs">
          {item.requires_human_approval ? (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>Sign-off Required</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Autonomous Exec</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Policy Status',
      render: (item) => (
        <button
          onClick={() => handleTogglePolicy(item)}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          {item.is_active ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <ToggleRight className="h-5 w-5 text-emerald-600" />
              <span>Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <ToggleLeft className="h-5 w-5 text-slate-400" />
              <span>Disabled</span>
            </span>
          )}
        </button>
      ),
    },
    {
      key: 'created_at',
      header: 'Established',
      render: (item) => <span className="text-xs text-slate-500 font-mono">{formatDateTime(item.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Autonomous Recovery Policies & Guardrails"
        subtitle="Configure autonomous decision thresholds, coupon limits, and human approval gates"
        badge={`${policies.length} Policies`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Recovery Rule</span>
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={loadPolicies} />}

      <DataTable columns={columns} data={policies} isLoading={isLoading} />

      {/* Modal for Creating Policy */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-md text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <h3 className="text-sm font-bold text-[#0C2651] font-heading">Create Recovery Policy</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-[4px] p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Policy Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VIP Subscription Dunning Threshold"
                  className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the policy rule trigger and objective"
                  className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Issue Type</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as IssueType)}
                    className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                  >
                    <option value="PAYMENT_FAILURE">Payment Failure</option>
                    <option value="CHECKOUT_ABANDONMENT">Checkout Abandonment</option>
                    <option value="SUBSCRIPTION_FAILURE">Subscription Failure</option>
                    <option value="OVERDUE_INVOICE">Overdue Invoice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Max Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={maxDiscountPct}
                    onChange={(e) => setMaxDiscountPct(Number(e.target.value))}
                    className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Min Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Max Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="rounded-[4px] border-slate-300 text-[#0D94FB] focus:ring-[#0D94FB]"
                  />
                  <span>Require Manual Human-in-the-Loop Approval</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={autoExecute}
                    onChange={(e) => setAutoExecute(e.target.checked)}
                    className="rounded-[4px] border-slate-300 text-[#0D94FB] focus:ring-[#0D94FB]"
                  />
                  <span>Permit Autonomous Policy Execution in Test Sandbox</span>
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
