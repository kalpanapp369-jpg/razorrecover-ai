import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { InvoiceRecord, SubscriptionRecord } from '../../types/database.types';
import {
  Receipt,
  Repeat,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  CreditCard,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadCustomerData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profileRes, invoicesRes, subsRes] = await Promise.all([
          api.getMyCustomerProfile().catch(() => ({ success: false, data: null })),
          api.getInvoices().catch(() => ({ success: false, data: [] })),
          api.getSubscriptions().catch(() => ({ success: false, data: [] })),
        ]);

        // Customer Profile with fallback
        if (profileRes.success && profileRes.data) {
          setCustomer(profileRes.data);
        } else {
          setCustomer({
            name: 'Rohan Sharma',
            company: 'Apex Growth Labs',
            total_spend: 125000,
            status: 'HEALTHY',
          });
        }

        // Invoices with local settlement check & demo fallback
        if (invoicesRes.success && invoicesRes.data && invoicesRes.data.length > 0) {
          const processedInvoices = invoicesRes.data.map((inv: InvoiceRecord) => {
            const isSettled = localStorage.getItem(`inv_settled_${inv.id}`);
            if (isSettled === 'true' && inv.status === 'OVERDUE') {
              return { ...inv, status: 'PAID' as const, amount_paid: inv.amount, days_overdue: 0 };
            }
            return inv;
          });
          setInvoices(processedInvoices);
        } else {
          const isInvSettled = localStorage.getItem('inv_settled_i1111111-1111-1111-1111-111111111111');
          const defaultInvoices: InvoiceRecord[] = [
            {
              id: 'i1111111-1111-1111-1111-111111111111',
              customer_id: customer?.id || 'c1111111-1111-1111-1111-111111111111',
              invoice_number: 'INV-2026-0891',
              amount: 60000,
              amount_paid: isInvSettled === 'true' ? 60000 : 0,
              currency: 'INR',
              status: isInvSettled === 'true' ? 'PAID' : 'OVERDUE',
              due_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
              days_overdue: isInvSettled === 'true' ? 0 : 14,
              payment_link: 'https://rzp.io/i/rec_inv_891',
              created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'i3333333-3333-3333-3333-333333333333',
              customer_id: customer?.id || 'c1111111-1111-1111-1111-111111111111',
              invoice_number: 'INV-2026-0870',
              amount: 24500,
              amount_paid: 24500,
              currency: 'INR',
              status: 'PAID',
              due_date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
              days_overdue: 0,
              payment_link: 'https://rzp.io/i/rec_inv_870',
              created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'i4444444-4444-4444-4444-444444444444',
              customer_id: customer?.id || 'c1111111-1111-1111-1111-111111111111',
              invoice_number: 'INV-2026-0855',
              amount: 24500,
              amount_paid: 24500,
              currency: 'INR',
              status: 'PAID',
              due_date: new Date(Date.now() - 55 * 86400000).toISOString().split('T')[0],
              days_overdue: 0,
              payment_link: 'https://rzp.io/i/rec_inv_855',
              created_at: new Date(Date.now() - 70 * 86400000).toISOString(),
              updated_at: new Date().toISOString(),
            }
          ];
          setInvoices(defaultInvoices);
        }

        // Subscriptions
        if (subsRes.success && subsRes.data && subsRes.data.length > 0) {
          const isSubSettled = localStorage.getItem('customer_sub_settled');
          const processedSubs = subsRes.data.map((sub: SubscriptionRecord) => {
            if (isSubSettled === 'true' && sub.status === 'PAST_DUE') {
              return { ...sub, status: 'ACTIVE' as const };
            }
            return sub;
          });
          setSubscriptions(processedSubs);
        } else {
          const isSubSettled = localStorage.getItem('customer_sub_settled');
          setSubscriptions([
            {
              id: 's1111111-1111-1111-1111-111111111111',
              customer_id: customer?.id || 'c1111111-1111-1111-1111-111111111111',
              subscription_code: 'sub_scale_001',
              plan_name: 'Scale Enterprise Plan',
              billing_cycle: 'MONTHLY',
              amount: 60000,
              currency: 'INR',
              status: isSubSettled === 'true' ? 'ACTIVE' : 'PAST_DUE',
              next_billing_at: new Date(Date.now() - 3 * 86400000).toISOString(),
              grace_period_ends_at: new Date(Date.now() + 4 * 86400000).toISOString(),
              dunning_stage: isSubSettled === 'true' ? 0 : 1,
              created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
              updated_at: new Date().toISOString(),
            }
          ]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load customer details');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  // Compute actual lifetime spend (Historical ₹1,25,000 + newly paid invoices)
  const newlyPaidAmount = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((acc, i) => acc + (i.amount_paid || i.amount || 0), 0);
  
  const baseHistoricalSpend = customer?.total_spend && customer.total_spend > 0 ? customer.total_spend : 125000;
  const lifetimeSpend = Math.max(baseHistoricalSpend, 125000 + newlyPaidAmount);

  const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
  const pastDueSub = subscriptions.find((s) => s.status === 'PAST_DUE');
  const activeSub = subscriptions.find((s) => s.status === 'ACTIVE') || subscriptions[0];

  const invoiceColumns: Column<InvoiceRecord>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice Number',
      render: (item) => <span className="font-mono text-xs font-bold text-[#0D94FB]">{item.invoice_number}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item) => <span className="font-bold text-slate-900 font-mono">{formatCurrency(item.amount)}</span>,
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (item) => <span className="text-xs text-slate-500 font-mono">{formatDate(item.due_date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" light />,
    },
    {
      key: 'action',
      header: 'Action',
      render: (item) => (
        <button
          onClick={() => navigate('/customer/invoices')}
          className="rounded-[4px] border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0D94FB] hover:bg-blue-100 transition shadow-xs cursor-pointer"
        >
          {item.status === 'PAID' ? 'View Receipt' : 'Pay Invoice \u2192'}
        </button>
      ),
    },
  ];

  if (isLoading && !customer) {
    return <LoadingState message="Loading your account dashboard..." light />;
  }

  if (error) {
    return <ErrorState message={error} light />;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={`Welcome, ${customer?.name || 'Rohan Sharma'}`}
        subtitle={`Account Overview • ${customer?.company || 'Apex Growth Labs'}`}
        badge="Customer Portal"
        light
      />

      {/* Resolution Center Alert Banner with pulse and hover lift */}
      {overdueInvoices.length > 0 && (
        <div className="group rounded-[4px] border border-blue-200 bg-white p-5 shadow-blade-sm hover:shadow-blade-md hover:border-[#0D94FB]/40 transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-blue-50 border border-blue-200 text-[#0D94FB] group-hover:scale-105 transition-transform">
                <Shield className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D94FB] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0D94FB]"></span>
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0C2651] font-heading flex items-center gap-2">
                  5% Special Settlement Credit Active
                  <span className="inline-flex items-center rounded-[4px] bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Auto-Applied
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  You have an active AI resolution credit of 5% off on overdue invoice {overdueInvoices[0].invoice_number}.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/customer/recovery')}
              className="group/btn inline-flex items-center justify-center gap-1.5 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Settle in Resolution Center</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>
      )}

      {/* 3 Executive Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Lifetime Spend"
          value={formatCurrency(lifetimeSpend)}
          subtitle="Total verified billing volume"
          icon={CheckCircle2}
          light
        />
        <MetricCard
          title="Active Invoices Due"
          value={overdueInvoices.length > 0 ? `${overdueInvoices.length} Overdue` : '0 Overdue'}
          subtitle={overdueInvoices.length > 0 ? `Requires attention (${formatCurrency(overdueInvoices.reduce((a, b) => a + b.amount, 0))})` : 'All invoices settled'}
          icon={Receipt}
          highlight={overdueInvoices.length > 0}
          light
        />
        <MetricCard
          title="Subscription Health"
          value={pastDueSub ? 'Scale Plan' : (activeSub?.plan_name || 'Scale Plan')}
          subtitle={pastDueSub ? 'Grace Period Active (Stage 2)' : '100% In Good Standing'}
          icon={Repeat}
          light
        />
      </div>

      {/* Pending Invoices Table with Hover Card Container */}
      <div className="rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm hover:shadow-blade-md hover:border-slate-300 transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0C2651] font-heading">Recent Invoices &amp; Billing History</h3>
            <p className="text-xs text-slate-500 mt-0.5">Track your ongoing tax bills, payment proofs &amp; statements</p>
          </div>
          <button
            onClick={() => navigate('/customer/invoices')}
            className="group flex items-center gap-1 text-xs font-bold text-[#0D94FB] hover:text-[#0B82DE] transition-all cursor-pointer"
          >
            <span>View all invoices</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
        <DataTable columns={invoiceColumns} data={invoices} light />
      </div>
    </div>
  );
};
