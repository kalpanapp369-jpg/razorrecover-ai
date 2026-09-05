import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { RiskBadge } from '../../components/common/RiskBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { Customer } from '../../types/database.types';
import {
  Mail,
  Phone,
  Building,
  Search,
  ArrowUpDown,
  Download,
  Users,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  X,
  CreditCard,
  Layers,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('risk_desc');

  const navigate = useNavigate();

  const loadCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getCustomers();
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !search ||
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          (c.company && c.company.toLowerCase().includes(query)) ||
          (c.external_customer_id && c.external_customer_id.toLowerCase().includes(query));

        const matchesRisk = !riskFilter || c.risk_level === riskFilter;
        const matchesStatus = !statusFilter || c.status === statusFilter;

        return matchesSearch && matchesRisk && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'risk_desc') return (b.risk_score || 0) - (a.risk_score || 0);
        if (sortBy === 'risk_amount_desc') return (b.total_risk_amount || 0) - (a.total_risk_amount || 0);
        if (sortBy === 'ltv_desc') return (b.lifetime_value || 0) - (a.lifetime_value || 0);
        if (sortBy === 'recovered_desc') return (b.recovered_amount || 0) - (a.recovered_amount || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [customers, search, riskFilter, statusFilter, sortBy]);

  // Aggregate Metrics
  const totalExposure = useMemo(
    () => customers.reduce((sum, c) => sum + (c.total_risk_amount || 0), 0),
    [customers]
  );
  const totalRecovered = useMemo(
    () => customers.reduce((sum, c) => sum + (c.recovered_amount || 0), 0),
    [customers]
  );
  const highRiskCount = useMemo(
    () => customers.filter((c) => c.risk_level === 'HIGH' || c.risk_level === 'CRITICAL').length,
    [customers]
  );
  const avgLtv = useMemo(
    () =>
      customers.length > 0
        ? Math.round(customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0) / customers.length)
        : 0,
    [customers]
  );

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer & Account',
      render: (item) => (
        <div>
          <div className="font-bold text-[#0C2651] group-hover:text-[#0D94FB] transition-colors">{item.name}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
            <Building className="h-3 w-3 text-slate-400" />
            <span>{item.company || 'Direct Account'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] text-slate-400">{item.external_customer_id || 'ID-AUTO'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (item) => (
        <div className="text-xs text-slate-700 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-slate-400" />
            <span>{item.email}</span>
          </div>
          {item.phone && (
            <div className="flex items-center gap-1.5 text-slate-500 font-mono">
              <Phone className="h-3 w-3 text-slate-400" />
              <span>{item.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'risk_level',
      header: 'Risk Health',
      render: (item) => <RiskBadge level={item.risk_level} score={item.risk_score} />,
    },
    {
      key: 'total_risk_amount',
      header: 'Revenue at Risk',
      render: (item) => (
        <span className="font-bold text-rose-700 font-mono">
          {formatCurrency(item.total_risk_amount)}
        </span>
      ),
    },
    {
      key: 'recovered_amount',
      header: 'ARR Recovered',
      render: (item) => (
        <span className="font-bold text-emerald-700 font-mono">
          {formatCurrency(item.recovered_amount)}
        </span>
      ),
    },
    {
      key: 'lifetime_value',
      header: 'Customer LTV',
      render: (item) => (
        <span className="font-bold text-slate-900 font-mono">
          {formatCurrency(item.lifetime_value)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Lifecycle Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'action',
      header: 'Action',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCustomer(item);
          }}
          className="rounded-[4px] border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0D94FB] hover:bg-blue-100 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Inspect 360°
        </button>
      ),
    },
  ];

  if (isLoading && customers.length === 0) {
    return <LoadingState message="Loading merchant customers & real-time risk scores..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadCustomers} />;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Customer Risk & Revenue Directory"
        subtitle="360° merchant account health, capital exposure, and autonomous recovery yield"
        badge={`${customers.length} Accounts`}
      />

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Accounts"
          value={customers.length}
          subtitle="Managed merchants"
          icon={Users}
        />
        <MetricCard
          title="Revenue at Risk"
          value={formatCurrency(totalExposure)}
          subtitle="Active churn exposure"
          icon={AlertTriangle}
        />
        <MetricCard
          title="ARR Recovered"
          value={formatCurrency(totalRecovered)}
          subtitle="Capital preserved"
          icon={TrendingUp}
          highlight
        />
        <MetricCard
          title="High Risk Accounts"
          value={highRiskCount}
          subtitle={`Avg LTV: ${formatCurrency(avgLtv)}`}
          icon={ShieldCheck}
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, email, ID..."
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
              <option value="risk_desc">Highest Risk Score</option>
              <option value="risk_amount_desc">Highest Revenue at Risk</option>
              <option value="recovered_desc">Highest Recovered ARR</option>
              <option value="ltv_desc">Highest Lifetime Value</option>
              <option value="name">Customer Name (A-Z)</option>
            </select>
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[4px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="AT_RISK">At Risk</option>
            <option value="CHURNED">Churned</option>
          </select>

          <button
            onClick={() => api.exportCsv('cases')}
            className="flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export Directory</span>
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        isLoading={isLoading}
        onRowClick={(item) => setSelectedCustomer(item)}
      />

      {/* Customer 360° Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-md text-left animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-lg font-bold text-[#0C2651] font-heading">
                    {selectedCustomer.name}
                  </span>
                  <StatusBadge status={selectedCustomer.status} size="sm" />
                  <RiskBadge level={selectedCustomer.risk_level} score={selectedCustomer.risk_score} />
                </div>
                <p className="mt-1 text-xs text-slate-500 font-mono">
                  {selectedCustomer.company || 'Direct Account'} • ID: {selectedCustomer.external_customer_id || selectedCustomer.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-[4px] p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-5 space-y-5">
              {/* Financial Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Revenue at Risk</div>
                  <div className="mt-1 text-base font-bold text-rose-700 font-mono">
                    {formatCurrency(selectedCustomer.total_risk_amount)}
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Recovered ARR</div>
                  <div className="mt-1 text-base font-bold text-emerald-700 font-mono">
                    {formatCurrency(selectedCustomer.recovered_amount)}
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Lifetime Spend</div>
                  <div className="mt-1 text-base font-bold text-slate-800 font-mono">
                    {formatCurrency(selectedCustomer.total_spend || selectedCustomer.lifetime_value)}
                  </div>
                </div>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-500">Customer LTV</div>
                  <div className="mt-1 text-base font-bold text-[#0D94FB] font-mono">
                    {formatCurrency(selectedCustomer.lifetime_value)}
                  </div>
                </div>
              </div>

              {/* Contact & Account Details */}
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0C2651] mb-3">
                  Account Communications & Profile
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Email Address:</span>
                    <p className="font-mono text-slate-800 font-bold mt-0.5 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-[#0D94FB]" />
                      {selectedCustomer.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Direct Phone:</span>
                    <p className="font-mono text-slate-800 font-bold mt-0.5 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      {selectedCustomer.phone || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Customer Since:</span>
                    <p className="text-slate-700 mt-0.5">
                      {selectedCustomer.created_at ? formatDateTime(selectedCustomer.created_at) : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Active Policy Tier:</span>
                    <p className="text-slate-800 font-semibold mt-0.5 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      RazorRecover Enterprise Autonomous
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Navigation & Action Shortcuts */}
              <div className="rounded-[4px] border border-blue-200 bg-blue-50/50 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0C2651] mb-2.5 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-[#0D94FB]" />
                  <span>Integrated Revenue Telemetry Links</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => navigate(`/admin/cases?search=${encodeURIComponent(selectedCustomer.name)}`)}
                    className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 p-3 text-xs font-bold text-slate-800 shadow-2xs hover:border-[#0D94FB] transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-[#0D94FB]" />
                      Recovery Cases
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => navigate(`/admin/payments?search=${encodeURIComponent(selectedCustomer.name)}`)}
                    className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 p-3 text-xs font-bold text-slate-800 shadow-2xs hover:border-[#0D94FB] transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                      Payment History
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => navigate('/admin/subscriptions')}
                    className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 p-3 text-xs font-bold text-slate-800 shadow-2xs hover:border-[#0D94FB] transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5 text-purple-600" />
                      Subscriptions
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-[4px] border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
