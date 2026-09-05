import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { PaymentRecord } from '../../types/database.types';
import {
  Search,
  Download,
  ArrowUpDown,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  X,
  Copy,
  Check,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const navigate = useNavigate();

  const loadPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getPayments({
        search: search || undefined,
        status: statusFilter || undefined,
        paymentMethod: methodFilter || undefined,
        currency: currencyFilter || undefined,
        sortBy: sortBy || undefined,
      });

      if (res.success) {
        setPayments(res.data);
      } else {
        setError('Failed to load payments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter, methodFilter, currencyFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayments();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Aggregated KPIs
  const totalVolume = useMemo(
    () => payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments]
  );
  const failedCount = useMemo(
    () => payments.filter((p) => p.status === 'FAILED').length,
    [payments]
  );
  const recoveredVolume = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'RECOVERED')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments]
  );
  const settledCount = useMemo(
    () => payments.filter((p) => p.status === 'SUCCESS' || p.status === 'RECOVERED').length,
    [payments]
  );

  const columns: Column<PaymentRecord>[] = [
    {
      key: 'transaction_id',
      header: 'Transaction ID',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#0D94FB] group-hover:underline">
          {item.transaction_id}
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
      key: 'amount',
      header: 'Amount',
      render: (item) => (
        <span className="font-bold text-slate-900 font-mono">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'payment_method',
      header: 'Payment Method',
      render: (item) => (
        <span className="text-xs text-slate-700 font-medium">{item.payment_method || 'Razorpay Gateway'}</span>
      ),
    },
    {
      key: 'error_code',
      header: 'Decline / Telemetry Code',
      render: (item) => (
        <div>
          {item.error_code ? (
            <div className="text-xs text-rose-700">
              <span className="font-mono font-bold bg-rose-50 border border-rose-200 rounded-[4px] px-1.5 py-0.5">
                {item.error_code}
              </span>
              <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">{item.error_description}</p>
            </div>
          ) : (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Settled Successfully
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'attempts_count',
      header: 'Retries',
      render: (item) => (
        <span className="rounded-[4px] bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
          {item.attempts_count}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (item) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatDateTime(item.created_at)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Inspect',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPayment(item);
          }}
          className="rounded-[4px] border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0D94FB] hover:bg-blue-100 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Telemetry
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Payment Telemetry & Decline Logs"
        subtitle="Live Razorpay gateway transaction stream, decline classification, and autonomous rescue routing"
        badge={`${payments.length} Transactions`}
      />

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Transactions"
          value={payments.length}
          subtitle={`Volume: ${formatCurrency(totalVolume)}`}
          icon={CreditCard}
        />
        <MetricCard
          title="Declined Payments"
          value={failedCount}
          subtitle="Intercepted by engine"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Recovered Volume"
          value={formatCurrency(recoveredVolume)}
          subtitle="Autonomous rescue yield"
          icon={TrendingUp}
          highlight
        />
        <MetricCard
          title="Settled Payments"
          value={settledCount}
          subtitle="Confirmed captures"
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
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transaction ID, customer, error code..."
            className="w-full rounded-[4px] border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-slate-50 px-2.5 py-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-700 outline-none focus:text-[#0D94FB]"
            >
              <option value="newest">Newest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
          >
            <option value="">All Statuses</option>
            <option value="FAILED">Failed</option>
            <option value="SUCCESS">Success</option>
            <option value="RECOVERED">Recovered</option>
            <option value="PENDING">Pending</option>
          </select>

          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
          >
            <option value="">All Currencies</option>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>

          <button
            onClick={() => api.exportCsv('payments')}
            className="flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadPayments} />}

      <DataTable
        columns={columns}
        data={payments}
        isLoading={isLoading}
        onRowClick={(item) => setSelectedPayment(item)}
      />

      {/* Payment Telemetry Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-md text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-lg font-bold text-[#0D94FB]">
                    {selectedPayment.transaction_id}
                  </span>
                  <StatusBadge status={selectedPayment.status} size="sm" />
                </div>
                <p className="mt-1 text-xs text-slate-500 font-mono">
                  Gateway: {selectedPayment.gateway || 'Razorpay'} • {formatDateTime(selectedPayment.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-[4px] p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Financial & Telemetry Highlight */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Transaction Value</div>
                  <div className="mt-1 text-base font-bold text-slate-900 font-mono">
                    {formatCurrency(selectedPayment.amount)}
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Currency</div>
                  <div className="mt-1 text-base font-bold text-slate-800 font-mono">
                    {selectedPayment.currency || 'INR'}
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Retry Attempts</div>
                  <div className="mt-1 text-base font-bold text-[#0D94FB] font-mono">
                    {selectedPayment.attempts_count} of 3
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Gateway Status</div>
                  <div className="mt-1 text-base font-bold text-emerald-700 font-mono">
                    {selectedPayment.status}
                  </div>
                </div>
              </div>

              {/* Decline Diagnostics Card */}
              {selectedPayment.error_code && (
                <div className="rounded-[4px] border border-rose-200 bg-rose-50/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    <span>Razorpay Decline Diagnostics</span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Decline Error Code:</span>
                      <span className="font-mono font-bold text-rose-800 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-[4px]">
                        {selectedPayment.error_code}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Diagnostic Explanation:</span>
                      <p className="mt-1 text-slate-800 font-medium leading-relaxed bg-white border border-rose-200 p-2.5 rounded-[4px]">
                        {selectedPayment.error_description || 'Payment was declined by the cardholder issuing bank or gateway network.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer & Method Information */}
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0C2651] mb-3">
                  Payer & Instrument Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Customer Name:</span>
                    <p className="font-bold text-[#0C2651] mt-0.5">{selectedPayment.customer?.name || 'Customer'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Company / Email:</span>
                    <p className="font-mono text-slate-700 mt-0.5">{selectedPayment.customer?.company || selectedPayment.customer?.email || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Payment Instrument:</span>
                    <p className="font-mono text-slate-800 font-bold mt-0.5">{selectedPayment.payment_method || 'Razorpay Gateway'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Last Attempted:</span>
                    <p className="text-slate-700 mt-0.5 font-mono">
                      {selectedPayment.last_attempted_at ? formatDateTime(selectedPayment.last_attempted_at) : formatDateTime(selectedPayment.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="rounded-[4px] border border-blue-200 bg-blue-50/50 p-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => handleCopy(selectedPayment.transaction_id)}
                  className="flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
                >
                  {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                  <span>{copiedId ? 'Copied ID!' : 'Copy Transaction ID'}</span>
                </button>

                <button
                  onClick={() => {
                    navigate(`/admin/cases?search=${encodeURIComponent(selectedPayment.transaction_id)}`);
                  }}
                  className="flex items-center gap-1.5 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Inspect Recovery Case</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-[4px] border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
