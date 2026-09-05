import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { SubscriptionRecord } from '../../types/database.types';
import {
  CreditCard,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Shield,
  X,
  ExternalLink,
  Lock,
  RotateCcw,
  Check,
  Layers,
  Calendar,
  Zap,
  Info,
  ChevronRight,
  Receipt,
  PauseCircle,
  XCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface PlanTier {
  id: string;
  name: string;
  price: number;
  cycle: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const AVAILABLE_PLANS: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    price: 5000,
    cycle: 'monthly',
    description: 'Essential recovery automation for early stage SaaS startups.',
    features: ['Up to ₹5L monthly recovery volume', 'Standard email dunning', 'Basic Webhook alerts', 'Community support'],
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    price: 12000,
    cycle: 'monthly',
    description: 'Full autonomous recovery engine with smart WhatsApp and UPI AutoPay.',
    features: ['Up to ₹25L monthly recovery volume', 'Smart WhatsApp & SMS triggers', 'UPI AutoPay mandate retry', 'Priority support'],
  },
  {
    id: 'scale',
    name: 'Scale Plan (Annual)',
    price: 24000,
    cycle: 'annual',
    description: 'Enterprise-grade revenue defense with AI failure diagnosis & prompt discount incentives.',
    features: ['Unlimited recovery volume', 'Dynamic 5% prompt discount engine', 'Custom dunning rules & webhooks', 'Dedicated Account Manager'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Custom',
    price: 65000,
    cycle: 'annual',
    description: 'Dedicated multi-gateway orchestration with custom ML payment retry routing.',
    features: ['Multi-currency international routing', 'Custom ML retry algorithms', '99.99% SLA guarantee', '24/7 Phone & Slack support'],
  },
];

const getGracePeriodInfo = (sub: SubscriptionRecord) => {
  let remainingDays = 4;
  let cutoffDateStr = '';

  // Specific demo calculations based on renewal dates observed by user
  if (sub.subscription_code === 'sub_ent_002' || sub.plan_name?.toLowerCase().includes('enterprise')) {
    remainingDays = 6;
    cutoffDateStr = '31 Aug 2026';
  } else if (sub.subscription_code === 'sub_scale_001' || sub.plan_name?.toLowerCase().includes('scale')) {
    remainingDays = 4;
    cutoffDateStr = '27 Aug 2026';
  } else if (sub.grace_period_ends_at) {
    const endMs = new Date(sub.grace_period_ends_at).getTime();
    const nowMs = Date.now();
    remainingDays = Math.max(1, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)));
    cutoffDateStr = formatDate(sub.grace_period_ends_at);
  } else if (sub.next_billing_at) {
    const dueDateMs = new Date(sub.next_billing_at).getTime();
    const cutoffMs = dueDateMs + 7 * 86400000;
    remainingDays = Math.max(1, Math.ceil((cutoffMs - Date.now()) / (1000 * 60 * 60 * 24)));
    cutoffDateStr = formatDate(new Date(cutoffMs).toISOString());
  } else {
    remainingDays = 4;
    cutoffDateStr = '27 Aug 2026';
  }

  return {
    remainingDays,
    cutoffDateStr,
    label: remainingDays === 1 ? 'Grace period ends tomorrow (1 day)' : `Grace period ends in ${remainingDays} days`,
  };
};

export const CustomerSubscriptions: React.FC = () => {
  const navigate = useNavigate();

  // Data State
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactivity State
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pauseDuration, setPauseDuration] = useState('1');
  const [cancelReason, setCancelReason] = useState('pricing');
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'PAST_DUE'>('ALL');
  const [isSettlingId, setIsSettlingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Linked payment method state
  const [savedUpiActive, setSavedUpiActive] = useState(false);
  const [savedUpiId, setSavedUpiId] = useState('rohan@okhdfcbank');
  const [savedCardActive, setSavedCardActive] = useState(false);
  const [savedCardLast4, setSavedCardLast4] = useState('1007');

  const loadSubscriptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getSubscriptions();
      if (res.success) {
        // Check if customer already settled the subscription locally
        const isSubSettled = localStorage.getItem('customer_sub_settled');
        let list = (res.data || []).map((sub) => {
          if (isSubSettled === 'true' && sub.status === 'PAST_DUE') {
            return {
              ...sub,
              status: 'ACTIVE' as const,
              updated_at: new Date().toISOString(),
            };
          }
          return sub;
        });

        // Ensure the active add-on plan is present for the customer
        if (!list.some((s) => s.subscription_code === 'sub_pro_003')) {
          list.push({
            id: 's3333333-3333-3333-3333-333333333333',
            customer_id: 'c1111111-1111-1111-1111-111111111111',
            subscription_code: 'sub_pro_003',
            plan_name: 'Pro Team Tier (Autonomous Add-on)',
            billing_cycle: 'MONTHLY',
            amount: 12500,
            currency: 'INR',
            status: 'ACTIVE',
            next_billing_at: new Date(Date.now() + 20 * 86400000).toISOString(),
            grace_period_ends_at: null,
            dunning_stage: 0,
            created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        setSubscriptions(list);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();

    // Check saved payment methods from localStorage
    const upi = localStorage.getItem('customer_recovery_upi_active');
    const upiId = localStorage.getItem('customer_recovery_upi_id');
    if (upi === 'true') {
      setSavedUpiActive(true);
      if (upiId) setSavedUpiId(upiId);
    }

    const card = localStorage.getItem('customer_recovery_card_active');
    const cardNum = localStorage.getItem('customer_recovery_card_number');
    if (card === 'true') {
      setSavedCardActive(true);
      if (cardNum) setSavedCardLast4(cardNum.replace(/\s+/g, '').slice(-4));
    }
  }, []);

  // 1-Click Razorpay Settlement for Overdue Subscription
  const handleSettleSubscription = async (sub: SubscriptionRecord) => {
    setIsSettlingId(sub.id);
    try {
      const orderRes = await api.createPaymentOrder({
        amount: sub.amount,
        invoiceNumber: `SUB-RENEWAL-${sub.subscription_code.toUpperCase()}`,
      });

      const keyId = orderRes?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TUF0VPxV9XuQeb';
      const orderId = orderRes?.order?.id?.startsWith('order_') ? orderRes.order.id : undefined;

      const options = {
        key: keyId,
        amount: Math.round(sub.amount * 100), // in paise
        currency: 'INR',
        name: 'Apex Growth Labs',
        description: `Annual Renewal - ${sub.plan_name} (${formatCurrency(sub.amount)})`,
        image: 'https://cdn.razorpay.com/static/assets/logo/rzp.svg',
        order_id: orderId,
        prefill: {
          name: 'Rohan Sharma',
          email: 'customer@example.com',
          contact: '+919123456789',
        },
        notes: {
          subscription_code: sub.subscription_code,
          plan_name: sub.plan_name,
          type: 'SUBSCRIPTION_RENEWAL',
        },
        theme: {
          color: '#0D94FB',
          backdrop_color: 'rgba(12, 38, 81, 0.7)',
        },
        modal: {
          ondismiss: () => {
            setIsSettlingId(null);
          },
        },
        handler: async (response: any) => {
          setIsSettlingId(null);
          const txn = response.razorpay_payment_id || `pay_sub_${Date.now().toString(36)}`;

          await api.verifySettlement({
            paymentId: txn,
            orderId: response.razorpay_order_id,
            invoiceNumber: `SUB-RENEWAL-${sub.subscription_code.toUpperCase()}`,
            amount: sub.amount,
            method: 'Razorpay Subscription Checkout',
          });

          localStorage.setItem('customer_sub_settled', 'true');
          setSubscriptions((prev) =>
            prev.map((s) => (s.id === sub.id ? { ...s, status: 'ACTIVE' as const } : s))
          );
          if (selectedSub && selectedSub.id === sub.id) {
            setSelectedSub((prev) => (prev ? { ...prev, status: 'ACTIVE' as const } : null));
          }

          setSuccessToast(`⚡ ${sub.plan_name} renewal successfully settled! Status restored to ACTIVE.`);
          setTimeout(() => setSuccessToast(null), 5000);
        },
      };

      let rzpConstructor = (window as any).Razorpay;
      if (!rzpConstructor) {
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
          console.error('Subscription payment failed:', failResp.error);
          setIsSettlingId(null);
        });
        rzp.open();
      } else {
        setSuccessToast('Connecting to payment gateway... Please click Pay again in a moment.');
        setIsSettlingId(null);
      }
    } catch (err: any) {
      console.error('Subscription settlement error:', err);
      setIsSettlingId(null);
    }
  };

  // Early Renewal with 5% Loyalty Discount for Active Subscriptions
  const handleEarlyRenewal = async (sub: SubscriptionRecord) => {
    setIsSettlingId(sub.id);
    const discountedAmount = Math.round(sub.amount * 0.95); // 5% loyalty discount (₹22,800)
    try {
      const orderRes = await api.createPaymentOrder({
        amount: discountedAmount,
        invoiceNumber: `SUB-EARLY-${sub.subscription_code.toUpperCase()}`,
      });

      const keyId = orderRes?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TUF0VPxV9XuQeb';
      const orderId = orderRes?.order?.id?.startsWith('order_') ? orderRes.order.id : undefined;

      const options = {
        key: keyId,
        amount: Math.round(discountedAmount * 100),
        currency: 'INR',
        name: 'Apex Growth Labs',
        description: `Early Subscription Extension - ${sub.plan_name} (5% Loyalty Discount: ₹1,200 Off)`,
        image: 'https://cdn.razorpay.com/static/assets/logo/rzp.svg',
        order_id: orderId,
        prefill: {
          name: 'Rohan Sharma',
          email: 'customer@example.com',
          contact: '+919123456789',
        },
        notes: {
          subscription_code: sub.subscription_code,
          plan_name: sub.plan_name,
          discount_saved: '₹1,200',
          type: 'EARLY_RENEWAL',
        },
        theme: {
          color: '#0D94FB',
          backdrop_color: 'rgba(12, 38, 81, 0.7)',
        },
        modal: {
          ondismiss: () => {
            setIsSettlingId(null);
          },
        },
        handler: async (response: any) => {
          setIsSettlingId(null);
          const txn = response.razorpay_payment_id || `pay_early_${Date.now().toString(36)}`;

          await api.verifySettlement({
            paymentId: txn,
            orderId: response.razorpay_order_id,
            invoiceNumber: `SUB-EARLY-${sub.subscription_code.toUpperCase()}`,
            amount: discountedAmount,
            method: 'Razorpay Early Renewal (Loyalty Discount)',
          });

          // Extend next_billing_at by 1 full year
          const nextYear = new Date();
          nextYear.setFullYear(nextYear.getFullYear() + 1);

          setSubscriptions((prev) =>
            prev.map((s) =>
              s.id === sub.id
                ? { ...s, status: 'ACTIVE' as const, next_billing_at: nextYear.toISOString() }
                : s
            )
          );
          if (selectedSub && selectedSub.id === sub.id) {
            setSelectedSub((prev) =>
              prev ? { ...prev, status: 'ACTIVE' as const, next_billing_at: nextYear.toISOString() } : null
            );
          }

          setSuccessToast(`🎉 ${sub.plan_name} successfully extended until ${formatDate(nextYear.toISOString())}! Saved ₹1,200.`);
          setTimeout(() => setSuccessToast(null), 6000);
        },
      };

      let rzpConstructor = (window as any).Razorpay;
      if (!rzpConstructor) {
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
          console.error('Early renewal payment failed:', failResp.error);
          setIsSettlingId(null);
        });
        rzp.open();
      } else {
        setSuccessToast('Connecting to payment gateway... Please click again in a moment.');
        setIsSettlingId(null);
      }
    } catch (err: any) {
      console.error('Early renewal error:', err);
      setIsSettlingId(null);
    }
  };

  // Reset demo state
  const handleResetDemo = () => {
    localStorage.removeItem('customer_sub_settled');
    loadSubscriptions();
    setSuccessToast('Demo state reset: Subscription restored to Past Due for testing.');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  if (isLoading && subscriptions.length === 0) {
    return <LoadingState message="Loading your subscription plans..." light />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadSubscriptions} light />;
  }

  const pastDueSub = subscriptions.find((s) => s.status === 'PAST_DUE');

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

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading text-[#0C2651] tracking-tight">My Subscriptions</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#0D94FB]">
              <Layers className="h-3 w-3" />
              {subscriptions.length} Registered Plans
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage recurring billing plans, update payment instruments &amp; avoid service interruptions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const currentSettled = localStorage.getItem('customer_sub_settled') === 'true';
              if (currentSettled) {
                localStorage.removeItem('customer_sub_settled');
                loadSubscriptions();
                setSuccessToast('Demo Mode: Scale Plan set to Past Due (Grace Period).');
              } else {
                localStorage.setItem('customer_sub_settled', 'true');
                loadSubscriptions();
                setSuccessToast('Demo Mode: Scale Plan restored to 100% ACTIVE.');
              }
              setTimeout(() => setSuccessToast(null), 4000);
            }}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-[#0D94FB] hover:bg-blue-100 transition shadow-xs cursor-pointer"
            title="Toggle between Active and Past Due states for Scale Plan"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Toggle Active / Past Due</span>
          </button>

          <button
            onClick={() => setShowUpgradeModal(true)}
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0C2651] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#13356e] transition shadow-blade-sm cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0D94FB]" />
            Explore All Plans
          </button>
        </div>
      </div>

      {/* URGENT ACTION BANNER: If Subscription is PAST_DUE */}
      {pastDueSub && (
        <div className="relative overflow-hidden rounded-[4px] border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/50 to-white p-4 shadow-blade-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] bg-amber-500 text-white shadow-xs">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    ⚠️ Action Required: Subscription In Grace Period
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 font-mono">
                    PAST DUE
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-[#0C2651]">
                  Your {pastDueSub.plan_name} renewal of {formatCurrency(pastDueSub.amount)} is overdue.
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Your account is protected under a 7-day grace period (<strong className="text-amber-900">{getGracePeriodInfo(pastDueSub).remainingDays} days remaining</strong> before account lock). Settle now to prevent service disruption.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSettleSubscription(pastDueSub)}
                disabled={isSettlingId === pastDueSub.id}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0C2651] hover:bg-[#123670] px-3.5 py-2 text-xs font-bold text-white shadow-blade-sm transition cursor-pointer disabled:opacity-50"
              >
                {isSettlingId === pastDueSub.id ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                )}
                Pay Overdue {formatCurrency(pastDueSub.amount)}
              </button>

              <button
                onClick={() => setSelectedSub(pastDueSub)}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100/50 shadow-xs transition cursor-pointer"
              >
                <Info className="h-3.5 w-3.5" />
                View Details &amp; Diagnosis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEALTHY PLAN BANNER: If Subscription is ACTIVE */}
      {!pastDueSub && subscriptions.length > 0 && (
        <div className="relative overflow-hidden rounded-[4px] border border-emerald-300 bg-gradient-to-r from-emerald-50/80 via-white to-blue-50/40 p-4 shadow-blade-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Subscription In Good Standing • AutoPay Active
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 font-mono">
                    ACTIVE
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-[#0C2651]">
                  All recurring billing is healthy and covered under NPCI AutoPay Mandate.
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on the active plan or <strong className="text-slate-700">Manage Plan</strong> to view cycle progress, renew early for a 5% discount, or modify linked instruments.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedSub(subscriptions[0])}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0C2651] hover:bg-[#123670] px-3.5 py-2 text-xs font-bold text-white shadow-blade-sm transition cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-[#0D94FB]" />
                Manage Active Plan
              </button>

              <button
                onClick={() => handleEarlyRenewal(subscriptions[0])}
                disabled={isSettlingId === subscriptions[0].id}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Zap className="h-3.5 w-3.5 text-emerald-600" />
                Renew Early (Save 5%)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3 Executive Overview Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ANNUAL COMMITTED ARR</span>
            <div className="rounded-[4px] bg-blue-50 p-2 text-[#0D94FB]">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#0C2651]">
            {formatCurrency(subscriptions.reduce((acc, s) => acc + s.amount, 0))}
          </div>
          <p className="mt-1 text-xs text-slate-500">1 active enterprise plan billing annually</p>
        </div>

        <div
          onClick={() => {
            const activePlan = subscriptions.find((s) => s.status === 'ACTIVE') || subscriptions[0];
            if (activePlan) setSelectedSub(activePlan);
          }}
          className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/10 transition group"
          title="Click to manage linked Active subscription & AutoPay"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">LINKED AUTOPAY RAIL</span>
            <div className="rounded-[4px] bg-emerald-50 p-2 text-emerald-600 group-hover:scale-110 transition-transform">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-slate-800 flex items-center gap-2">
            <span>{savedUpiActive ? 'Razorpay UPI AutoPay' : 'HDFC Corporate Card'}</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ACTIVE
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            {savedUpiActive ? `VPA: ${savedUpiId}` : `Card Ending in 4012 (TokenHQ)`}
          </p>
          <div className="mt-2 text-[11px] text-[#0D94FB] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <span>Manage Plan Console &rarr;</span>
          </div>
        </div>

        <div
          onClick={() => {
            if (pastDueSub) setSelectedSub(pastDueSub);
            else if (subscriptions[0]) setSelectedSub(subscriptions[0]);
          }}
          className={cn(
            "rounded-[4px] border p-4 shadow-blade-sm cursor-pointer transition group",
            pastDueSub ? "border-amber-200 bg-amber-50/20 hover:border-amber-400" : "border-emerald-200 bg-emerald-50/20 hover:border-emerald-400"
          )}
          title="Click to view plan diagnosis & dunning status"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RENEWAL STATUS</span>
            <div className={cn("rounded-[4px] p-2 group-hover:scale-110 transition-transform", pastDueSub ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
              {pastDueSub ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
          </div>
          <div className="mt-2 text-base font-bold font-mono text-slate-900">
            {pastDueSub ? 'Grace Period (Dunning Stage 2)' : '100% In Good Standing'}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {pastDueSub ? 'Settle pending balance to maintain license' : 'Next auto-debit scheduled on time'}
          </p>
          <div className="mt-2 text-[11px] text-slate-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <span>{pastDueSub ? 'View Overdue Diagnosis \u2192' : 'View Plan Health \u2192'}</span>
          </div>
        </div>
      </div>

      {/* Subscriptions Interactive Table with Filter Tabs */}
      <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-blade-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab('ALL')}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                filterTab === 'ALL'
                  ? "bg-[#0C2651] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              All Plans ({subscriptions.length})
            </button>
            <button
              onClick={() => setFilterTab('ACTIVE')}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                filterTab === 'ACTIVE'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
              )}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Active ({subscriptions.filter((s) => s.status === 'ACTIVE').length})
            </button>
            <button
              onClick={() => setFilterTab('PAST_DUE')}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                filterTab === 'PAST_DUE'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200"
              )}
            >
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Past Due ({subscriptions.filter((s) => s.status === 'PAST_DUE').length})
            </button>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span>Click on any plan row or status badge to open management console</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Plan Name &amp; Code</th>
                <th className="py-3 px-4">Billing Amount</th>
                <th className="py-3 px-4">Billing Cycle</th>
                <th className="py-3 px-4">Renewal Date</th>
                <th className="py-3 px-4">Status &amp; Management</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {subscriptions
                .filter((item) => {
                  if (filterTab === 'ACTIVE') return item.status === 'ACTIVE';
                  if (filterTab === 'PAST_DUE') return item.status === 'PAST_DUE';
                  return true;
                })
                .map((item) => {
                const isPastDue = item.status === 'PAST_DUE';
                const isActive = item.status === 'ACTIVE';

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedSub(item)}
                    className={cn(
                      'hover:bg-blue-50/50 transition cursor-pointer group',
                      isPastDue && 'bg-amber-50/20'
                    )}
                  >
                    {/* Plan Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0C2651] group-hover:text-[#0D94FB] transition-colors text-sm">
                        {item.plan_name}
                      </div>
                      <div className="font-mono text-[11px] text-[#0D94FB] font-semibold mt-0.5">
                        {item.subscription_code}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(item.amount)}
                    </td>

                    {/* Billing Cycle */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700 uppercase font-semibold">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {item.billing_cycle}
                      </span>
                    </td>

                    {/* Renewal Date */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div>{formatDate(item.next_billing_at)}</div>
                      {isPastDue ? (
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                          {getGracePeriodInfo(item).label}
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          Auto-debit scheduled
                        </div>
                      )}
                    </td>

                    {/* Status Badge - CLICKABLE & ANIMATED */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSub(item);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-[4px] transition hover:scale-105"
                        title="Click to open subscription console"
                      >
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE
                          </span>
                        ) : (
                          <StatusBadge status={item.status} size="sm" light />
                        )}
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>

                    {/* Action Controls */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPastDue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSettleSubscription(item);
                            }}
                            disabled={isSettlingId === item.id}
                            className="inline-flex items-center gap-1 rounded-[4px] bg-[#0C2651] hover:bg-[#13356e] px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                            title="Instant Razorpay Checkout Settlement"
                          >
                            {isSettlingId === item.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin text-white" />
                            ) : (
                              <Zap className="h-3 w-3 text-emerald-400" />
                            )}
                            Pay Past Due ⚡
                          </button>
                        )}

                        {isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEarlyRenewal(item);
                            }}
                            disabled={isSettlingId === item.id}
                            className="inline-flex items-center gap-1 rounded-[4px] border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 shadow-xs transition cursor-pointer disabled:opacity-50"
                            title="Renew for next year now and save 5%"
                          >
                            {isSettlingId === item.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin text-emerald-700" />
                            ) : (
                              <Zap className="h-3 w-3 text-emerald-600" />
                            )}
                            Renew Early ⚡
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSub(item);
                          }}
                          className="inline-flex items-center gap-1 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                        >
                          Manage Plan
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUpgradeModal(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-[4px] border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2 py-1 text-[11px] font-semibold text-[#0D94FB] shadow-xs transition cursor-pointer"
                        >
                          Change Tier
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUBSCRIPTION MANAGEMENT CONSOLE (ACTIVE & PAST DUE)                    */}
      {/* ========================================================================= */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-[8px] border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0C2651] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#0D94FB] text-white">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight font-heading">
                    {selectedSub.status === 'ACTIVE' ? 'Active Subscription Console' : 'Subscription Diagnosis & Recovery'}
                  </h3>
                  <div className="text-[11px] text-blue-200 font-mono">
                    Plan Code: {selectedSub.subscription_code} • Apex Growth Labs
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="rounded-full p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* STATUS SPECIFIC EXECUTIVE HERO CARD */}
              {selectedSub.status === 'ACTIVE' ? (
                <div className="rounded-[6px] border border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-white to-blue-50/40 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 font-mono">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE • In Good Standing
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Auto-Renewal Enabled
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-emerald-100 text-xs">
                    <div>
                      <span className="text-slate-500">Committed Amount:</span>
                      <div className="font-bold font-mono text-slate-900 text-base">
                        {formatCurrency(selectedSub.amount)} / {selectedSub.billing_cycle.toLowerCase()}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Next Scheduled Renewal:</span>
                      <div className="font-bold font-mono text-emerald-800 text-base">
                        {formatDate(selectedSub.next_billing_at)}
                      </div>
                    </div>
                  </div>

                  {/* Billing Cycle Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Cycle Period: 23 Aug 2025</span>
                      <span className="font-semibold text-slate-700">78% Completed</span>
                      <span>Renews: {formatDate(selectedSub.next_billing_at)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[78%]" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[6px] border border-amber-300 bg-amber-50/80 p-4 space-y-2.5 text-amber-900 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span>Subscription In Grace Period (Past Due)</span>
                    </div>
                    <span className="rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 font-mono">
                      {getGracePeriodInfo(selectedSub).remainingDays} DAYS REMAINING
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-800">
                    The {selectedSub.billing_cycle.toLowerCase()} recurring renewal of <strong>{formatCurrency(selectedSub.amount)}</strong> attempted on your corporate credit card failed with code: <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200 font-bold">CARD_LIMIT_EXCEEDED</code>.
                  </p>
                  <div className="rounded bg-white p-2.5 border border-amber-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Dunning Recovery Stage:</span>
                      <span className="font-bold font-mono text-amber-900">Stage {selectedSub.dunning_stage || 2} of 3 (Autonomous Sweep Active)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Grace Period Cutoff:</span>
                      <span className="font-bold font-mono text-rose-700">
                        {getGracePeriodInfo(selectedSub).cutoffDateStr} (Service Locks in {getGracePeriodInfo(selectedSub).remainingDays} Days)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* LINKED AUTOPAY & PAYMENT INSTRUMENT CARD */}
              <div className="rounded-[6px] border border-slate-200 bg-slate-50/70 p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <CreditCard className="h-4 w-4 text-[#0D94FB]" />
                    <span>Linked Billing Instrument &amp; AutoPay Mandate</span>
                  </div>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 font-mono">
                    NPCI e-Mandate Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white rounded p-2.5 border border-slate-200 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400">Payment Instrument:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {savedUpiActive ? 'Razorpay UPI AutoPay' : 'HDFC Corporate Visa'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Identifier / UMN:</span>
                    <div className="font-semibold text-[#0D94FB] mt-0.5">
                      {savedUpiActive ? savedUpiId : `TokenHQ •••• ${savedCardLast4}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Max Debit Limit: <strong>₹1,00,000 / cycle</strong></span>
                  <button
                    onClick={() => {
                      setSelectedSub(null);
                      navigate('/customer/recovery');
                    }}
                    className="text-[#0D94FB] font-bold hover:underline cursor-pointer"
                  >
                    Change Instrument / Switch Rail &rarr;
                  </button>
                </div>
              </div>

              {/* INCLUDED PLAN FEATURES & ENTITLEMENTS */}
              <div className="rounded-[6px] border border-slate-200 bg-white p-3.5 text-xs space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Included Plan Entitlements &amp; Performance</span>
                  <span className="text-emerald-600 font-mono text-[11px]">94.2% AI Recovery Rate</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Unlimited recovery transaction inflow</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Smart WhatsApp &amp; SMS rescue dispatch</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Dynamic 5% prompt discount engine</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>99.99% Enterprise Uptime SLA guarantee</span>
                  </div>
                </div>
              </div>

              {/* PRIMARY LIFECYCLE ACTIONS */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                {/* 1. PAST DUE ACTION: Settle Now */}
                {selectedSub.status === 'PAST_DUE' && (
                  <button
                    onClick={() => handleSettleSubscription(selectedSub)}
                    disabled={isSettlingId === selectedSub.id}
                    className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-[#0C2651] hover:bg-[#123670] py-2.5 text-xs font-bold text-white shadow-blade-sm transition cursor-pointer disabled:opacity-50"
                  >
                    {isSettlingId === selectedSub.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    <span>Settle Overdue Balance {formatCurrency(selectedSub.amount)} (Razorpay Official Checkout)</span>
                  </button>
                )}

                {/* 2. ACTIVE ACTION: Early Renewal with 5% Discount */}
                {selectedSub.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleEarlyRenewal(selectedSub)}
                    disabled={isSettlingId === selectedSub.id}
                    className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-gradient-to-r from-[#0C2651] to-[#123670] hover:from-[#123670] hover:to-[#0C2651] py-2.5 text-xs font-bold text-white shadow-blade-sm transition cursor-pointer disabled:opacity-50"
                  >
                    {isSettlingId === selectedSub.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    <span>Renew Early For Next Year &amp; Save 5% ({formatCurrency(Math.round(selectedSub.amount * 0.95))})</span>
                  </button>
                )}

                {/* 3. Secondary Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedSub(null);
                      setShowUpgradeModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-[4px] border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 py-2 text-xs font-semibold text-[#0D94FB] transition cursor-pointer"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Change Plan Tier</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedSub(null);
                      navigate('/customer/invoices');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition cursor-pointer"
                  >
                    <Receipt className="h-3.5 w-3.5 text-slate-500" />
                    <span>View Tax Receipts</span>
                  </button>
                </div>

                {/* 4. Self-Service Pause & Cancel Links */}
                <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-slate-400">
                  <button
                    onClick={() => setShowPauseModal(true)}
                    className="hover:text-amber-600 transition flex items-center gap-1 cursor-pointer"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    <span>Pause Subscription</span>
                  </button>

                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Cancel Subscription</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CHANGE PLAN / UPGRADE TIER MODAL                                       */}
      {/* ========================================================================= */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-[8px] border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0C2651] px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-tight font-heading">
                  SaaS Subscription Plans &amp; Tiers
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Select an optimal subscription tier for your enterprise recovery requirements
                </p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Plan Tier Grid */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {AVAILABLE_PLANS.map((plan) => {
                const isCurrent = plan.id === 'scale';

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'rounded-[6px] border p-4 flex flex-col justify-between transition-all relative',
                      isCurrent
                        ? 'border-[#0D94FB] bg-blue-50/40 ring-1 ring-[#0D94FB]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    )}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-[#0D94FB] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                        Current Plan
                      </span>
                    )}

                    <div>
                      <h4 className="font-bold text-sm text-[#0C2651] font-heading">{plan.name}</h4>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-bold font-mono text-slate-900">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-xs text-slate-500">/ {plan.cycle}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{plan.description}</p>

                      <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full rounded-[4px] bg-slate-100 py-2 text-xs font-bold text-slate-500 cursor-not-allowed text-center"
                        >
                          Active Subscription
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowUpgradeModal(false);
                            setSuccessToast(`Plan change request for ${plan.name} submitted successfully!`);
                            setTimeout(() => setSuccessToast(null), 4000);
                          }}
                          className="w-full rounded-[4px] bg-[#0C2651] hover:bg-[#13356e] py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer text-center"
                        >
                          Switch to {plan.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PAUSE SUBSCRIPTION MODAL                                               */}
      {/* ========================================================================= */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[8px] border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0C2651] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-sm tracking-tight font-heading">
                  Pause Subscription (Holiday Mode)
                </h3>
              </div>
              <button
                onClick={() => setShowPauseModal(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Take a temporary break without losing your settings or recovery analytics. Your billing will pause and automatically resume after the selected period.
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Select Pause Duration:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: '1', label: '1 Month' },
                    { val: '2', label: '2 Months' },
                    { val: '3', label: '3 Months' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setPauseDuration(opt.val)}
                      className={cn(
                        'py-2 rounded border text-xs font-bold transition cursor-pointer',
                        pauseDuration === opt.val
                          ? 'border-[#0D94FB] bg-blue-50 text-[#0D94FB]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded bg-amber-50 border border-amber-200 p-3 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  <span>Resume Anytime</span>
                </div>
                <p>You can unpause and re-activate your autonomous recovery engine at any moment from this console.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowPauseModal(false)}
                  className="flex-1 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowPauseModal(false);
                    setSuccessToast(`Subscription paused for ${pauseDuration} month(s). Billing suspended.`);
                    setTimeout(() => setSuccessToast(null), 5000);
                  }}
                  className="flex-1 rounded-[4px] bg-amber-600 hover:bg-amber-700 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Confirm Pause
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CANCEL SUBSCRIPTION MODAL (WITH RETENTION OFFER)                       */}
      {/* ========================================================================= */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[8px] border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#0C2651] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-400" />
                <h3 className="font-bold text-sm tracking-tight font-heading">
                  Cancel Subscription
                </h3>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Retention Special Offer Banner */}
              <div className="rounded-[6px] border border-[#0D94FB]/40 bg-gradient-to-r from-[#E6F4FE] via-white to-blue-50 p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#0C2651]">
                  <Sparkles className="h-4 w-4 text-[#0D94FB]" />
                  <span>Exclusive Retention Offer: 20% Off!</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Before you cancel, we want to help your cashflow. Stay on Scale Plan today and claim an instant <strong>20% discount</strong> on your next annual billing.
                </p>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSuccessToast('🎉 20% Retention Discount successfully applied to your Scale Plan!');
                    setTimeout(() => setSuccessToast(null), 5000);
                  }}
                  className="rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-3 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Claim 20% Off &amp; Keep Subscription
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Reason for cancellation:</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-700 outline-none focus:border-[#0D94FB]"
                >
                  <option value="pricing">Subscription price is too high</option>
                  <option value="features">Missing required payment integrations</option>
                  <option value="temporary">Temporary project completed</option>
                  <option value="competitor">Switching to another provider</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-[4px] bg-slate-100 hover:bg-slate-200 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSuccessToast('Cancellation scheduled. Your access remains active until the end of current cycle.');
                    setTimeout(() => setSuccessToast(null), 5000);
                  }}
                  className="flex-1 rounded-[4px] border border-rose-300 bg-rose-50 hover:bg-rose-100 py-2 text-xs font-bold text-rose-700 cursor-pointer"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
