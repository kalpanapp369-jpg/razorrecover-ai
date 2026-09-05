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
import { InvoiceRecord } from '../../types/database.types';
import {
  Search,
  Download,
  ArrowUpDown,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  X,
  ExternalLink,
  Copy,
  Check,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSimulatingSettlement, setIsSimulatingSettlement] = useState(false);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('amount_desc');

  const navigate = useNavigate();

  const loadInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getInvoices();
      if (res.success) {
        setInvoices(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !search ||
          inv.invoice_number.toLowerCase().includes(query) ||
          (inv.customer?.name && inv.customer.name.toLowerCase().includes(query)) ||
          (inv.customer?.company && inv.customer.company.toLowerCase().includes(query));

        const matchesStatus = !statusFilter || inv.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'amount_desc') return (b.amount || 0) - (a.amount || 0);
        if (sortBy === 'overdue_desc') return (b.days_overdue || 0) - (a.days_overdue || 0);
        if (sortBy === 'due_date') return new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime();
        return 0;
      });
  }, [invoices, search, statusFilter, sortBy]);

  // Aggregated KPIs
  const totalBalance = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    [invoices]
  );
  const overdueCount = useMemo(
    () => invoices.filter((inv) => inv.days_overdue > 0 || inv.status === 'OVERDUE').length,
    [invoices]
  );
  const overdueAmount = useMemo(
    () =>
      invoices
        .filter((inv) => inv.days_overdue > 0 || inv.status === 'OVERDUE')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0),
    [invoices]
  );
  const paidCount = useMemo(
    () => invoices.filter((inv) => inv.status === 'PAID').length,
    [invoices]
  );

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSimulateSettlement = async (inv: InvoiceRecord) => {
    setIsSimulatingSettlement(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setActionMessage(`🎉 Payment settlement webhook simulated for Invoice ${inv.invoice_number}! Revenue marked recovered.`);
      setSelectedInvoice({
        ...inv,
        status: 'PAID',
        days_overdue: 0,
      });
      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: 'PAID', days_overdue: 0 } : i))
      );
    } catch (err: any) {
      alert(`Settlement simulation failed: ${err.message}`);
    } finally {
      setIsSimulatingSettlement(false);
    }
  };

  const columns: Column<InvoiceRecord>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#0D94FB] group-hover:underline">
          {item.invoice_number}
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
      header: 'Total Balance',
      render: (item) => (
        <span className="font-bold text-slate-900 font-mono">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (item) => <span className="text-xs text-slate-600 font-mono">{formatDate(item.due_date)}</span>,
    },
    {
      key: 'days_overdue',
      header: 'Aging',
      render: (item) => (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-[4px] border ${
            item.days_overdue > 0
              ? 'bg-rose-50 text-rose-800 border-rose-200 font-mono'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {item.days_overdue > 0 ? `${item.days_overdue} days overdue` : 'On Schedule'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Settlement Link',
      render: (item) => (
        <a
          href={item.payment_link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!item.payment_link) e.preventDefault();
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0D94FB] hover:underline"
        >
          <span>Razorpay Pay</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      key: 'action_btn',
      header: 'Inspect',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInvoice(item);
          }}
          className="rounded-[4px] border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0D94FB] hover:bg-blue-100 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Details
        </button>
      ),
    },
  ];

  if (isLoading && invoices.length === 0) {
    return <LoadingState message="Loading merchant invoices and aging schedules..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadInvoices} />;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Invoice Recovery & Aging Operations"
        subtitle="Automated payment reminders, late payment interest calculation, and smart Razorpay payment links"
        badge={`${invoices.length} Invoices`}
      />

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Invoiced Value"
          value={formatCurrency(totalBalance)}
          subtitle={`${invoices.length} Invoices`}
          icon={Receipt}
        />
        <MetricCard
          title="Overdue Invoices"
          value={overdueCount}
          subtitle="Targeted for dunning"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Overdue Balance"
          value={formatCurrency(overdueAmount)}
          subtitle="Active collection pipeline"
          icon={TrendingUp}
          highlight
        />
        <MetricCard
          title="Paid on Schedule"
          value={paidCount}
          subtitle="Confirmed settlements"
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
            placeholder="Search invoice #, customer..."
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
              <option value="amount_desc">Highest Balance</option>
              <option value="overdue_desc">Highest Days Overdue</option>
              <option value="due_date">Earliest Due Date</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
          >
            <option value="">All Statuses</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
            <option value="ISSUED">Issued</option>
          </select>

          <button
            onClick={() => api.exportCsv('cases')}
            className="flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Invoices</span>
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredInvoices}
        isLoading={isLoading}
        onRowClick={(item) => setSelectedInvoice(item)}
      />

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-md text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-lg font-bold text-[#0D94FB]">
                    {selectedInvoice.invoice_number}
                  </span>
                  <StatusBadge status={selectedInvoice.status} size="sm" />
                  {selectedInvoice.days_overdue > 0 && (
                    <span className="font-mono text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-[4px]">
                      {selectedInvoice.days_overdue} Days Overdue
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Customer: <strong className="text-[#0C2651]">{selectedInvoice.customer?.name}</strong> ({selectedInvoice.customer?.company || selectedInvoice.customer?.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-[4px] p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {/* Financial Breakdown */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Invoice Balance</div>
                  <div className="mt-1 text-base font-bold text-slate-900 font-mono">
                    {formatCurrency(selectedInvoice.amount)}
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Due Date</div>
                  <div className="mt-1 text-xs font-bold text-slate-800 font-mono">{formatDate(selectedInvoice.due_date)}</div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Aging Status</div>
                  <div className={`mt-1 text-xs font-bold ${selectedInvoice.days_overdue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {selectedInvoice.days_overdue > 0 ? `${selectedInvoice.days_overdue} Days Overdue` : 'Current'}
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Settlement State</div>
                  <div className="mt-1 text-xs font-bold text-[#0D94FB] font-mono">{selectedInvoice.status}</div>
                </div>
              </div>

              {/* Payment Link Card */}
              {selectedInvoice.payment_link && (
                <div className="rounded-[4px] border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Razorpay Smart Payment Link
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-[4px]">
                      TEST MODE
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-mono text-slate-700 truncate bg-white p-2 border border-emerald-200 rounded-[4px]">
                    {selectedInvoice.payment_link}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={selectedInvoice.payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                    >
                      <span>Open Payment Checkout</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => handleCopyLink(selectedInvoice.payment_link || '')}
                      className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                      <span>{copiedLink ? 'Copied Link!' : 'Copy Payment Link'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="rounded-[4px] border border-blue-200 bg-blue-50/50 p-4 flex flex-wrap items-center justify-between gap-3">
                {selectedInvoice.status !== 'PAID' ? (
                  <button
                    onClick={() => handleSimulateSettlement(selectedInvoice)}
                    disabled={isSimulatingSettlement}
                    className="flex items-center gap-1.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>{isSimulatingSettlement ? 'Simulating Settlement...' : 'Simulate Settlement Webhook'}</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Invoice Full Balance Settled
                  </span>
                )}

                <button
                  onClick={() => {
                    navigate(`/admin/cases?search=${encodeURIComponent(selectedInvoice.invoice_number)}`);
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
                onClick={() => setSelectedInvoice(null)}
                className="rounded-[4px] border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
