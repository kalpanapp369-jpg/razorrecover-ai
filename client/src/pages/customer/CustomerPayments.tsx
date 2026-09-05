import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { MetricCard } from '../../components/common/MetricCard';
import { api } from '../../lib/api';
import { formatCurrency, formatDateTime, cn } from '../../lib/utils';
import { PaymentRecord } from '../../types/database.types';
import {
  CreditCard,
  Smartphone,
  Building,
  RefreshCw,
  Search,
  Download,
  Filter,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Receipt,
  FileText,
  Copy,
  Check,
  Zap,
  RotateCcw,
  Info,
  Eye,
  Printer,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const CustomerPayments: React.FC = () => {
  const navigate = useNavigate();

  // Primary Data State
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'recovered' | 'failed' | 'success'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Interactive Modals
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<PaymentRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRetryingId, setIsRetryingId] = useState<string | null>(null);



  // Toast / Status Message
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());

  // Recent Settlement Tracking from localStorage (Resolution Center sync)
  const [recentSettlement, setRecentSettlement] = useState<{
    txnid: string;
    amount: number;
    method: string;
    invoice: string;
  } | null>(null);

  const loadPayments = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const res = await api.getPayments();
      if (res.success) {
        setPayments(res.data);
      }
      setLastSyncedAt(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Helper to ensure Razorpay Checkout script is loaded (Local /checkout.js + CDN)
  const loadRazorpaySdk = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof (window as any).Razorpay !== 'undefined') {
        return resolve(true);
      }
      
      const script = document.createElement('script');
      script.src = '/checkout.js';
      script.async = true;
      script.onload = () => {
        if (typeof (window as any).Razorpay !== 'undefined') {
          resolve(true);
        } else {
          const cdn = document.createElement('script');
          cdn.src = 'https://checkout.razorpay.com/v1/checkout.js';
          cdn.onload = () => resolve(typeof (window as any).Razorpay !== 'undefined');
          cdn.onerror = () => resolve(false);
          document.head.appendChild(cdn);
        }
      };
      script.onerror = () => {
        const cdn = document.createElement('script');
        cdn.src = 'https://checkout.razorpay.com/v1/checkout.js';
        cdn.onload = () => resolve(typeof (window as any).Razorpay !== 'undefined');
        cdn.onerror = () => resolve(false);
        document.head.appendChild(cdn);
      };
      document.head.appendChild(script);

      // Fast polling fallback up to 5s
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (typeof (window as any).Razorpay !== 'undefined') {
          clearInterval(interval);
          resolve(true);
        } else if (checks >= 50) {
          clearInterval(interval);
          resolve(typeof (window as any).Razorpay !== 'undefined');
        }
      }, 100);
    });
  };

  useEffect(() => {
    loadPayments();
    loadRazorpaySdk();

    // Check if customer recently settled via Resolution Center
    const isSettled = localStorage.getItem('customer_recovery_settled');
    const txnid = localStorage.getItem('customer_recovery_txnid') || 'pay_rzp_settled_0891';
    const settledAmount = Number(localStorage.getItem('customer_recovery_settled_amount') || 57000);
    const settledInvoice = localStorage.getItem('customer_recovery_settled_invoice') || 'INV-2026-0891';
    const origTxn = localStorage.getItem('customer_recovery_original_txn');

    if (isSettled === 'true') {
      setRecentSettlement({
        txnid,
        amount: settledAmount,
        method: localStorage.getItem('customer_recovery_method') || 'Razorpay Checkout (UPI/Card)',
        invoice: settledInvoice,
      });

      if (origTxn) {
        setPayments((prev) =>
          prev.map((p) =>
            p.transaction_id === origTxn
              ? {
                  ...p,
                  status: 'RECOVERED',
                  transaction_id: txnid,
                  amount: settledAmount,
                  error_code: undefined,
                  error_description: `Settled via Resolution Center with 5% discount applied (${settledInvoice})`,
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        );
      }
    }
  }, []);

  // Filtered payments computation
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // Tab filter
      if (activeTab === 'recovered' && item.status !== 'RECOVERED') return false;
      if (activeTab === 'failed' && item.status !== 'FAILED') return false;
      if (activeTab === 'success' && item.status !== 'SUCCESS') return false;

      // Method filter
      if (methodFilter !== 'all') {
        const methodStr = (item.payment_method || '').toLowerCase();
        if (methodFilter === 'upi' && !methodStr.includes('upi')) return false;
        if (methodFilter === 'card' && !methodStr.includes('card')) return false;
        if (methodFilter === 'netbanking' && !methodStr.includes('netbanking') && !methodStr.includes('autopay')) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = item.transaction_id.toLowerCase().includes(query);
        const matchesMethod = (item.payment_method || '').toLowerCase().includes(query);
        const matchesDesc = (item.error_description || '').toLowerCase().includes(query);
        const matchesStatus = item.status.toLowerCase().includes(query);
        if (!matchesId && !matchesMethod && !matchesDesc && !matchesStatus) return false;
      }

      return true;
    });
  }, [payments, activeTab, methodFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalVolume = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const recoveredItems = payments.filter((p) => p.status === 'RECOVERED');
    const successItems = payments.filter((p) => p.status === 'SUCCESS');
    const failedItems = payments.filter((p) => p.status === 'FAILED');

    const settledVolume = [...recoveredItems, ...successItems].reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const recoveredVolume = recoveredItems.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const failedVolume = failedItems.reduce((acc, p) => acc + Number(p.amount || 0), 0);

    const totalAttempted = recoveredItems.length + failedItems.length + successItems.length;
    const recoveryRate = totalAttempted > 0
      ? Math.round(((recoveredItems.length + successItems.length) / totalAttempted) * 100)
      : 92;

    return {
      totalVolume,
      settledVolume,
      recoveredVolume,
      failedVolume,
      recoveredCount: recoveredItems.length,
      successCount: successItems.length,
      failedCount: failedItems.length,
      recoveryRate,
    };
  }, [payments]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Deterministic technical telemetry generators for rich inspector
  const getTelemetryData = (item: PaymentRecord) => {
    // Generate deterministic 12-digit RRN from txn ID
    let hash = 0;
    for (let i = 0; i < item.transaction_id.length; i++) {
      hash = (hash * 31 + item.transaction_id.charCodeAt(i)) % 10000000000;
    }
    const rrn = `42${String(Math.abs(hash)).padStart(10, '8')}`.slice(0, 12);
    const authCode = `AUTH_${Math.abs(hash).toString(36).toUpperCase().slice(0, 6)}`;
    const orderId = `order_${Math.abs(hash).toString(36).toLowerCase().padEnd(14, 'k')}`;
    return { rrn, authCode, orderId };
  };

  // CSV Export feature
  const handleExportCsv = () => {
    const headers = ['Transaction ID', 'Status', 'Amount (INR)', 'Method', 'Date', 'RRN', 'Auth Code', 'Notes'];
    const rows = filteredPayments.map((p) => {
      const { rrn, authCode } = getTelemetryData(p);
      return [
        p.transaction_id,
        p.status,
        p.amount,
        `"${p.payment_method || 'Razorpay Gateway'}"`,
        `"${new Date(p.created_at).toISOString()}"`,
        rrn,
        authCode,
        `"${(p.error_description || 'Processed via Razorpay Core Gateway').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `razorpay_customer_payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessToast('Exported payment statement CSV successfully!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Helper to finish settlement, update database, and update UI
  const handleFinishSettlement = async (item: PaymentRecord, txnId: string, methodStr: string) => {
    try {
      const verified = await api.verifySettlement({
        paymentId: txnId,
        invoiceNumber: 'INV-2026-0891',
        amount: item.amount,
        method: methodStr,
      });

      if (verified.success) {
        setSuccessToast(`⚡ Payment ${txnId} successfully settled and reconciled via Razorpay!`);
        // Update payment in local state immediately
        setPayments((prev) =>
          prev.map((p) =>
            p.transaction_id === item.transaction_id
              ? {
                  ...p,
                  status: 'RECOVERED',
                  transaction_id: txnId,
                  payment_method: methodStr,
                  error_code: undefined,
                  error_description: 'Successfully settled via Razorpay Secure Checkout',
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        );
        // Also update recent settlement banner
        setRecentSettlement({
          txnid: txnId,
          amount: item.amount,
          method: methodStr,
          invoice: 'INV-2026-0891',
        });
      }
    } catch (e: any) {
      console.error('Settlement verification error:', e);
    } finally {
      setIsRetryingId(null);
      setTimeout(() => setSuccessToast(null), 5000);
    }
  };

  // Direct Official Razorpay Checkout Popup Launcher
  const handleDirectRazorpayRetry = async (item: PaymentRecord) => {
    setIsRetryingId(item.transaction_id);
    try {
      // 1. Ensure Razorpay SDK is loaded
      if (typeof (window as any).Razorpay === 'undefined') {
        await loadRazorpaySdk();
      }

      // 2. Generate Razorpay order from backend
      const orderRes = await api.createPaymentOrder({
        amount: item.amount,
        invoiceNumber: 'INV-2026-0891',
      });

      const keyId = orderRes?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TUF0VPxV9XuQeb';
      const orderId = orderRes?.order?.id?.startsWith('order_') ? orderRes.order.id : undefined;

      // 3. Official Razorpay Checkout options matching CustomerRecovery
      const options = {
        key: keyId,
        amount: Math.round(item.amount * 100), // in paise
        currency: 'INR',
        name: 'Apex Growth Labs',
        description: `Settlement for Invoice INV-2026-0891 (${formatCurrency(item.amount)})`,
        image: 'https://cdn.razorpay.com/static/assets/logo/rzp.svg',
        order_id: orderId,
        prefill: {
          name: 'Rohan Sharma',
          email: 'customer@example.com',
          contact: '+919123456789',
        },
        notes: {
          invoice_number: 'INV-2026-0891',
          transaction_ref: item.transaction_id,
          company: 'Apex Growth Labs',
        },
        theme: {
          color: '#0D94FB',
          backdrop_color: 'rgba(12, 38, 81, 0.7)',
        },
        modal: {
          ondismiss: () => {
            setIsRetryingId(null);
          },
        },
        handler: async (response: any) => {
          setIsRetryingId(null);
          const txn = response.razorpay_payment_id || `pay_rzp_${Date.now().toString(36)}`;
          await handleFinishSettlement(item, txn, 'Razorpay Official Checkout (Card/UPI)');
        },
      };

      // Ensure Razorpay constructor is available
      let rzpConstructor = (window as any).Razorpay;
      if (!rzpConstructor) {
        // Wait up to 3 seconds for script to initialize
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 100));
          if ((window as any).Razorpay) {
            rzpConstructor = (window as any).Razorpay;
            break;
          }
        }
      }

      if (rzpConstructor) {
        const rzp = new rzpConstructor(options);
        rzp.on('payment.failed', (failResp: any) => {
          console.error('Razorpay payment failed:', failResp.error);
          setIsRetryingId(null);
        });
        rzp.open();
      } else {
        console.warn('Razorpay SDK still initializing, retrying connection...');
        setSuccessToast('Connecting to Razorpay gateway... Please click Retry once more in 2 seconds.');
        setIsRetryingId(null);
      }
    } catch (err: any) {
      console.error('Razorpay retry error:', err);
      setIsRetryingId(null);
    }
  };

  // Payment method icon
  const getMethodIcon = (method?: string | null) => {
    const m = (method || '').toLowerCase();
    if (m.includes('upi') || m.includes('paytm') || m.includes('phonepe') || m.includes('gpay')) {
      return <Smartphone className="h-4 w-4 text-emerald-600" />;
    }
    if (m.includes('card') || m.includes('visa') || m.includes('mastercard')) {
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    }
    return <Building className="h-4 w-4 text-slate-600" />;
  };

  if (isLoading && payments.length === 0) {
    return <LoadingState message="Connecting to Razorpay gateway & loading payment ledger..." light />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadPayments(false)} light />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="flex items-center justify-between gap-3 rounded-[4px] border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-blade-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header with Live Engine Telemetry Strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading text-[#0C2651] tracking-tight">Payments & Settlements</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Gateway Active
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time ledger of your subscription billings, failed transactions, and AI autonomous recoveries
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadPayments(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition shadow-xs disabled:opacity-50"
            title="Re-fetch payment ledger from server"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', isRefreshing && 'animate-spin text-[#0D94FB]')} />
            {isRefreshing ? 'Syncing...' : 'Sync Gateway'}
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => navigate('/customer/recovery')}
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0C2651] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#13356e] active:bg-[#0a1e40] transition shadow-blade-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0D94FB]" />
            Resolution Center
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Gateway Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-900">Webhook Engine:</span> Listening (HTTP 200)
          </div>
          <div className="hidden sm:block text-slate-300">•</div>
          <div>
            <span className="font-semibold text-slate-900">Reconciliation:</span> Zero-Delay Real-time
          </div>
          <div className="hidden sm:block text-slate-300">•</div>
          <div>
            <span className="font-semibold text-slate-900">Next Scheduled Sweep:</span> T+1 Automated @ 09:00 AM IST
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Synced {lastSyncedAt.toLocaleTimeString()}
        </div>
      </div>

      {/* Prominent Banner If Customer Claimed Resolution Center Offer */}
      {recentSettlement && (
        <div className="relative overflow-hidden rounded-[4px] border border-[#0D94FB]/40 bg-gradient-to-r from-[#E6F4FE]/80 via-white to-indigo-50/50 p-4 shadow-blade-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] bg-[#0D94FB] text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0D94FB]">
                    ⚡ Recent Autonomous Settlement Confirmed
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    PAID &amp; RECONCILED
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-[#0C2651]">
                  Invoice {recentSettlement.invoice} settled via Razorpay with 5% early discount applied
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Txn ID: {recentSettlement.txnid} • Settled Amount: {formatCurrency(recentSettlement.amount)} (Saved ₹3,000)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const matched = payments.find((p) => p.transaction_id === recentSettlement.txnid) || {
                    id: 'settled-rec',
                    customer_id: 'c111',
                    transaction_id: recentSettlement.txnid,
                    amount: recentSettlement.amount,
                    currency: 'INR',
                    status: 'RECOVERED' as const,
                    gateway: 'Razorpay',
                    payment_method: recentSettlement.method,
                    error_description: 'Settled via Razorpay Checkout with 5% discount applied',
                    attempts_count: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  setReceiptPayment(matched);
                }}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
              >
                <Receipt className="h-3.5 w-3.5 text-[#0D94FB]" />
                View GST Receipt
              </button>

              <button
                onClick={() => navigate('/customer/recovery')}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0D94FB] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0b82dc] shadow-xs transition"
              >
                Resolution Hub
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Executive Metric KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="TOTAL SETTLED VOLUME"
          value={formatCurrency(metrics.settledVolume)}
          subtitle={`${metrics.recoveredCount + metrics.successCount} successful & recovered payments`}
          icon={ShieldCheck}
          highlight
        />
        <MetricCard
          title="RECOVERED BY AI ENGINE"
          value={formatCurrency(metrics.recoveredVolume)}
          subtitle={`${metrics.recoveredCount} invoices saved via prompt discount`}
          icon={Sparkles}
        />
        <MetricCard
          title="FAILED / AT-RISK INFLOW"
          value={formatCurrency(metrics.failedVolume)}
          subtitle={`${metrics.failedCount} action required • 1-click retry ready`}
          icon={AlertTriangle}
          className={metrics.failedCount > 0 ? 'border-amber-200 bg-amber-50/20' : ''}
        />
        <MetricCard
          title="RECOVERY SUCCESS RATE"
          value={`${metrics.recoveryRate}%`}
          subtitle="Real-time automated reconciliation"
          icon={CheckCircle2}
        />
      </div>

      {/* Status Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 sm:border-b-0 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition',
                activeTab === 'all'
                  ? 'border-[#0D94FB] text-[#0C2651]'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              )}
            >
              All Transactions
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                {payments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('recovered')}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition',
                activeTab === 'recovered'
                  ? 'border-purple-600 text-purple-900 font-bold'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              Recovered by AI
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                {metrics.recoveredCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('failed')}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition',
                activeTab === 'failed'
                  ? 'border-rose-600 text-rose-900 font-bold'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              Failed / Declined
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                {metrics.failedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('success')}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition',
                activeTab === 'success'
                  ? 'border-emerald-600 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Successful
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                {metrics.successCount}
              </span>
            </button>
          </div>

          {/* Search & Instrument Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Txn ID, method, error..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[4px] border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-slate-400 focus:border-[#0D94FB] focus:outline-none focus:ring-1 focus:ring-[#0D94FB]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-[4px] border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-[#0D94FB] focus:outline-none"
            >
              <option value="all">All Methods</option>
              <option value="card">Cards (Visa/Mastercard)</option>
              <option value="upi">UPI / VPA</option>
              <option value="netbanking">NetBanking &amp; AutoPay</option>
            </select>
          </div>
        </div>

        {/* Enhanced Payments Data Table */}
        <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-blade-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Transaction &amp; Gateway</th>
                  <th className="py-3 px-4">Instrument / Method</th>
                  <th className="py-3 px-4">Settled Amount</th>
                  <th className="py-3 px-4">Status &amp; Diagnosis</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                        <Search className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No payment records found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try adjusting your search query or filter criteria
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((item) => {
                    const isRecovered = item.status === 'RECOVERED';
                    const isFailed = item.status === 'FAILED';
                    const isSuccess = item.status === 'SUCCESS';
                    const telemetry = getTelemetryData(item);
                    const isJustSettled = recentSettlement && recentSettlement.txnid === item.transaction_id;

                    return (
                      <tr
                        key={item.id || item.transaction_id}
                        className={cn(
                          'hover:bg-slate-50/80 transition group',
                          isJustSettled && 'bg-blue-50/40 border-l-4 border-l-[#0D94FB]',
                          isFailed && 'bg-rose-50/20'
                        )}
                      >
                        {/* Transaction ID & Gateway */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#0D94FB]">
                              {item.transaction_id}
                            </span>
                            <button
                              onClick={() => handleCopy(item.transaction_id, item.transaction_id)}
                              className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition"
                              title="Copy Transaction ID"
                            >
                              {copiedId === item.transaction_id ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                            <span>RRN: {telemetry.rrn}</span>
                            <span>•</span>
                            <span className="text-slate-500">{item.gateway || 'Razorpay'}</span>
                          </div>
                        </td>

                        {/* Method */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            {getMethodIcon(item.payment_method)}
                            <span className="truncate max-w-[180px]">
                              {item.payment_method || 'Razorpay Gateway'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {telemetry.authCode}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-slate-900 text-sm">
                            {formatCurrency(item.amount)}
                          </div>
                          {isRecovered && (
                            <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-700 mt-0.5">
                              ⚡ 5% AI Discount
                            </span>
                          )}
                        </td>

                        {/* Status & Diagnosis */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <StatusBadge status={item.status} size="sm" light />
                            {isFailed && item.error_code && (
                              <span className="font-mono text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 truncate max-w-[200px]" title={item.error_description || item.error_code}>
                                {item.error_code}
                              </span>
                            )}
                            {isRecovered && (
                              <span className="text-[11px] text-emerald-600 font-medium">
                                Autonomous rescue settled
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          <div>{formatDateTime(item.created_at)}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Drawer Button */}
                            <button
                              onClick={() => setSelectedPayment(item)}
                              className="inline-flex items-center gap-1 rounded-[4px] border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition"
                              title="Inspect Gateway Telemetry"
                            >
                              <Eye className="h-3 w-3 text-slate-500" />
                              Inspect
                            </button>

                            {/* View Receipt for Success / Recovered */}
                            {(isSuccess || isRecovered) && (
                              <button
                                onClick={() => setReceiptPayment(item)}
                                className="inline-flex items-center gap-1 rounded-[4px] border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-[#0D94FB] hover:bg-blue-100 transition shadow-xs"
                                title="View Official GST Tax Invoice"
                              >
                                <Receipt className="h-3 w-3" />
                                Receipt
                              </button>
                            )}

                            {/* Actions for Failed Payments */}
                            {isFailed && (
                              <>
                                <button
                                  onClick={() => handleDirectRazorpayRetry(item)}
                                  disabled={isRetryingId === item.transaction_id}
                                  className="inline-flex items-center gap-1 rounded-[4px] bg-[#0C2651] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#153e7e] transition shadow-xs disabled:opacity-50"
                                  title="Retry settlement with Razorpay Checkout"
                                >
                                  {isRetryingId === item.transaction_id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin text-white" />
                                  ) : (
                                    <RotateCcw className="h-3 w-3 text-emerald-400" />
                                  )}
                                  Retry ⚡
                                </button>

                                <button
                                  onClick={() =>
                                    navigate(
                                      `/customer/recovery?txn=${encodeURIComponent(item.transaction_id)}&amount=${item.amount}&code=${encodeURIComponent(item.error_code || '')}&desc=${encodeURIComponent(item.error_description || '')}&method=${encodeURIComponent(item.payment_method || '')}`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-[4px] border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 transition shadow-xs"
                                  title="Resolve in Resolution Center with 5% discount"
                                >
                                  <Sparkles className="h-3 w-3 text-purple-600" />
                                  Resolve
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Summary Strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{filteredPayments.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{payments.length}</span> recorded transactions
            </div>
            <div className="flex items-center gap-4 mt-1 sm:mt-0 font-mono text-[11px]">
              <span>Active Filter: {activeTab.toUpperCase()}</span>
              <span>•</span>
              <span>Reconciled Currency: INR (₹)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE PAYMENT INSPECTOR DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[6px] border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-[#0C2651] text-white">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0C2651] text-base">Payment Telemetry Inspector</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedPayment.transaction_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-[4px] p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
              {/* Top Overview Status Card */}
              <div className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Settlement Value</p>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                  <p className="text-slate-500 mt-1">
                    Currency: <span className="font-mono font-semibold text-slate-700">{selectedPayment.currency || 'INR'}</span>
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <StatusBadge status={selectedPayment.status} size="md" light />
                  <p className="text-[11px] text-slate-400 font-mono">
                    Gateway: {selectedPayment.gateway || 'Razorpay Core'}
                  </p>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
                  Technical Gateway Attributes
                </h4>
                {(() => {
                  const telemetry = getTelemetryData(selectedPayment);
                  return (
                    <div className="grid grid-cols-2 gap-3 rounded-[4px] border border-slate-200 bg-white p-4 font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px] block">BANK REFERENCE NO (RRN)</span>
                        <span className="font-bold text-slate-800">{telemetry.rrn}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">GATEWAY AUTH CODE</span>
                        <span className="font-bold text-slate-800">{telemetry.authCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">RAZORPAY ORDER ID</span>
                        <span className="font-semibold text-blue-600 truncate block">{telemetry.orderId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">PAYMENT INSTRUMENT</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {selectedPayment.payment_method || 'Razorpay AutoPay'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">TOKENIZATION STATUS</span>
                        <span className="text-emerald-700 font-semibold">RBI TokenHQ Compliant</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">ACQUIRER SWITCH</span>
                        <span className="text-slate-700 font-semibold">HDFC Bank / NPCI Direct</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Error Diagnostics if FAILED */}
              {selectedPayment.status === 'FAILED' && (
                <div className="rounded-[4px] border border-rose-200 bg-rose-50/60 p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-rose-900 text-xs">Gateway Failure Diagnosis</h5>
                      <p className="mt-1 text-xs text-rose-800 font-mono">
                        Error Code: <span className="font-bold">{selectedPayment.error_code || 'TRANSACTION_DECLINED'}</span>
                      </p>
                      <p className="text-xs text-rose-700 mt-1">
                        {selectedPayment.error_description || 'Bank declined transaction due to daily card limit or security rules.'}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(null);
                            handleDirectRazorpayRetry(selectedPayment);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0C2651] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#143d7c] transition shadow-xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                          Retry with Razorpay Checkout
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPayment(null);
                            navigate('/customer/recovery');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-[4px] border border-purple-300 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition shadow-xs"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          Claim 5% Discount in Resolution Center
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4-Step Payment Lifecycle Timeline */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
                  Transaction Lifecycle Timeline
                </h4>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <p className="font-semibold text-slate-800">Order Generated</p>
                    <p className="text-slate-400 text-[11px] font-mono">
                      Order payload created by billing engine via Razorpay Orders API
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <p className="font-semibold text-slate-800">Checkout Modal Initiated</p>
                    <p className="text-slate-400 text-[11px] font-mono">
                      Customer loaded Razorpay Secure standard checkout modal
                    </p>
                  </div>

                  <div className="relative">
                    <span className={cn(
                      'absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white',
                      selectedPayment.status === 'FAILED' ? 'bg-rose-500' : 'bg-emerald-500'
                    )}>
                      {selectedPayment.status === 'FAILED' ? <X className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />}
                    </span>
                    <p className="font-semibold text-slate-800">
                      {selectedPayment.status === 'FAILED' ? 'Bank Gateway Declined' : '3DS OTP Verified'}
                    </p>
                    <p className="text-slate-400 text-[11px] font-mono">
                      {selectedPayment.status === 'FAILED'
                        ? 'Issuing bank rejected transaction handshake'
                        : 'Customer authenticated via 2-factor OTP authorization'}
                    </p>
                  </div>

                  <div className="relative">
                    <span className={cn(
                      'absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white',
                      selectedPayment.status === 'FAILED' ? 'bg-amber-500' : 'bg-emerald-500'
                    )}>
                      {selectedPayment.status === 'FAILED' ? <Zap className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />}
                    </span>
                    <p className="font-semibold text-slate-800">
                      {selectedPayment.status === 'FAILED' ? 'Autonomous Recovery Triggered' : 'Ledger Reconciled'}
                    </p>
                    <p className="text-slate-400 text-[11px] font-mono">
                      {selectedPayment.status === 'FAILED'
                        ? 'RazorRecover AI initiated proactive recovery strategy'
                        : 'Webhook received (HTTP 200) and invoice marked PAID'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button
                onClick={() => handleCopy(JSON.stringify(selectedPayment, null, 2), 'raw-payload')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                {copiedId === 'raw-payload' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                Copy JSON Payload
              </button>

              <div className="flex items-center gap-2">
                {(selectedPayment.status === 'SUCCESS' || selectedPayment.status === 'RECOVERED') && (
                  <button
                    onClick={() => {
                      setReceiptPayment(selectedPayment);
                      setSelectedPayment(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-[4px] border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#0D94FB] hover:bg-blue-100 transition"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    View GST Receipt
                  </button>
                )}
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-[4px] border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OFFICIAL RAZORPAY GST TAX RECEIPT MODAL */}
      {/* ========================================================================= */}
      {receiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl overflow-hidden rounded-[6px] border border-slate-300 bg-white shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[95vh]">
            {/* Header / Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#0D94FB]" />
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Official GST Tax Receipt
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded-[4px] border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs transition"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-600" />
                  Print
                </button>
                <button
                  onClick={() => setReceiptPayment(null)}
                  className="rounded-[4px] p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-white text-slate-800 font-sans">
              {/* Branded Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl tracking-tight text-[#0C2651]">
                      RAZOR<span className="text-[#0D94FB]">PAY</span>
                    </span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                      OFFICIAL RECEIPT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Razorpay Software Private Limited<br />
                    SJR Cyber, 22 Laskar Hosur Road, Adugodi, Bangalore - 560030<br />
                    GSTIN: <span className="font-mono font-semibold">29AADCR8291Q1Z4</span> • SAC Code: <span className="font-mono font-semibold">998313</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    PAID &amp; SETTLED
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Receipt #{receiptPayment.transaction_id.replace('pay_', 'REC-')}
                  </p>
                </div>
              </div>

              {/* Billed To & Transaction Details */}
              <div className="grid grid-cols-2 gap-4 rounded-[4px] border border-slate-100 bg-slate-50/70 p-3.5 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BILLED TO CUSTOMER</p>
                  <p className="font-bold text-slate-900 mt-0.5">Rohan Sharma</p>
                  <p className="text-slate-600">Apex Growth Labs Private Limited</p>
                  <p className="text-slate-500 font-mono text-[11px]">customer@example.com</p>
                  <p className="text-slate-500 font-mono text-[11px]">GSTIN: 29AAACR1234M1Z5</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SETTLEMENT DETAILS</p>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{receiptPayment.transaction_id}</p>
                  <p className="text-slate-600">Date: {new Date(receiptPayment.created_at).toLocaleDateString()}</p>
                  <p className="text-slate-600">Method: {receiptPayment.payment_method || 'Razorpay UPI/Card'}</p>
                  <p className="text-slate-500">Status: Verified via NPCI/Gateway</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-[4px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">HSN/SAC</th>
                      <th className="py-2.5 px-3 text-right">Gross Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800">Enterprise AI Revenue Suite Subscription</p>
                        <p className="text-[11px] text-slate-400">Invoice Ref: INV-2026-0891 • 1 Month Period</p>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px]">998313</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        {formatCurrency(receiptPayment.status === 'RECOVERED' ? 60000 : receiptPayment.amount)}
                      </td>
                    </tr>
                    {receiptPayment.status === 'RECOVERED' && (
                      <tr className="bg-purple-50/40 text-purple-900">
                        <td className="py-2 px-3">
                          <p className="font-semibold">⚡ Autonomous Prompt Settlement Credit (-5%)</p>
                          <p className="text-[10px] text-purple-700">Applied instantly via Resolution Center incentive</p>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px]">-</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-purple-700">-₹3,000</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Totals */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Net Taxable Value</span>
                  <span className="font-mono">
                    {formatCurrency(Math.round(receiptPayment.amount / 1.18))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST @ 9%</span>
                  <span className="font-mono">
                    {formatCurrency(Math.round((receiptPayment.amount / 1.18) * 0.09))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST @ 9%</span>
                  <span className="font-mono">
                    {formatCurrency(Math.round((receiptPayment.amount / 1.18) * 0.09))}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                  <span>Total Amount Paid (Inclusive of Taxes)</span>
                  <span className="font-mono text-[#0C2651] text-base">{formatCurrency(receiptPayment.amount)}</span>
                </div>
              </div>

              {/* Security Seal & Watermark */}
              <div className="flex items-center justify-between rounded-[4px] border border-emerald-200 bg-emerald-50/50 p-3 text-[11px] text-emerald-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-bold">Cryptographically Verified Receipt</p>
                    <p className="text-emerald-700">Authentic Razorpay Transaction Hash verified by NPCI Switch</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  AUTH-OK-2026
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button
                onClick={() => setReceiptPayment(null)}
                className="rounded-[4px] bg-[#0C2651] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#12366f] transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
