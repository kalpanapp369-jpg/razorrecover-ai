import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Shield,
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  Code2,
  Sparkles,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronDown,
  Building,
  HelpCircle,
  TrendingUp,
  Activity,
  ChevronRight,
  ChevronLeft,
  Play,
  Globe,
  Search,
  Check,
  Send,
  X,
  Sliders,
  Wallet,
  Receipt,
  Repeat,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  Phone,
  Smartphone,
  Lock,
  Headphones,
} from 'lucide-react';

type TabCategory = 'ai-native' | 'recovery' | 'agents' | 'guardrails' | 'telemetry' | 'payments';

export const Landing: React.FC = () => {
  // Active Category Tab
  const [activeTab, setActiveTab] = useState<TabCategory>('ai-native');

  // Carousel Scroll Reference
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Interactive ROI Calculator State
  const [monthlyRevenue, setMonthlyRevenue] = useState(5000000); // ₹50 Lakhs
  const [failureRate, setFailureRate] = useState(12); // 12%

  // Developer Code Snippet Tab
  const [codeLang, setCodeLang] = useState<'node' | 'python' | 'webhook' | 'curl'>('node');
  const [copied, setCopied] = useState(false);

  // Floating Ask RAY AI Assistant State
  const [showRayModal, setShowRayModal] = useState(false);
  const [rayMessages, setRayMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: "Hi! I'm RAY, Razorpay's intelligent fintech assistant. Ask me about autonomous revenue recovery, instant payouts, or smart business banking!",
    },
  ]);
  const [rayInput, setRayInput] = useState('');

  // Selected Feature for Know More Modal
  const [selectedFeatureModal, setSelectedFeatureModal] = useState<{
    id: string;
    badge: string;
    badgeColor: string;
    title: string;
    description: string;
    previewType: string;
  } | null>(null);

  // Scroll to solutions section
  const scrollToSolutions = () => {
    const section = document.getElementById('tab-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scrolling Showcase Feature Cards
  const showcaseCards = [
    {
      id: 'showcase-gemini',
      targetTab: 'ai-native' as TabCategory,
      tag: 'GEMINI 2.5 FLASH',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
      badge: 'Root Cause AI',
      icon: Bot,
      title: 'Autonomous Failure Diagnostics',
      subtitle: 'Instant LLM inference on failed gateway codes to recommend smart retry incentives.',
      visualType: 'gemini',
      metric: '420ms Inference',
    },
    {
      id: 'showcase-checkout',
      targetTab: 'agents' as TabCategory,
      tag: 'WHATSAPP CONVERSATIONAL',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      badge: 'Agent Studio',
      icon: Smartphone,
      title: 'KiranaCloud Smart Checkout',
      subtitle: 'Multi-turn agentic cart recovery with dynamic UPI intent & one-tap payments.',
      visualType: 'whatsapp',
      metric: '+41.2% Recovery Rate',
    },
    {
      id: 'showcase-mesh',
      targetTab: 'recovery' as TabCategory,
      tag: 'MULTI-AGENT MESH',
      tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      badge: 'Zero Dropped Carts',
      icon: Layers,
      title: 'Dynamic Gateway Fallback',
      subtitle: 'Real-time multi-rail routing between HDFC, ICICI, and Razorpay UPI rails.',
      visualType: 'mesh',
      metric: '87.5% Auto-Capture',
    },
    {
      id: 'showcase-guardrails',
      targetTab: 'guardrails' as TabCategory,
      tag: 'POLICY GUARD',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200/80',
      badge: '> ₹25k Threshold',
      icon: Shield,
      title: 'Enterprise Safety Gate',
      subtitle: 'Human-in-the-loop dual approval safeguards prevent unauthorized large refunds.',
      visualType: 'guardrails',
      metric: '100% Audit Verified',
    },
    {
      id: 'showcase-telemetry',
      targetTab: 'telemetry' as TabCategory,
      tag: 'LIVE TELEMETRY',
      tagColor: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
      badge: 'HMAC SHA-256',
      icon: Activity,
      title: 'Cryptographic Webhook Stream',
      subtitle: 'Millisecond event ingestion with cryptographically verified Razorpay webhooks.',
      visualType: 'telemetry',
      metric: '18ms End-to-End',
    },
    {
      id: 'showcase-yield',
      targetTab: 'payments' as TabCategory,
      tag: 'REVENUE YIELD',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200/80',
      badge: 'Live Ledger',
      icon: TrendingUp,
      title: 'Recovered Capital Analytics',
      subtitle: 'Real-time visibility into restored recurring revenue and failure trends.',
      visualType: 'yield',
      metric: '₹14.28L Restored',
    },
  ];

  // ROI Calculations
  const annualRevenue = monthlyRevenue * 12;
  const annualLostRevenue = annualRevenue * (failureRate / 100);
  const estimatedRecovered = annualLostRevenue * 0.875; // 87.5% recovery rate

  const codeSnippets = {
    node: `// Initialize Razorpay Unified Platform in Node.js
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create autonomous payment order with recovery safeguards
const order = await razorpay.orders.create({
  amount: 499900, // ₹4,999 in paise
  currency: 'INR',
  receipt: 'order_rcpt_102',
  notes: {
    plan: 'Scale Growth SaaS',
    autonomous_recovery: 'true',
    agentic_channel: 'WHATSAPP_HINGLISH',
  },
});`,
    webhook: `// Secure Webhook Ingestion & Cryptographic HMAC Verification
import crypto from 'crypto';

app.post('/api/webhooks/razorpay', (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature === expected && req.body.event === 'payment.failed') {
    // Instantly trigger Gemini AI root cause diagnostics & retry policy
    aiRecoveryEngine.handleFailure(req.body.payload.payment.entity);
  }
  res.status(200).json({ status: 'ok' });
});`,
    python: `# Python SDK: Google Gemini AI Root Cause Diagnostic
from google import genai
import os

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="""
    Analyze failed transaction telemetry:
    Gateway Error: CARD_DAILY_LIMIT_EXCEEDED
    Amount: INR 4,999.00
    Customer: Apex Growth Labs
    Recommend optimal recovery channel and discount incentive.
    """
)
print(response.text) # Structured Actionable Recovery Plan`,
    curl: `curl -X POST https://razorrecover.ai/api/cases/plan \\
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "case_id": "CASE-2026-0891",
    "action_type": "ALTERNATIVE_PAYMENT_METHOD",
    "channel": "WHATSAPP_HINGLISH",
    "discount_incentive_pct": 5
  }'`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[codeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendRay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rayInput.trim()) return;

    const userText = rayInput.trim();
    setRayMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setRayInput('');

    setTimeout(() => {
      let reply = "I've analyzed your inquiry with Razorpay's financial models. ";
      const lower = userText.toLowerCase();
      if (lower.includes('recover') || lower.includes('churn') || lower.includes('fail')) {
        reply += "Our AI agent detects failed transactions in under 5ms, predicts customer recovery odds, and sends localized Hinglish WhatsApp payment links with approved discounts.";
      } else if (lower.includes('payout') || lower.includes('instant')) {
        reply += "RazorpayX Instant Payouts route funds 24x7 directly via IMPS & UPI in under 1.8 seconds with automatic bank server load-balancing.";
      } else if (lower.includes('bank') || lower.includes('account')) {
        reply += "Smart Business Current Accounts feature automated sweep-in interest, zero-forex-markup corporate cards, and auto-tax reserves.";
      } else if (lower.includes('payroll') || lower.includes('salary')) {
        reply += "Razorpay Payroll automates 3-click salary runs, direct compliance filing for TDS, PF, PT, and instant Form 16 generation.";
      } else {
        reply += "Razorpay provides a unified finance stack spanning payments, instant payouts, smart banking, and autonomous revenue recovery.";
      }
      setRayMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    }, 600);
  };

  // 4 Rich Feature Cards per Category
  const categoryFeatures = {
    'ai-native': [
      {
        id: 'agentic-payments',
        badge: 'NEW',
        badgeColor: 'emerald',
        title: 'Agentic Payments',
        description: 'Turn every chat into a checkout with AI-native payment flows.',
        previewType: 'agentic-payments',
      },
      {
        id: 'agent-studio',
        badge: 'NEW',
        badgeColor: 'blue',
        title: 'Agent Studio',
        description: 'Delegate operational work to agents that get things done',
        previewType: 'agent-studio',
      },
      {
        id: 'ai-builders',
        badge: 'NO CODE',
        badgeColor: 'blue',
        title: 'Payments for AI Builders',
        description: 'One-click payment nodes for n8n, Replit, and Vercel workflows',
        previewType: 'ai-builders',
      },
      {
        id: 'agentic-banking',
        badge: 'AI NATIVE',
        badgeColor: 'emerald',
        title: 'Agentic Business Banking',
        description: 'Expertise of a world class finance team built in',
        previewType: 'agentic-banking',
      },
    ],
    payments: [
      {
        id: 'pay-gateway',
        badge: '100+ METHODS',
        badgeColor: 'blue',
        title: 'Standard & Custom Checkout',
        description: 'Seamless in-app checkout experience supporting Cards, UPI AutoPay, NetBanking, and Cardless EMI.',
        previewType: 'checkout',
      },
      {
        id: 'pay-turbo',
        badge: 'HIGH SPEED',
        badgeColor: 'emerald',
        title: 'Turbo UPI 1-Click Intent',
        description: 'Direct bank integration delivering 5x faster UPI checkouts and eliminating bank page drops completely.',
        previewType: 'turbo-upi',
      },
      {
        id: 'pay-global',
        badge: 'GLOBAL FX',
        badgeColor: 'blue',
        title: 'International Multi-Currency',
        description: 'Accept payments in 100+ foreign currencies with instant FX conversion and zero setup friction.',
        previewType: 'global-fx',
      },
      {
        id: 'pay-links',
        badge: 'NO CODE',
        badgeColor: 'emerald',
        title: 'Dynamic Smart Payment Links',
        description: 'Generate customizable payment links with automated WhatsApp & SMS reminders and partial payment support.',
        previewType: 'smart-links',
      },
    ],
    recovery: [
      {
        id: 'rec-copilot',
        badge: 'GEMINI AI',
        badgeColor: 'emerald',
        title: 'AI Root Cause Diagnostic',
        description: 'Google Gemini 2.5 Flash categorizes payment declines in under 5ms, distinguishing gateway errors from card limits.',
        previewType: 'copilot',
      },
      {
        id: 'rec-retry',
        badge: 'DYNAMIC',
        badgeColor: 'blue',
        title: 'Smart Adaptive Retry Engine',
        description: 'Predictive clearance schedule that avoids bank server peak outages and automatically resubmits at optimal times.',
        previewType: 'smart-retry',
      },
      {
        id: 'rec-dunning',
        badge: 'WHATSAPP',
        badgeColor: 'emerald',
        title: 'Localized Hinglish Dunning',
        description: 'Sends tailored WhatsApp recovery links with AI-approved incentive discounts to recover abandoned customer carts.',
        previewType: 'smart-links',
      },
      {
        id: 'rec-checkout',
        badge: 'FALLBACK',
        badgeColor: 'blue',
        title: 'Alternative Method Fallback',
        description: 'Instantly suggests seamless UPI or NetBanking alternatives when a credit or debit card payment fails.',
        previewType: 'checkout',
      },
    ],
    agents: [
      {
        id: 'agent-subs',
        badge: 'ACTIVE',
        badgeColor: 'emerald',
        title: 'Subscription Recovery Agent',
        description: 'Detects recurring mandate drop-offs and initiates self-healing auto-debit updates without user friction.',
        previewType: 'agent-studio',
      },
      {
        id: 'agent-drop',
        badge: 'REAL-TIME',
        badgeColor: 'blue',
        title: 'Revenue Drop Detector Agent',
        description: 'Monitors transaction telemetry across acquiring banks and alerts finance teams to anomalous payment failures.',
        previewType: 'telemetry',
      },
      {
        id: 'agent-capture',
        badge: 'AUTOMATED',
        badgeColor: 'emerald',
        title: 'Autonomous Auto-Capture Agent',
        description: 'Captures late-authorized transactions within policy tolerances, preventing manual settlement delays.',
        previewType: 'copilot',
      },
      {
        id: 'agent-rto',
        badge: 'SHIELD',
        badgeColor: 'blue',
        title: 'RTO & Dispute Shield Agent',
        description: 'Flags high-risk orders and drafts automated evidence responses for chargebacks and dispute claims.',
        previewType: 'smart-retry',
      },
    ],
    guardrails: [
      {
        id: 'guard-gate',
        badge: 'HITL GATED',
        badgeColor: 'emerald',
        title: 'Approval Gate > ₹25,000',
        description: 'Autonomous recovery operates strictly under ₹25k; high-value cases trigger mandatory Human-in-the-Loop approval.',
        previewType: 'guardrails',
      },
      {
        id: 'guard-signoff',
        badge: '2-TIER AUTH',
        badgeColor: 'blue',
        title: 'Maker-Checker Authorization',
        description: 'Multi-tier financial authorization requiring managerial sign-off on custom discounts and write-off policies.',
        previewType: 'maker-checker',
      },
      {
        id: 'guard-rules',
        badge: 'CUSTOM RULES',
        badgeColor: 'emerald',
        title: 'Dynamic Risk & Limit Engine',
        description: 'Set custom percentage thresholds for discounts, channel cooldowns, and maximum retry frequencies.',
        previewType: 'copilot',
      },
      {
        id: 'guard-audit',
        badge: 'COMPLIANCE',
        badgeColor: 'blue',
        title: 'Immutable Audit Trail',
        description: 'Every AI agent proposal, manual sign-off, and recovery transaction is permanently recorded in PostgreSQL.',
        previewType: 'telemetry',
      },
    ],
    telemetry: [
      {
        id: 'tel-webhook',
        badge: 'HMAC SHA-256',
        badgeColor: 'emerald',
        title: 'Cryptographic Webhook Ingestion',
        description: 'Verifies incoming Razorpay webhooks using SHA-256 HMAC cryptographic signatures before ingestion.',
        previewType: 'telemetry',
      },
      {
        id: 'tel-latency',
        badge: 'SUB-5MS',
        badgeColor: 'blue',
        title: 'High-Speed Event Processing',
        description: 'Processes payment.failed events in under 5ms, immediately handing off telemetry to the Gemini AI agent.',
        previewType: 'turbo-upi',
      },
      {
        id: 'tel-stream',
        badge: 'LIVE FEED',
        badgeColor: 'emerald',
        title: 'Real-Time Failure Telemetry',
        description: 'Live dashboard feed tracking error codes, bank responses, customer IDs, and recovery stage progressions.',
        previewType: 'copilot',
      },
      {
        id: 'tel-global',
        badge: 'MULTI-GATEWAY',
        badgeColor: 'blue',
        title: 'Global Gateway Health Monitor',
        description: 'Tracks bank gateway uptime, routing traffic to healthy corridors when specific banking nodes experience downtime.',
        previewType: 'global-fx',
      },
    ],
  };

  const tabsConfig = [
    { key: 'ai-native' as TabCategory, label: 'Build AI Native', badge: 'NEW' },
    { key: 'recovery' as TabCategory, label: 'AI Recovery Engine', badge: '87.5% YIELD' },
    { key: 'agents' as TabCategory, label: 'Agent Studio', badge: 'MULTI-AGENT' },
    { key: 'guardrails' as TabCategory, label: 'Policy Guardrails', badge: 'ENTERPRISE' },
    { key: 'telemetry' as TabCategory, label: 'Live Telemetry', badge: 'REAL-TIME' },
    { key: 'payments' as TabCategory, label: 'Smart Checkout', badge: '1-CLICK UPI' },
  ];

  // ScrollSpy for Stacked Cards on Scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 220;
      for (let i = tabsConfig.length - 1; i >= 0; i--) {
        const tab = tabsConfig[i];
        const el = document.getElementById(`category-${tab.key}`);
        if (el && el.offsetTop <= scrollPos) {
          setActiveTab(tab.key);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Real Project Showcase Cards for Auto-Scrolling Marquee
  const showcaseItems = [
    {
      id: 'showcase-gemini',
      tag: 'GEMINI 2.5 FLASH',
      tagColor: 'text-[#00C853] bg-emerald-50 border-emerald-200',
      title: 'AI Root Cause Diagnostic',
      subtitle: 'Categorizes card daily limits vs gateway server errors in <5ms',
      metric: '84% Recovery Confidence',
      badge: 'REC-2026-001',
      icon: Zap,
    },
    {
      id: 'showcase-checkout',
      tag: 'AGENTIC PAYMENTS',
      tagColor: 'text-[#0066FF] bg-blue-50 border-blue-200',
      title: 'KiranaCloud WhatsApp Checkout',
      subtitle: 'Conversational order for ₹220 with instant 1-click Razorpay intent',
      metric: 'Payment Completed ✓',
      badge: 'LIVE CHAT FLOW',
      icon: Bot,
    },
    {
      id: 'showcase-agents',
      tag: 'MULTI-AGENT MESH',
      tagColor: 'text-purple-600 bg-purple-50 border-purple-200',
      title: 'Autonomous Auto-Capture',
      subtitle: 'Subscription recovery, RTO shield & automated evidence response',
      metric: '5 Active Agents',
      badge: 'AGENT STUDIO',
      icon: Layers,
    },
    {
      id: 'showcase-guardrails',
      tag: 'RISK GOVERNANCE',
      tagColor: 'text-amber-600 bg-amber-50 border-amber-200',
      title: 'Approval Gate > ₹25,000',
      subtitle: 'Automated <₹25k, biometric 2-tier managerial sign-off for high value',
      metric: '100% Policy Compliant',
      badge: 'HITL GATED',
      icon: Shield,
    },
    {
      id: 'showcase-telemetry',
      tag: 'WEBHOOK INGESTION',
      tagColor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      title: 'HMAC SHA-256 Verified Bus',
      subtitle: 'Cryptographic event verification with 1.2ms end-to-end latency',
      metric: '200 OK • Verified',
      badge: 'LIVE STREAM',
      icon: Activity,
    },
    {
      id: 'showcase-yield',
      tag: 'FINANCIAL YIELD',
      tagColor: 'text-[#00C853] bg-emerald-50 border-emerald-200',
      title: 'Autonomous Recovery Engine',
      subtitle: 'Predictive clearance retry schedules & dynamic customer incentives',
      metric: '₹42,85,000 Recovered',
      badge: '+87.5% YIELD',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-[#0066FF]/15 selection:text-[#0066FF] relative">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Minimalist Brand Logo & Nav Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-1 group">
              <span className="text-[#0066FF] font-black text-2xl italic tracking-tighter">/</span>
              <span className="text-xl font-bold tracking-tight text-[#0C2651] font-heading">
                Razorpay
              </span>
            </Link>

            {/* Center: Horizontal Navigation Links - Project Related */}
            <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-[#556987]">
              <a
                href="#tab-section"
                onClick={() => setActiveTab('ai-native')}
                className={`transition-colors cursor-pointer ${
                  activeTab === 'ai-native' ? 'text-[#0066FF] font-semibold' : 'hover:text-[#1E293B]'
                }`}
              >
                Agentic Stack
              </a>
              <a
                href="#tab-section"
                onClick={() => setActiveTab('recovery')}
                className={`transition-colors cursor-pointer ${
                  activeTab === 'recovery' ? 'text-[#0066FF] font-semibold' : 'hover:text-[#1E293B]'
                }`}
              >
                Recovery Engine
              </a>
              <a
                href="#tab-section"
                onClick={() => setActiveTab('agents')}
                className={`transition-colors cursor-pointer ${
                  activeTab === 'agents' ? 'text-[#0066FF] font-semibold' : 'hover:text-[#1E293B]'
                }`}
              >
                Agent Studio
              </a>
              <a
                href="#tab-section"
                onClick={() => setActiveTab('guardrails')}
                className={`transition-colors cursor-pointer ${
                  activeTab === 'guardrails' ? 'text-[#0066FF] font-semibold' : 'hover:text-[#1E293B]'
                }`}
              >
                Policy Guardrails
              </a>
              <a
                href="#developer"
                className="hover:text-[#1E293B] transition-colors cursor-pointer"
              >
                Telemetry & SDK
              </a>
              <a
                href="#calculator"
                className="hover:text-[#1E293B] transition-colors cursor-pointer"
              >
                ROI Calculator
              </a>
            </nav>
          </div>

          {/* Right: Support icon, Flag dropdown, Login Outlined, and Solid Blue CTA */}
          <div className="flex items-center gap-3">
            {/* Customer Support Icon */}
            <button
              onClick={() => setShowRayModal(true)}
              title="Customer Support"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Headphones className="h-4 w-4" />
            </button>

            {/* India Flag dropdown */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-slate-200 text-xs font-semibold text-slate-700 bg-white shadow-2xs">
              <span>🇮🇳</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>

            {/* Outlined Login Button */}
            <Link
              to="/login"
              className="rounded-[4px] border border-[#0066FF] bg-white hover:bg-blue-50/60 px-4 py-1.5 text-xs font-semibold text-[#0066FF] transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
            >
              Login
            </Link>

            {/* Solid Blue Primary CTA Button */}
            <Link
              to="/signup"
              className="rounded-[4px] bg-[#0066FF] hover:bg-[#0252CD] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
            >
              <span>Sign Up</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-14 pb-12 lg:pt-18 lg:pb-16 text-center relative bg-[#F8FAFC] overflow-hidden">
        {/* Subtle decorative background gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-blue-100/40 via-blue-50/20 to-transparent blur-3xl pointer-events-none -z-10" />
        
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Top Status Capsule Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.03)] mb-6 animate-fadeIn">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]" />
            </span>
            <span className="text-xs font-bold text-[#0C2651] tracking-wide font-heading">RazorRecover AI Engine</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-[#0066FF] flex items-center gap-1">
              Autonomous Fintech Ops
              <Sparkles className="h-3 w-3" />
            </span>
          </div>

          {/* Prominent Hero Headline Matching Razorpay Official */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0C2651] font-heading leading-tight sm:leading-tight">
            The all in one <span className="text-[#00C853]">finance platform</span> <br />
            you’ve been looking for
          </h1>

          {/* Sophisticated Subtitle */}
          <p className="mt-4 text-sm sm:text-base text-[#556987] max-w-2xl mx-auto leading-relaxed">
            Autonomous revenue recovery, multi-agent payment workflows, and real-time telemetry built directly on Razorpay's trusted infrastructure.
          </p>

          {/* Hero Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fadeIn">
            <Link
              to="/signup"
              className="rounded-[6px] bg-[#0066FF] hover:bg-[#0252CD] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,102,255,0.28)] transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              onClick={scrollToSolutions}
              className="rounded-[6px] bg-white hover:bg-slate-50 text-[#0C2651] border border-slate-200/90 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-2xs transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Platform</span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* Continuous Auto-Scrolling Project Feature Showcase Marquee */}
          <div className="mt-10 relative overflow-hidden py-3 -mx-4 sm:-mx-6 lg:-mx-8 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div className="animate-marquee-infinite gap-4 items-stretch px-4">
              {[...showcaseCards, ...showcaseCards].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => {
                      setActiveTab(item.targetTab);
                      const el = document.getElementById('tab-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-[290px] sm:w-[320px] rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-[0_4px_20px_rgba(12,38,81,0.04)] hover:shadow-[0_12px_32px_rgba(0,102,255,0.14)] hover:border-[#0066FF]/50 transition-all duration-200 cursor-pointer group shrink-0 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.tagColor} tracking-wider uppercase font-mono`}>
                          {item.tag}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">
                          {item.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-[#0066FF] group-hover:bg-[#0066FF] group-hover:text-white transition-colors shadow-2xs">
                          <IconComp className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-[#0C2651] tracking-tight truncate group-hover:text-[#0066FF] transition-colors font-heading">
                          {item.title}
                        </h4>
                      </div>

                      <p className="text-[11px] text-[#556987] leading-relaxed line-clamp-2 mb-3">
                        {item.subtitle}
                      </p>

                      {/* Feature Interactive Micro-UI Canvas */}
                      <div className="mb-3">
                        {item.visualType === 'gemini' && (
                          <div className="rounded-lg bg-slate-900 p-2 text-[10px] font-mono text-slate-300 flex flex-col justify-between h-[82px] border border-slate-800">
                            <div className="flex items-center justify-between text-[9px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                                gemini-2.5-flash
                              </span>
                              <span className="text-emerald-400">98.4% conf</span>
                            </div>
                            <div className="truncate text-slate-200 font-medium">ERR: CARD_LIMIT_EXCEEDED</div>
                            <div className="text-[9px] text-blue-300 bg-blue-950/70 px-1.5 py-0.5 rounded border border-blue-800/60 truncate">
                              ↳ Action: Switch to UPI Intent + 5% off
                            </div>
                          </div>
                        )}

                        {item.visualType === 'whatsapp' && (
                          <div className="rounded-lg bg-[#EBF7EE] p-2 text-[10px] flex flex-col justify-between h-[82px] border border-emerald-200/70">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-800 flex items-center gap-1 text-[9px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> WhatsApp Agent
                              </span>
                              <span className="text-[8.5px] text-emerald-600 font-mono">10:42 AM</span>
                            </div>
                            <div className="bg-white rounded-md p-1.5 text-[9px] text-slate-700 shadow-2xs border border-emerald-100 truncate">
                              "Order #RC-9102 reserved. Tap to finish payment."
                            </div>
                            <div className="bg-emerald-600 text-white rounded text-center font-bold text-[9px] py-0.5 shadow-2xs">
                              Pay ₹4,749 (5% Discount) →
                            </div>
                          </div>
                        )}

                        {item.visualType === 'mesh' && (
                          <div className="rounded-lg bg-slate-50 p-2 text-[10px] flex flex-col justify-between h-[82px] border border-slate-200/90">
                            <div className="flex items-center justify-between text-[9px] text-slate-500">
                              <span className="font-bold text-slate-700">Multi-Rail Orchestrator</span>
                              <span className="text-emerald-600 font-mono font-bold">ACTIVE</span>
                            </div>
                            <div className="flex items-center justify-between gap-1 text-[8.5px] font-mono">
                              <span className="bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded">HDFC (Failed)</span>
                              <span className="text-slate-400">→</span>
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">ICICI UPI (200 OK)</span>
                            </div>
                            <div className="text-[9px] text-slate-500 flex justify-between">
                              <span>Zero-drop recovery</span>
                              <span className="font-bold text-[#0066FF]">87.5% captured</span>
                            </div>
                          </div>
                        )}

                        {item.visualType === 'guardrails' && (
                          <div className="rounded-lg bg-amber-50/70 p-2 text-[10px] flex flex-col justify-between h-[82px] border border-amber-200/80">
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="font-bold text-amber-900 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-amber-600" /> ₹25K Limit Rule
                              </span>
                              <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1 rounded">HITL Gate</span>
                            </div>
                            <div className="text-[9px] text-slate-700 font-mono bg-white p-1 rounded border border-amber-100 truncate">
                              Txn ₹85,000: Dual Sign Required
                            </div>
                            <div className="flex items-center justify-between text-[8.5px] text-emerald-700 font-medium">
                              <span>HMAC SHA-256</span>
                              <span className="font-bold">✓ Approved by Admin</span>
                            </div>
                          </div>
                        )}

                        {item.visualType === 'telemetry' && (
                          <div className="rounded-lg bg-cyan-950 p-2 text-[10px] font-mono text-cyan-200 flex flex-col justify-between h-[82px] border border-cyan-900">
                            <div className="flex items-center justify-between text-[8.5px] text-cyan-400">
                              <span>webhook.razorpay.com</span>
                              <span className="text-emerald-400 font-bold">18ms</span>
                            </div>
                            <div className="text-[9px] text-cyan-100 truncate">
                              event: payment.failed [SIG_VERIFIED]
                            </div>
                            <div className="flex items-center justify-between text-[8px] text-cyan-300/80 border-t border-cyan-900/80 pt-1">
                              <span>Ingested 12.4k/s</span>
                              <span className="text-cyan-400">99.99% Stream</span>
                            </div>
                          </div>
                        )}

                        {item.visualType === 'yield' && (
                          <div className="rounded-lg bg-purple-50/80 p-2 text-[10px] flex flex-col justify-between h-[82px] border border-purple-200/70">
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="font-bold text-purple-950">Recovered Capital</span>
                              <span className="text-emerald-600 font-bold">+34.2% YoY</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-extrabold text-[#0C2651] font-heading">₹14,28,500</span>
                              <span className="text-[8.5px] text-slate-500">of ₹16.32L lost</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-[#0066FF] to-[#00C853] h-full rounded-full w-[87.5%]" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Live Telemetry:</span>
                      <span className="font-bold text-[#00C853] font-mono">{item.metric}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. TABBED CATEGORY NAVIGATION SUB-BAR (STICKY) */}
      <section id="tab-section" className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Horizontal Scrollable Tabs */}
          <div className="flex items-center overflow-x-auto no-scrollbar space-x-1 sm:space-x-3 py-1">
            {tabsConfig.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    const el = document.getElementById(`category-${tab.key}`);
                    if (el) {
                      const yOffset = -120;
                      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className={`group relative whitespace-nowrap px-4 py-3.5 text-xs font-semibold transition-all duration-150 ease-out cursor-pointer ${
                    isActive
                      ? 'text-[#1E293B] font-bold'
                      : 'text-[#556987] hover:text-[#1E293B]'
                  }`}
                >
                  <span className="group-hover:text-[#1E293B] transition-colors">{tab.label}</span>
                  {/* Underline Indicator Bar */}
                  {isActive ? (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#00C853] transition-all duration-300" />
                  ) : (
                    <span className="absolute bottom-0 left-1/2 right-1/2 h-[3px] rounded-full bg-transparent group-hover:left-3 group-hover:right-3 group-hover:bg-slate-200 transition-all duration-200" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Side: Floating CTA Button */}
          <div className="hidden md:flex shrink-0 pl-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0066FF] hover:bg-[#0252CD] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. CONTENT CONTAINER CARDS (STICKY STACKING DECK ON SCROLL) */}
      <section id="solutions-deck" className="py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 pb-16">
          {tabsConfig.map((tab, tabIdx) => (
            <div
              key={tab.key}
              id={`category-${tab.key}`}
              style={{
                top: `${120 + tabIdx * 20}px`,
                zIndex: 10 + tabIdx,
              }}
              className="sticky rounded-[20px] border border-slate-200/90 bg-white p-6 sm:p-8 shadow-[0_-12px_36px_rgba(12,38,81,0.08)] transition-all duration-300"
            >
              {/* Category Header within stacked container */}
              <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] font-heading tracking-tight">
                    {tab.label}
                  </h2>
                  {tab.badge && (
                    <span className="bg-[#0C2651] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00C853] animate-pulse" />
                  <span>Layer 0{tabIdx + 1} of 0{tabsConfig.length}</span>
                </div>
              </div>

              {/* Grid System: 4-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                {(categoryFeatures[tab.key] || []).map((feat) => (
                  <div
                    key={feat.id}
                    className="group flex flex-col overflow-hidden rounded-[14px] border border-slate-200/90 bg-white transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
                  >
                    {/* Top Half: Visual Preview Canvas */}
                    <div className="h-64 sm:h-72 overflow-hidden relative border-b border-slate-100 flex items-center justify-center">
                      
                      {/* 1. Agentic Payments Mockup */}
                      {feat.previewType === 'agentic-payments' && (
                        <div className="w-full h-full bg-gradient-to-b from-[#EBF3FF] via-[#E2EDFF] to-[#D5E5FF] p-3 flex flex-col justify-end relative overflow-hidden">
                          {/* Ambient bottom glow */}
                          <div className="absolute -bottom-10 inset-x-0 h-28 bg-[#0066FF]/25 blur-xl pointer-events-none" />
                          
                          {/* Smartphone frame container */}
                          <div className="w-full max-w-[210px] mx-auto bg-white rounded-t-[18px] border border-blue-200/90 shadow-md pt-2.5 px-2.5 pb-2 -mb-5 relative z-10 flex flex-col">
                            {/* App Bar */}
                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-[#0066FF]">⌂</span>
                                <span className="text-[10px] font-bold text-[#1E293B] font-heading">kiranacloud</span>
                              </div>
                              <div className="h-2 w-2 rounded-full bg-[#0066FF]/20" />
                            </div>

                            {/* Chat Bot Title */}
                            <div className="text-center text-[7.5px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                              CHAT - BOT
                            </div>

                            {/* User Bubble 1 */}
                            <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-xl rounded-tr-none px-2 py-1 text-[8px] text-[#1E293B] max-w-[90%] ml-auto mb-1.5 shadow-2xs">
                              I want to make a Tomato Basil Sandwich
                            </div>

                            {/* Bot Bubble 2 with ingredient list */}
                            <div className="bg-white border border-slate-200/90 rounded-xl rounded-tl-none p-2 text-[7.5px] text-[#1E293B] space-y-1 mb-1.5 shadow-2xs">
                              <div className="font-semibold text-slate-700 text-[8px]">Order all required ingredients...</div>
                              <div className="space-y-0.5 text-slate-500 pl-1 border-l border-slate-200">
                                <div>• Sourdough Loaf (1 Loaf): <span className="font-semibold text-slate-800">₹150</span></div>
                                <div>• Tomatoes (500gms): <span className="font-semibold text-slate-800">₹40</span></div>
                                <div>• Fresh Basil (1 Bunch): <span className="font-semibold text-slate-800">₹30</span></div>
                              </div>
                              <div className="font-bold text-slate-800 pt-0.5">Total Amount: ₹220</div>
                              <div className="text-slate-600">Should I checkout with Razorpay?</div>
                            </div>

                            {/* User Quick Confirmation Bubble */}
                            <div className="bg-[#F8FAFC] border border-slate-200 rounded-full px-2.5 py-0.5 text-[8px] font-medium text-slate-700 ml-auto mb-1.5">
                              Yes, checkout.
                            </div>

                            {/* Payment Completed Status Pill */}
                            <div className="bg-white border border-blue-200 rounded-[6px] px-2 py-1 flex items-center gap-1.5 shadow-2xs mb-1.5">
                              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0066FF] text-white text-[8px] font-bold">✓</span>
                              <span className="text-[8px] font-bold text-[#1E293B]">Payment Completed</span>
                            </div>

                            {/* Input box */}
                            <div className="bg-slate-50 rounded-full border border-slate-200 px-2.5 py-0.5 flex items-center justify-between text-[7.5px] text-slate-400">
                              <span>Ask me anything...</span>
                              <span className="text-[#0066FF] font-bold">➔</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. Agent Studio Mockup */}
                      {feat.previewType === 'agent-studio' && (
                        <div className="w-full h-full bg-[#F6F8FA] p-4 flex flex-col justify-center items-center relative overflow-hidden">
                          {/* Blue radial glow in background */}
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,102,255,0.18)_0%,_transparent_70%)] pointer-events-none" />
                          <div className="absolute -bottom-8 inset-x-0 h-20 bg-[#0066FF]/20 blur-xl pointer-events-none" />

                          {/* Vertical stack of 5 agent pills */}
                          <div className="flex flex-col gap-2 w-full max-w-[240px] relative z-10">
                            {/* 1. Subscription Recovery */}
                            <div className="bg-white/95 border border-slate-200/90 rounded-full px-3 py-1.5 text-[9px] font-bold shadow-xs flex items-center justify-center gap-1 tracking-wide">
                              <span className="text-slate-400 font-mono text-[9px]">⚒ AGENT /</span>
                              <span className="text-[#0066FF] uppercase">SUBSCRIPTION RECOVERY</span>
                            </div>

                            {/* 2. Revenue Drop Detector */}
                            <div className="bg-white/95 border border-slate-200/90 rounded-full px-3 py-1.5 text-[9px] font-bold shadow-xs flex items-center justify-center gap-1 tracking-wide">
                              <span className="text-slate-400 font-mono text-[9px]">⚒ AGENT /</span>
                              <span className="text-[#0066FF] uppercase">REVENUE DROP DETECTOR</span>
                            </div>

                            {/* 3. Auto-Capture (Elevated glowing solid blue) */}
                            <div className="bg-[#0066FF] border border-blue-400 text-white rounded-full px-4 py-2 text-[10px] font-extrabold shadow-[0_6px_20px_rgba(0,102,255,0.4)] flex items-center justify-center gap-1.5 tracking-wider scale-105 transition-transform">
                              <span className="text-blue-200 font-mono text-[9.5px]">⚒ AGENT /</span>
                              <span className="text-white uppercase">AUTO-CAPTURE</span>
                            </div>

                            {/* 4. RTO Shielder */}
                            <div className="bg-white/95 border border-slate-200/90 rounded-full px-3 py-1.5 text-[9px] font-bold shadow-xs flex items-center justify-center gap-1 tracking-wide">
                              <span className="text-slate-400 font-mono text-[9px]">⚒ AGENT /</span>
                              <span className="text-[#0066FF] uppercase">RTO SHIELDER</span>
                            </div>

                            {/* 5. Dispute Auto Responder */}
                            <div className="bg-white/95 border border-slate-200/90 rounded-full px-3 py-1.5 text-[9px] font-bold shadow-xs flex items-center justify-center gap-1 tracking-wide">
                              <span className="text-slate-400 font-mono text-[9px]">⚒ AGENT /</span>
                              <span className="text-[#0066FF] uppercase">DISPUTE AUTO RESPONDER</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. Payments for AI Builders Mockup */}
                      {feat.previewType === 'ai-builders' && (
                        <div className="w-full h-full bg-[#EDEDED] bg-[radial-gradient(#D5D8DC_1px,transparent_1px)] [background-size:12px_12px] p-4 flex items-center justify-center relative overflow-hidden">
                          <div className="relative w-48 h-48 flex items-center justify-center">
                            {/* 1. Top Right: n8n card */}
                            <div className="absolute top-1 right-2 bg-white rounded-xl border border-slate-200/90 shadow-md p-2.5 w-20 h-16 flex flex-col items-center justify-center transition-transform group-hover:-translate-y-1">
                              <div className="flex items-center gap-1">
                                <div className="flex items-center">
                                  <span className="h-2 w-2 rounded-full bg-[#EA4B71]" />
                                  <span className="h-0.5 w-1.5 bg-[#EA4B71]" />
                                  <span className="h-2 w-2 rounded-full bg-[#EA4B71]" />
                                </div>
                              </div>
                              <span className="font-extrabold text-[12px] text-[#1E293B] tracking-tight mt-1 font-heading">n8n</span>
                            </div>

                            {/* 2. Center Left: AI Builder / Cursor Blue Tile */}
                            <div className="absolute left-2 top-10 bg-gradient-to-br from-[#0066FF] to-[#0252CD] rounded-2xl shadow-[0_10px_25px_rgba(0,102,255,0.35)] w-20 h-20 flex items-center justify-center border border-blue-300/40 transition-transform group-hover:scale-105 z-10">
                              <div className="relative w-9 h-9">
                                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
                                  <path d="M4 3L19 12L12 14L9 21L4 3Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                                </svg>
                              </div>
                            </div>

                            {/* 3. Bottom Right: Replit card */}
                            <div className="absolute bottom-2 right-4 bg-white rounded-xl border border-slate-200/90 shadow-md p-2.5 w-20 h-16 flex flex-col items-center justify-center transition-transform group-hover:translate-y-1">
                              <div className="flex flex-col gap-0.5 items-center">
                                <div className="flex gap-0.5">
                                  <div className="w-2 h-1.5 bg-[#F26207] rounded-xs" />
                                  <div className="w-2 h-1.5 bg-[#F26207] rounded-xs" />
                                </div>
                                <div className="w-2 h-1.5 bg-[#F26207] rounded-xs ml-2" />
                              </div>
                              <span className="font-bold text-[11px] text-[#1E293B] tracking-tight mt-1 font-heading">replit</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. Agentic Business Banking Mockup */}
                      {feat.previewType === 'agentic-banking' && (
                        <div className="w-full h-full bg-[#F4F6F9] p-3 flex flex-col justify-center items-center relative overflow-hidden">
                          {/* Blue atmospheric arc at bottom */}
                          <div className="absolute -bottom-8 inset-x-0 h-28 bg-gradient-to-t from-[#0066FF]/80 via-[#0066FF]/40 to-transparent blur-md pointer-events-none" />

                          {/* Stack of Agency Pills */}
                          <div className="flex flex-col items-center gap-1.5 w-full max-w-[220px] relative z-10">
                            <div className="rounded-[4px] bg-white/90 border border-slate-200/80 px-3 py-1 text-[8px] font-bold text-slate-500 tracking-wider uppercase shadow-2xs">
                              REPORTING AGENT
                            </div>
                            <div className="rounded-[4px] bg-white/90 border border-slate-200/80 px-3 py-1 text-[8px] font-bold text-slate-500 tracking-wider uppercase shadow-2xs">
                              PAYROLL AGENT
                            </div>
                            
                            {/* Elevated CASHFLOW INSIGHTS AGENT card */}
                            <div className="rounded-[6px] bg-white border border-slate-200 px-4 py-2 text-[10px] font-extrabold text-[#1E293B] shadow-sm tracking-wider uppercase w-full text-center">
                              CASHFLOW INSIGHTS AGENT
                            </div>

                            <div className="rounded-[4px] bg-white/90 border border-slate-200/80 px-3 py-1 text-[8px] font-bold text-slate-500 tracking-wider uppercase shadow-2xs">
                              TAX AGENT
                            </div>
                            <div className="rounded-[4px] bg-white/90 border border-slate-200/80 px-3 py-1 text-[8px] font-bold text-slate-500 tracking-wider uppercase shadow-2xs">
                              COLLECTIONS AGENT
                            </div>

                            {/* TYPE TO PAY AGENT in vibrant blue at the bottom */}
                            <div className="rounded-[6px] bg-[#0066FF] border border-blue-400 text-white px-4 py-1.5 text-[9.5px] font-extrabold tracking-wider uppercase shadow-md w-[85%] text-center mt-1">
                              TYPE TO PAY AGENT
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Copilot Diagnostic Mockup */}
                      {feat.previewType === 'copilot' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-2 text-[10px]">
                            <div className="flex items-center justify-between text-slate-400 font-mono">
                              <span>DIAGNOSTIC: REC-2026-001</span>
                              <span className="text-[#00C853] font-bold">84% CONFIDENCE</span>
                            </div>
                            <div className="rounded-[4px] bg-slate-50 p-2 text-[#1E293B] font-medium leading-tight">
                              Card decline: Daily Limit Exceeded. Triggering WhatsApp UPI Smart Link.
                            </div>
                            <div className="flex items-center justify-between text-[#0066FF] font-bold">
                              <span>Hinglish Dunning Ready</span>
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#00C853]" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Policy Guardrails Mockup */}
                      {feat.previewType === 'guardrails' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-2 text-[10px]">
                            <div className="flex items-center justify-between font-bold text-[#1E293B]">
                              <span>Approval Gate &gt; ₹25,000</span>
                              <span className="rounded bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[9px] border border-amber-200">GATED</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-[#0066FF] w-[75%]" />
                            </div>
                            <div className="flex justify-between text-slate-500 font-mono">
                              <span>Autonomous: &lt;₹25k</span>
                              <span className="text-[#0066FF] font-bold">HITL Policy Active</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Smart Retry Mockup */}
                      {feat.previewType === 'smart-retry' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-2 text-[10px]">
                            <div className="flex items-center justify-between font-bold text-[#1E293B]">
                              <span>Dynamic Retry Schedule</span>
                              <span className="text-[#00C853] font-bold">OPTIMIZED</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px]">
                              <div className="rounded bg-blue-50 border border-blue-200 p-1 text-[#0066FF] font-bold">T+0 (Failed)</div>
                              <div className="rounded bg-emerald-50 border border-emerald-200 p-1 text-[#00C853] font-bold">T+4h (Ready)</div>
                              <div className="rounded bg-slate-50 border border-slate-200 p-1 text-slate-500">T+24h</div>
                            </div>
                            <div className="text-slate-500 text-[9px] flex justify-between">
                              <span>Predicted Clearance:</span>
                              <span className="text-[#0066FF] font-bold">10:30 AM Tomorrow</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Webhook Telemetry Mockup */}
                      {feat.previewType === 'telemetry' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-2 text-[10px]">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-slate-500">POST /webhooks/razorpay</span>
                              <span className="text-[#00C853] font-bold font-mono">200 OK</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[9px] truncate">
                              <span>HMAC: sha256_e8f9b...</span>
                              <span className="text-[#0066FF] font-semibold">Verified</span>
                            </div>
                            <div className="flex justify-between text-slate-500 font-medium">
                              <span>Ingestion Latency:</span>
                              <span className="text-[#1E293B] font-bold">1.2ms</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. Checkout Mockup */}
                      {feat.previewType === 'checkout' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-2 text-[10px]">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1 font-bold text-[#1E293B]">
                              <span>Pay with Razorpay</span>
                              <span className="text-[#0066FF] font-mono">₹4,999.00</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-center font-semibold text-slate-700">
                              <span className="rounded bg-blue-50 border border-blue-200 py-1 text-[#0066FF]">UPI</span>
                              <span className="rounded bg-slate-50 border border-slate-200 py-1">Cards</span>
                              <span className="rounded bg-slate-50 border border-slate-200 py-1">NetBanking</span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-[#00C853] font-bold">
                              <span>Flash Checkout Active</span>
                              <span>Auto-Fill OTP</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 6. Turbo UPI Mockup */}
                      {feat.previewType === 'turbo-upi' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-2 text-[10px]">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-[#00C853]/15 text-[#00C853] flex items-center justify-center font-bold">✓</div>
                              <div>
                                <div className="font-bold text-[#1E293B]">1-Click Turbo UPI Intent</div>
                                <div className="text-slate-500 text-[9px]">Zero bank redirection drops</div>
                              </div>
                            </div>
                            <div className="rounded-[4px] bg-emerald-50 border border-emerald-200 p-1 text-emerald-800 font-mono font-bold text-center">
                              SUCCESS RATE: 94.8%
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 7. Global FX Mockup */}
                      {feat.previewType === 'global-fx' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1.5 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>International Gateway</span>
                              <span className="text-[#0066FF] font-mono">$120.00 USD</span>
                            </div>
                            <div className="text-slate-500 text-[9px] flex justify-between">
                              <span>Settlement in INR:</span>
                              <span className="font-mono text-slate-800 font-bold">₹10,020.00</span>
                            </div>
                            <div className="rounded bg-blue-50 text-[#0066FF] px-1.5 py-0.5 font-semibold text-center text-[9px]">
                              100+ Currencies Supported
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 8. Smart Payment Links Mockup */}
                      {feat.previewType === 'smart-links' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1.5 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>WhatsApp Payment Link</span>
                              <span className="text-[#00C853] font-bold">SENT</span>
                            </div>
                            <div className="rounded bg-slate-50 p-1.5 font-mono text-[9px] text-slate-600 truncate">
                              rzp.io/i/X9aKm2p • ₹2,400.00
                            </div>
                            <div className="flex justify-between text-[9px] text-[#0066FF] font-medium">
                              <span>Automated Reminders</span>
                              <span>Auto-Expire 48h</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 9. Instant Payout Mockup */}
                      {feat.previewType === 'instant-payout' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1.5 text-[10px]">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#1E293B]">Vendor Disbursal</span>
                              <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.2 font-bold text-[9px]">INSTANT</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                              <span className="h-2 w-2 rounded-full bg-[#00C853]" />
                              <span>Disbursed in 1.8s via IMPS/UPI</span>
                            </div>
                            <div className="font-mono font-bold text-[#0066FF] text-right">₹84,500.00</div>
                          </div>
                        </div>
                      )}

                      {/* 10. Bulk Vendor Mockup */}
                      {feat.previewType === 'bulk-vendor' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>Batch Payout (50 Vendors)</span>
                              <span className="text-[#00C853] font-bold">Verified</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">TDS 194C Deductions calculated automatically</div>
                            <div className="text-right font-mono font-bold text-slate-800">Total: ₹14,20,000</div>
                          </div>
                        </div>
                      )}

                      {/* 11. Salary Disbursal Mockup */}
                      {feat.previewType === 'salary-disbursal' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>On-Demand Earned Wage</span>
                              <span className="text-[#0066FF] font-bold">24x7</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">Instant WhatsApp slip sent to employee</div>
                            <div className="rounded bg-slate-50 text-slate-700 px-1.5 py-0.5 font-mono text-[9px]">Status: Bank Confirmed</div>
                          </div>
                        </div>
                      )}

                      {/* 12. Maker-Checker Mockup */}
                      {feat.previewType === 'maker-checker' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1.5 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>Corporate Approval Tier</span>
                              <span className="text-amber-600 font-bold">2 of 3 SIGNED</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">CFO Sign-off pending for ₹5,00,000+</div>
                            <div className="flex justify-between text-[9px] text-[#0066FF] font-medium">
                              <span>Audit Log Created</span>
                              <span>Biometric Verified</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 13. Current Account Mockup */}
                      {feat.previewType === 'current-account' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1.5 text-[10px]">
                            <div className="text-slate-500 font-medium">Smart Current Account</div>
                            <div className="font-mono text-base font-bold text-[#1E293B]">₹28,45,210.00</div>
                            <div className="flex justify-between text-[9px] text-[#00C853] font-bold">
                              <span>Auto Sweep-In: ₹18.5L</span>
                              <span>+7.2% APR</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 14. Corporate Cards Mockup */}
                      {feat.previewType === 'corporate-cards' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] bg-gradient-to-r from-[#0C2651] to-[#1E293B] p-3 text-white shadow-sm space-y-2 text-[10px]">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs">Razorpay Corporate</span>
                              <span className="font-bold text-blue-400">VISA</span>
                            </div>
                            <div className="font-mono text-[9px] tracking-widest text-slate-300">•••• •••• •••• 4012</div>
                            <div className="flex justify-between text-[8px] text-slate-400">
                              <span>AWS & SAAS BILLING</span>
                              <span>ZERO FX MARKUP</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 15. Tax Vault Mockup */}
                      {feat.previewType === 'tax-vault' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>Automated Tax Vault</span>
                              <span className="text-[#0066FF] font-bold">Auto-Split</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">18% GST auto-routed to tax escrow account</div>
                            <div className="text-right font-mono font-bold text-[#00C853]">Audit Ready 100%</div>
                          </div>
                        </div>
                      )}

                      {/* 16. Reconciliation Mockup */}
                      {feat.previewType === 'recon-vault' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1.5 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>GSTIN 2-Way Match</span>
                              <span className="text-[#00C853] font-bold">MATCHED</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">100% invoices reconciled with bank statements</div>
                            <div className="text-[#0066FF] font-medium text-[9px]">Zero manual ledger entry required</div>
                          </div>
                        </div>
                      )}

                      {/* 17. Salary Run Mockup */}
                      {feat.previewType === 'salary-run' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1.5 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>September Payroll Run</span>
                              <span className="text-[#00C853] font-bold">3 Clicks</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">142 Employees Processed</div>
                            <div className="rounded bg-emerald-50 text-emerald-800 p-1 text-[9px] font-bold text-center">
                              Direct Bank Transfer Scheduled
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 18. Compliance Filing Mockup */}
                      {feat.previewType === 'compliance-filing' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>TDS & PF Government Challans</span>
                              <span className="text-[#00C853] font-bold">Auto-Filed</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">TRACES & EPFO Portals Direct Sync</div>
                            <div className="font-mono text-slate-700 text-[9px]">Challan Ref: 0149204928</div>
                          </div>
                        </div>
                      )}

                      {/* 19. Employee Portal Mockup */}
                      {feat.previewType === 'employee-portal' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>Employee Self-Service App</span>
                              <span className="text-[#0066FF] font-bold">Active</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">Instant Form 16 & Payslip PDF Download</div>
                            <div className="text-[#0066FF] font-medium text-[9px]">Reimbursement Claims Approved: ₹3,400</div>
                          </div>
                        </div>
                      )}

                      {/* 20. Reimbursement Flow Mockup */}
                      {feat.previewType === 'reimburse-flow' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>WhatsApp Receipt Scan</span>
                              <span className="text-[#00C853] font-bold">OCR VALID</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">Uber Cab Receipt: ₹450 verified with GSTIN</div>
                            <div className="text-right font-mono font-bold text-[#0066FF]">Direct Bank Payout</div>
                          </div>
                        </div>
                      )}

                      {/* 21. Working Capital Mockup */}
                      {feat.previewType === 'working-capital' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1.5 text-[10px]">
                            <div className="text-slate-500 font-medium">Pre-Approved Working Capital</div>
                            <div className="font-mono text-base font-bold text-[#0066FF]">₹50,00,000</div>
                            <div className="flex justify-between text-[9px] text-[#00C853] font-bold">
                              <span>Zero Collateral</span>
                              <span>Disbursal: 30 Mins</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 22. Revenue Financing Mockup */}
                      {feat.previewType === 'revenue-financing' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>Revenue-Based Financing</span>
                              <span className="text-[#0066FF] font-bold">Flexible</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">Repayment tied to daily gateway settlement receipts</div>
                            <div className="font-mono text-slate-800 text-[9px] text-right font-bold">No Fixed Monthly EMI</div>
                          </div>
                        </div>
                      )}

                      {/* 23. Invoice Discount Mockup */}
                      {feat.previewType === 'invoice-discount' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>B2B Invoice Discounting</span>
                              <span className="text-[#00C853] font-bold">Same Day</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">Unlock 90% unpaid invoice value in minutes</div>
                            <div className="font-mono text-slate-800 text-[9px] text-right font-bold">Rates from 1.2% / mo</div>
                          </div>
                        </div>
                      )}

                      {/* 24. Corporate Overdraft Mockup */}
                      {feat.previewType === 'overdraft-line' && (
                        <div className="w-full h-full bg-[#EBF4FF] p-4 flex items-center justify-center">
                          <div className="w-full rounded-[8px] border border-blue-200/80 bg-white p-3 shadow-sm space-y-1 text-[10px]">
                            <div className="flex justify-between font-bold text-[#1E293B]">
                              <span>Revolving Overdraft Line</span>
                              <span className="text-[#00C853] font-bold">ACTIVE</span>
                            </div>
                            <div className="text-slate-500 text-[9px]">Draw funds instantly to bridge payroll & inventory</div>
                            <div className="text-[#0066FF] font-medium text-[9px]">Pay interest only on days utilized</div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Bottom Half: Text Meta & Hover Action CTAs */}
                    <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 bg-white min-h-[145px]">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#1E293B] font-heading">
                          {feat.title}
                        </h3>
                        <p className="mt-2 text-xs sm:text-[13px] text-[#556987] leading-relaxed">
                          {feat.description}
                        </p>
                      </div>

                      {/* Action Buttons Revealed on Hover (Sign Up -> & Know More) */}
                      <div className="mt-4 flex items-center gap-3.5 transition-all duration-300 ease-out opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform sm:translate-y-2 sm:group-hover:translate-y-0">
                        <Link
                          to="/signup"
                          className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#0066FF] hover:bg-[#0252CD] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span>Sign Up</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFeatureModal(feat);
                          }}
                          className="text-xs sm:text-sm font-bold text-[#0066FF] hover:text-[#0252CD] hover:underline transition-colors py-2 px-1 cursor-pointer"
                        >
                          Know More
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INTERACTIVE ROI CALCULATOR SECTION */}
      <section id="calculator" className="py-12 sm:py-16 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
              Financial Yield Engine
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1E293B] font-heading">
              Calculate Revenue Recovered With AI
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#556987]">
              Quantify the bottom-line ARR impact of RazorRecover AI's autonomous dunning policies on your business.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 rounded-[16px] border border-slate-200 bg-[#F8FAFC] p-6 sm:p-8 lg:grid-cols-2 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            {/* Left Controls */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#1E293B] mb-2">
                  <span>Monthly Processed GMV</span>
                  <span className="font-mono text-[#0066FF]">₹{(monthlyRevenue / 100000).toFixed(1)} Lakhs</span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="50000000"
                  step="500000"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                  className="w-full accent-[#0066FF] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>₹5 Lakhs</span>
                  <span>₹5 Crores</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#1E293B] mb-2">
                  <span>Average Payment Failure Rate</span>
                  <span className="font-mono text-rose-600">{failureRate}%</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="25"
                  step="1"
                  value={failureRate}
                  onChange={(e) => setFailureRate(Number(e.target.value))}
                  className="w-full accent-[#0066FF] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>4% (Low)</span>
                  <span>25% (High Dropoff)</span>
                </div>
              </div>

              <div className="rounded-[8px] border border-blue-200 bg-white p-4 text-xs text-[#556987] space-y-1.5">
                <div className="font-bold text-[#1E293B] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#00C853]" />
                  <span>Defensible Autonomous Yield Model</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Based on RazorRecover's historical telemetry across UPI smart-retry and Hinglish WhatsApp discount incentives.
                </p>
              </div>
            </div>

            {/* Right Computed Values */}
            <div className="flex flex-col justify-between rounded-[12px] bg-white border border-slate-200 p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-[#556987]">Annual Revenue Lost to Payment Failures:</span>
                  <p className="text-lg font-bold text-rose-600 font-mono">
                    ₹{(annualLostRevenue / 100000).toFixed(2)} Lakhs / year
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-[#00C853] uppercase tracking-wider">
                    Projected Preserved ARR:
                  </span>
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#0066FF] font-mono mt-1">
                    ₹{(estimatedRecovered / 100000).toFixed(2)} Lakhs
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Net recovery ARR directly credited back to your balance sheet
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-[#556987] font-medium">Ready to plug the leak?</span>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#0066FF] hover:bg-[#0252CD] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DEVELOPER API SECTION */}
      <section id="developers" className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
              Developer Native
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1E293B] font-heading">
              Engineered for Rapid Integration
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#556987]">
              Embed autonomous payments and recovery intelligence into your application with just a few lines of code.
            </p>
          </div>

          <div className="mt-8 rounded-[16px] border border-slate-200 bg-[#0C2651] p-5 sm:p-6 shadow-xl text-white">
            {/* Code Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                {(['node', 'webhook', 'python', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`rounded-[4px] px-3 py-1 text-xs font-mono font-semibold transition-colors ${
                      codeLang === lang
                        ? 'bg-[#0066FF] text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {lang === 'node' && 'Node.js'}
                    {lang === 'webhook' && 'Webhooks'}
                    {lang === 'python' && 'Python (Gemini)'}
                    {lang === 'curl' && 'cURL API'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-[#00C853]" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code Block */}
            <pre className="overflow-x-auto text-xs font-mono text-slate-200 p-2 leading-relaxed">
              <code>{codeSnippets[codeLang]}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-[#556987]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#0066FF] text-white">
                  <Zap className="h-4 w-4 fill-current" />
                </div>
                <span className="text-base font-bold text-[#1E293B] font-heading">Razorpay</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed max-w-sm">
                India's leading automated finance platform powering online payments, instant payouts, smart business banking, and autonomous revenue recovery.
              </p>
              <div className="mt-4 flex items-center gap-3 text-slate-400 text-[11px]">
                <span>PCI-DSS Level 1</span>
                <span>•</span>
                <span>ISO 27001</span>
                <span>•</span>
                <span>RBI Authorized PA</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[#1E293B] uppercase tracking-wider text-[11px] mb-3">AI Platform</h4>
              <ul className="space-y-2">
                <li><a href="#tab-section" onClick={() => setActiveTab('ai-native')} className="hover:text-[#0066FF]">Agentic Stack</a></li>
                <li><a href="#tab-section" onClick={() => setActiveTab('recovery')} className="hover:text-[#0066FF]">Recovery Engine</a></li>
                <li><a href="#tab-section" onClick={() => setActiveTab('agents')} className="hover:text-[#0066FF]">Agent Studio</a></li>
                <li><a href="#tab-section" onClick={() => setActiveTab('guardrails')} className="hover:text-[#0066FF]">Policy Guardrails</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#1E293B] uppercase tracking-wider text-[11px] mb-3">Developer & Yield</h4>
              <ul className="space-y-2">
                <li><a href="#tab-section" onClick={() => setActiveTab('telemetry')} className="hover:text-[#0066FF]">Live Telemetry</a></li>
                <li><a href="#tab-section" onClick={() => setActiveTab('payments')} className="hover:text-[#0066FF]">Smart Checkout</a></li>
                <li><a href="#developer" className="hover:text-[#0066FF]">API Docs & Webhooks</a></li>
                <li><a href="#calculator" className="hover:text-[#0066FF]">ROI Yield Calculator</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#1E293B] uppercase tracking-wider text-[11px] mb-3">Access Portals</h4>
              <ul className="space-y-2">
                <li><Link to="/login" className="hover:text-[#0066FF]">Admin Ops Sign In</Link></li>
                <li><Link to="/login" className="hover:text-[#0066FF]">Customer Portal Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-[#0066FF]">Create New Account</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              © 2026 Razorpay Software Private Limited. Built for Razorpay Buildathon.
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-600 cursor-pointer">Security Safeguards</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 8. FLOATING UTILITY UI: "ASK RAY" ACTION WIDGET WITH CRISP WHITE BORDERS */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowRayModal(!showRayModal)}
          className="flex items-center gap-2.5 rounded-full border-2 border-white ring-2 ring-[#0066FF]/20 bg-gradient-to-r from-[#0066FF] to-[#0252CD] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_25px_rgba(0,102,255,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <div className="relative">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#00C853] ring-1 ring-white" />
          </div>
          <span>Ask RAY</span>
          <span className="rounded-full bg-white/20 border border-white/30 text-white px-1.5 py-0.2 text-[10px] font-extrabold">
            AI
          </span>
        </button>

        {/* Floating AI Chat Window Modal */}
        {showRayModal && (
          <div className="absolute bottom-14 right-0 w-84 sm:w-96 rounded-[14px] border-2 border-white ring-1 ring-slate-200 bg-white shadow-2xl p-4 animate-fadeIn flex flex-col h-[400px]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E293B]">RAY Assistant</h4>
                  <div className="flex items-center gap-1 text-[10px] text-[#00C853] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00C853]" />
                    <span>Online • Instant Answers</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowRayModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
              {rayMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[10px] p-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-[#F8FAFC] border border-slate-200 text-[#1E293B]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Prompts */}
            <div className="border-t border-slate-100 pt-2 pb-1 flex gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setRayInput('How does autonomous recovery work?')}
                className="whitespace-nowrap rounded-[4px] bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] text-[#556987] hover:text-[#0066FF] cursor-pointer"
              >
                Autonomous Recovery?
              </button>
              <button
                onClick={() => setRayInput('What are the payout speeds?')}
                className="whitespace-nowrap rounded-[4px] bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] text-[#556987] hover:text-[#0066FF] cursor-pointer"
              >
                Payout speeds?
              </button>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendRay} className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
              <input
                type="text"
                value={rayInput}
                onChange={(e) => setRayInput(e.target.value)}
                placeholder="Ask about payments, recovery, banking..."
                className="flex-1 rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-[#1E293B] outline-none focus:border-[#0066FF] focus:bg-white"
              />
              <button
                type="submit"
                disabled={!rayInput.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#0066FF] text-white disabled:opacity-40 hover:bg-[#0252CD] cursor-pointer transition-colors"
              >
                <Send className="h-3 w-3" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Feature Know More Detail Modal */}
      {selectedFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scaleUp">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#0066FF] border border-blue-100 font-mono">
                    {selectedFeatureModal.badge}
                  </span>
                  <span className="text-xs text-slate-400">• RazorRecover Platform</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#0C2651] font-heading">
                  {selectedFeatureModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFeatureModal(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-4 space-y-3">
              <p className="text-sm text-[#556987] leading-relaxed">
                {selectedFeatureModal.description}
              </p>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs">
                <div className="font-bold text-[#0C2651] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#0066FF]" />
                  <span>Key Architecture Capabilities:</span>
                </div>
                <ul className="space-y-1.5 text-[#556987] list-disc list-inside text-xs">
                  <li>Direct integration with Razorpay Core APIs and payment nodes.</li>
                  <li>Real-time webhook telemetry verified with cryptographic HMAC SHA-256.</li>
                  <li>Enterprise policy safeguards & automated recovery retry orchestration.</li>
                  <li>Full audit log traceability and automated financial reconciliation.</li>
                </ul>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  const title = selectedFeatureModal.title;
                  setSelectedFeatureModal(null);
                  setShowRayModal(true);
                  setRayInput(`Can you tell me more about ${title}?`);
                }}
                className="text-xs font-semibold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Ask RAY Assistant</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFeatureModal(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-[6px] transition-colors cursor-pointer"
                >
                  Close
                </button>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#0066FF] hover:bg-[#0252CD] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
