import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { InvoiceRecord } from '../../types/database.types';
import {
  Receipt,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ShieldCheck,
  CreditCard,
  FileText,
  RotateCcw,
  Sparkles,
  Zap,
  RefreshCw,
  X,
  Building2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export const CustomerInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactivity State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'OVERDUE' | 'PAID'>('ALL');
  const [isSettlingId, setIsSettlingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getInvoices();
      if (res.success) {
        // Apply locally settled overrides for persistent demo
        const list = res.data.map((inv) => {
          const isSettled = localStorage.getItem(`inv_settled_${inv.id}`);
          if (isSettled === 'true' && inv.status === 'OVERDUE') {
            return {
              ...inv,
              status: 'PAID' as const,
              amount_paid: inv.amount,
              updated_at: new Date().toISOString(),
            };
          }
          return inv;
        });
        setInvoices(list);
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

  // Razorpay Checkout handler for instant invoice settlement
  const handlePayInvoice = async (inv: InvoiceRecord) => {
    setIsSettlingId(inv.id);
    try {
      const orderRes = await api.createPaymentOrder({
        amount: inv.amount,
        invoiceNumber: inv.invoice_number,
      });

      const keyId = orderRes?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TUF0VPxV9XuQeb';
      const orderId = orderRes?.order?.id?.startsWith('order_') ? orderRes.order.id : undefined;

      const options = {
        key: keyId,
        amount: Math.round(inv.amount * 100),
        currency: inv.currency || 'INR',
        name: 'Apex Growth Labs',
        description: `Official GST Tax Invoice Settlement - ${inv.invoice_number}`,
        image: 'https://cdn.razorpay.com/static/assets/logo/rzp.svg',
        order_id: orderId,
        prefill: {
          name: 'Rohan Sharma',
          email: 'customer@example.com',
          contact: '+919123456789',
        },
        notes: {
          invoice_number: inv.invoice_number,
          type: 'INVOICE_SETTLEMENT',
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
          const txn = response.razorpay_payment_id || `pay_inv_${Date.now().toString(36)}`;

          await api.verifySettlement({
            paymentId: txn,
            orderId: response.razorpay_order_id,
            invoiceNumber: inv.invoice_number,
            amount: inv.amount,
            method: 'Razorpay Official Checkout (Invoice Settlement)',
          });

          localStorage.setItem(`inv_settled_${inv.id}`, 'true');
          setInvoices((prev) =>
            prev.map((i) => (i.id === inv.id ? { ...i, status: 'PAID' as const, amount_paid: inv.amount } : i))
          );
          if (selectedInvoice && selectedInvoice.id === inv.id) {
            setSelectedInvoice((prev) => (prev ? { ...prev, status: 'PAID' as const, amount_paid: inv.amount } : null));
          }

          setSuccessToast(`🎉 Invoice ${inv.invoice_number} (₹${inv.amount.toLocaleString('en-IN')}) successfully settled via Razorpay!`);
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
          console.error('Invoice payment failed:', failResp.error);
          setIsSettlingId(null);
        });
        rzp.open();
      } else {
        setSuccessToast('Connecting to Razorpay gateway... Please click Pay again in a moment.');
        setIsSettlingId(null);
      }
    } catch (err: any) {
      console.error('Invoice settlement error:', err);
      setIsSettlingId(null);
    }
  };

  // Print/Download GST Invoice
  const handlePrintInvoice = (inv: InvoiceRecord) => {
    const baseAmount = Math.round(inv.amount / 1.18);
    const gstAmount = inv.amount - baseAmount;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GST Tax Invoice - ${inv.invoice_number}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; font-size: 13px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0D94FB; padding-bottom: 20px; margin-bottom: 24px; }
          .brand { font-size: 20px; font-weight: 800; color: #0C2651; }
          .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 4px; background: ${inv.status === 'PAID' ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .box { background: #f8fafc; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0; }
          .box h4 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
          th, td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
          th { background: #f1f5f9; font-weight: 700; color: #475569; font-size: 12px; }
          .text-right { text-align: right; }
          .totals { width: 300px; margin-left: auto; margin-top: 12px; }
          .totals td { padding: 6px 12px; }
          .grand-total { font-size: 16px; font-weight: 800; color: #0C2651; border-top: 2px solid #0C2651; border-bottom: 2px solid #0C2651; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Apex Growth Labs Private Limited</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 4px;">
              GSTIN: 29AABCA1234F1Z8 • HSN/SAC: 998313 (IT Software Services)<br/>
              Koramangala 4th Block, Bengaluru, Karnataka - 560034
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 700; color: #0D94FB; font-family: monospace;">${inv.invoice_number}</div>
            <div class="badge" style="margin-top: 6px;">${inv.status}</div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <h4>Billed To (Customer Details)</h4>
            <strong>Rohan Sharma</strong><br/>
            Apex Growth Labs Cloud Infrastructure Account<br/>
            Email: customer@example.com • Tel: +91 91234 56789<br/>
            GSTIN: Unregistered Consumer (B2C)
          </div>
          <div class="box">
            <h4>Invoice &amp; Settlement Details</h4>
            <strong>Issue Date:</strong> ${formatDate(inv.created_at)}<br/>
            <strong>Due Date:</strong> ${formatDate(inv.due_date)}<br/>
            <strong>Payment Gateway:</strong> Razorpay Official Settlement Rail<br/>
            <strong>Status:</strong> ${inv.status === 'PAID' ? 'Settled In Full via Razorpay' : 'Pending Payment / Overdue'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description / Service Item</th>
              <th>HSN Code</th>
              <th class="text-right">Taxable Value</th>
              <th class="text-right">IGST (18%)</th>
              <th class="text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Enterprise AI Revenue Recovery Subscription</strong><br/>
                <span style="font-size: 11px; color: #64748b;">Autonomous payment failure diagnosis &amp; WhatsApp/SMS dunning engine</span>
              </td>
              <td style="font-family: monospace;">998313</td>
              <td class="text-right" style="font-family: monospace;">₹${baseAmount.toLocaleString('en-IN')}</td>
              <td class="text-right" style="font-family: monospace;">₹${gstAmount.toLocaleString('en-IN')}</td>
              <td class="text-right" style="font-family: monospace; font-weight: 700;">₹${inv.amount.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Subtotal (Net):</td>
              <td class="text-right" style="font-family: monospace;">₹${baseAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Integrated GST @ 18%:</td>
              <td class="text-right" style="font-family: monospace;">₹${gstAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr class="grand-total">
              <td>Total Payable (INR):</td>
              <td class="text-right" style="font-family: monospace;">₹${inv.amount.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          This is a computer-generated official tax invoice under Section 31 of CGST Act. Digitally verified by RazorRecover AI.
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    }
  };

  // Toggle demo state for testing
  const handleToggleDemo = () => {
    const overdueInv = invoices.find((i) => i.status === 'OVERDUE');
    if (overdueInv) {
      localStorage.setItem(`inv_settled_${overdueInv.id}`, 'true');
      setSuccessToast(`Demo: Invoice ${overdueInv.invoice_number} set to PAID.`);
    } else {
      invoices.forEach((i) => localStorage.removeItem(`inv_settled_${i.id}`));
      setSuccessToast('Demo: Overdue invoices restored for testing.');
    }
    loadInvoices();
    setTimeout(() => setSuccessToast(null), 4000);
  };

  if (isLoading && invoices.length === 0) {
    return <LoadingState message="Loading your invoices..." light />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadInvoices} light />;
  }

  const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');
  const totalDueAmount = overdueInvoices.reduce((acc, i) => acc + i.amount, 0);
  const totalPaidAmount = paidInvoices.reduce((acc, i) => acc + i.amount, 0);
  const totalInvoiced = invoices.reduce((acc, i) => acc + i.amount, 0);

  const displayedInvoices = invoices.filter((item) => {
    if (filterTab === 'OVERDUE') return item.status === 'OVERDUE';
    if (filterTab === 'PAID') return item.status === 'PAID';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Success Toast */}
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
            <h1 className="text-2xl font-bold font-heading text-[#0C2651] tracking-tight">Invoices &amp; Statements</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#0D94FB]">
              <Receipt className="h-3 w-3" />
              {invoices.length} Invoices
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            View GST tax invoices, download financial statements &amp; settle pending balances via Razorpay
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleDemo}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-[#0D94FB] hover:bg-blue-100 transition shadow-xs cursor-pointer"
            title="Toggle between Overdue and Paid for demo testing"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Toggle Paid / Overdue Demo</span>
          </button>

          <button
            onClick={() => handlePrintInvoice(invoices[0] || ({ invoice_number: 'INV-STATEMENT-2026', amount: totalInvoiced, currency: 'INR', status: 'PAID', due_date: new Date().toISOString(), created_at: new Date().toISOString(), id: 'dummy', customer_id: 'c1', updated_at: new Date().toISOString() } as any))}
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0C2651] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#13356e] transition shadow-blade-sm cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#0D94FB]" />
            Export Statement PDF
          </button>
        </div>
      </div>

      {/* Top Warning Banner if Overdue Invoices exist */}
      {overdueInvoices.length > 0 && (
        <div className="relative overflow-hidden rounded-[4px] border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/50 to-white p-4 shadow-blade-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[4px] bg-amber-500 text-white shadow-xs">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    ⚠️ Pending Action: {overdueInvoices.length} Overdue Invoice ({formatCurrency(totalDueAmount)})
                  </span>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900 font-mono">
                    PAYMENT OVERDUE
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-[#0C2651]">
                  Invoice {overdueInvoices[0].invoice_number} of {formatCurrency(overdueInvoices[0].amount)} requires immediate settlement.
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Settle online via Razorpay Official Gateway (Cards, UPI, NetBanking) to receive your verified GST receipt.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handlePayInvoice(overdueInvoices[0])}
                disabled={isSettlingId === overdueInvoices[0].id}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0C2651] hover:bg-[#123670] px-4 py-2 text-xs font-bold text-white shadow-blade-sm transition cursor-pointer disabled:opacity-50"
              >
                {isSettlingId === overdueInvoices[0].id ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                )}
                Pay Now {formatCurrency(overdueInvoices[0].amount)} (Razorpay)
              </button>

              <button
                onClick={() => setSelectedInvoice(overdueInvoices[0])}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50 shadow-xs transition cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-amber-700" />
                View Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3 Executive Financial Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-blade-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TOTAL INVOICED VOLUME</span>
            <div className="rounded-[4px] bg-blue-50 p-2 text-[#0D94FB]">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#0C2651]">
            {formatCurrency(totalInvoiced)}
          </div>
          <p className="mt-1 text-xs text-slate-500">{invoices.length} lifetime generated tax invoices</p>
        </div>

        <div className={cn(
          "rounded-[4px] border p-4 shadow-blade-sm",
          totalDueAmount > 0 ? "border-amber-200 bg-amber-50/20" : "border-slate-200 bg-white"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PENDING DUE BALANCE</span>
            <div className={cn("rounded-[4px] p-2", totalDueAmount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>
              {totalDueAmount > 0 ? <Clock className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4 text-emerald-600" />}
            </div>
          </div>
          <div className={cn("mt-2 text-2xl font-bold font-mono", totalDueAmount > 0 ? "text-amber-950" : "text-slate-900")}>
            {formatCurrency(totalDueAmount)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {totalDueAmount > 0 ? `${overdueInvoices.length} overdue invoice requiring settlement` : 'All invoices settled in good standing'}
          </p>
        </div>

        <div className="rounded-[4px] border border-emerald-200 bg-emerald-50/20 p-4 shadow-blade-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PAID &amp; SETTLED</span>
            <div className="rounded-[4px] bg-emerald-100 p-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-800">
            {formatCurrency(totalPaidAmount)}
          </div>
          <p className="mt-1 text-xs text-slate-500">{paidInvoices.length} tax invoices settled with verified GST receipts</p>
        </div>
      </div>

      {/* Invoices Interactive Table with Filter Tabs */}
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
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setFilterTab('OVERDUE')}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                filterTab === 'OVERDUE'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200"
              )}
            >
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Overdue ({overdueInvoices.length})
            </button>
            <button
              onClick={() => setFilterTab('PAID')}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                filterTab === 'PAID'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
              )}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Paid / Settled ({paidInvoices.length})
            </button>
          </div>
          <div className="text-xs text-slate-400">
            Click on any row to open the complete GST tax invoice breakdown
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Description &amp; SAC</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Payment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedInvoices.map((item) => {
                const isOverdue = item.status === 'OVERDUE';
                const isPaid = item.status === 'PAID';

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedInvoice(item)}
                    className={cn(
                      'hover:bg-blue-50/50 transition cursor-pointer group',
                      isOverdue && 'bg-amber-50/15'
                    )}
                  >
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0D94FB] group-hover:underline">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.invoice_number}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {item.amount >= 50000 ? 'Enterprise Growth Revenue Defense Tier' : 'Annual Scale Plan Subscription'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">SAC: 998313 • 18% GST Applicable</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(item.amount)}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div>{formatDate(item.due_date)}</div>
                      {isOverdue && (
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                          Overdue by 14 days
                        </div>
                      )}
                      {isPaid && (
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          Settled via Razorpay
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" light />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isOverdue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayInvoice(item);
                            }}
                            disabled={isSettlingId === item.id}
                            className="inline-flex items-center gap-1 rounded-[4px] bg-[#0C2651] hover:bg-[#123670] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                            title="Instant Razorpay Checkout Popup"
                          >
                            {isSettlingId === item.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Zap className="h-3.5 w-3.5 text-emerald-400" />
                            )}
                            <span>Pay with Razorpay ⚡</span>
                          </button>
                        )}

                        {isPaid && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintInvoice(item);
                            }}
                            className="inline-flex items-center gap-1 rounded-[4px] border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs transition cursor-pointer"
                            title="Print or Download official GST receipt"
                          >
                            <Download className="h-3 w-3 text-emerald-600" />
                            <span>GST Receipt</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(item);
                          }}
                          className="inline-flex items-center gap-1 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                        >
                          View
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
      {/* INVOICE DETAILS & GST TAX BREAKDOWN MODAL                                 */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-[8px] border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0C2651] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-[#0D94FB] text-white shadow-xs">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight font-heading">
                    Tax Invoice Breakdown • {selectedInvoice.invoice_number}
                  </h3>
                  <div className="text-[11px] text-blue-200 font-mono">
                    Apex Growth Labs Pvt Ltd • GSTIN: 29AABCA1234F1Z8
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-full p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Header Bar */}
              <div className={cn(
                "rounded-[6px] border p-3.5 flex items-center justify-between",
                selectedInvoice.status === 'PAID'
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                  : "border-amber-300 bg-amber-50/80 text-amber-900"
              )}>
                <div className="flex items-center gap-2 font-bold">
                  {selectedInvoice.status === 'PAID' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Invoice Settled in Full via Razorpay</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>Invoice Overdue • Immediate Payment Required</span>
                    </>
                  )}
                </div>
                <span className="font-mono text-xs font-bold">
                  Due: {formatDate(selectedInvoice.due_date)}
                </span>
              </div>

              {/* B2B Entity Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[4px] border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#0D94FB]" />
                    <span>Issuer (Service Provider)</span>
                  </div>
                  <div className="font-semibold text-slate-900">Apex Growth Labs Pvt Ltd</div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    GSTIN: 29AABCA1234F1Z8<br/>
                    Bengaluru, Karnataka - 560034
                  </div>
                </div>

                <div className="rounded-[4px] border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-600" />
                    <span>Customer Details</span>
                  </div>
                  <div className="font-semibold text-slate-900">Rohan Sharma</div>
                  <div className="text-slate-500 text-[10px]">
                    customer@example.com<br/>
                    +91 91234 56789
                  </div>
                </div>
              </div>

              {/* Itemized Line Table */}
              <div className="rounded-[4px] border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">SAC</th>
                      <th className="py-2.5 px-3 text-right">Taxable</th>
                      <th className="py-2.5 px-3 text-right">GST (18%)</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">
                          {selectedInvoice.amount >= 50000 ? 'Enterprise Growth Revenue Defense Tier' : 'Annual Scale Plan Subscription'}
                        </div>
                        <div className="text-[10px] text-slate-400">Autonomous revenue defense &amp; dunning</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">998313</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        ₹{Math.round(selectedInvoice.amount / 1.18).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        ₹{(selectedInvoice.amount - Math.round(selectedInvoice.amount / 1.18)).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(selectedInvoice.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Summary Breakdown */}
              <div className="flex justify-end pt-1">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Base Value:</span>
                    <span className="font-mono">₹{Math.round(selectedInvoice.amount / 1.18).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Integrated GST @ 18%:</span>
                    <span className="font-mono">₹{(selectedInvoice.amount - Math.round(selectedInvoice.amount / 1.18)).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#0C2651] pt-1.5 border-t border-slate-200">
                    <span>Total Amount Payable:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Download GST PDF</span>
                </button>

                {selectedInvoice.status === 'OVERDUE' ? (
                  <button
                    onClick={() => {
                      setSelectedInvoice(null);
                      handlePayInvoice(selectedInvoice);
                    }}
                    disabled={isSettlingId === selectedInvoice.id}
                    className="inline-flex items-center gap-2 rounded-[4px] bg-[#0C2651] hover:bg-[#123670] px-4 py-2 text-xs font-bold text-white shadow-blade-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Pay {formatCurrency(selectedInvoice.amount)} (Razorpay Official)</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Paid &amp; Settled</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
