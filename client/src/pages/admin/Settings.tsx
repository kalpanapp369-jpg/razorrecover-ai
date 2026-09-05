import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Webhook,
  Database,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & System Configuration"
        subtitle="Manage authentication credentials, Supabase database bindings & recovery webhook listeners"
        badge="Platform Config"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Organization & Security */}
        <div className="space-y-6 lg:col-span-2">
          {/* Org Profile */}
          <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <Shield className="h-5 w-5 text-[#0D94FB]" />
              <h3 className="text-sm font-bold text-[#0C2651] font-heading">Organization & Account</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Merchant Name</label>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-800">
                  {user?.company || 'RazorRecover Enterprise'}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Admin Email</label>
                <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-2.5 font-mono text-slate-800">
                  {user?.email}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Current Role</label>
                <div className="flex items-center gap-2 rounded-[4px] border border-blue-200 bg-blue-50 p-2.5 font-bold text-[#0D94FB]">
                  <span>{user?.role}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Environment</label>
                <div className="flex items-center gap-1.5 rounded-[4px] border border-emerald-200 bg-emerald-50 p-2.5 font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Phase 1 Staging Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Webhooks & Integration Endpoints */}
          <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <Webhook className="h-5 w-5 text-[#0D94FB]" />
              <h3 className="text-sm font-bold text-[#0C2651] font-heading">Webhook Listeners (Phase 2 Ready)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#0C2651]">Razorpay Payment Failed Webhook</span>
                  <span className="rounded-[4px] bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0D94FB]">Phase 2 Ingestion</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600">https://api.razorrecover.ai/webhooks/razorpay/payment-failed</div>
              </div>

              <div className="rounded-[4px] border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#0C2651]">Cart Drop / Checkout Abandonment Hook</span>
                  <span className="rounded-[4px] bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0D94FB]">Phase 2 Ingestion</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600">https://api.razorrecover.ai/webhooks/cart/abandoned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Database & Team */}
        <div className="space-y-6">
          {/* Supabase Schema Status */}
          <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <Database className="h-5 w-5 text-[#0D94FB]" />
              <h3 className="text-sm font-bold text-[#0C2651] font-heading">Database & Schema</h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">PostgreSQL Schema:</span>
                <span className="font-bold text-slate-900">18 Tables Active</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Migration Script:</span>
                <span className="font-mono text-[11px] text-[#0D94FB] font-bold">001_initial_schema.sql</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Seed Script:</span>
                <span className="font-mono text-[11px] text-[#0D94FB] font-bold">002_seed_demo_data.sql</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Engine Mode:</span>
                <span className="font-bold text-emerald-700">Live API Ready</span>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#0D94FB]" />
                <h3 className="text-sm font-bold text-[#0C2651] font-heading">Team Members</h3>
              </div>
              <span className="rounded-[4px] bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">2 Active</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-slate-50 p-2.5">
                <div>
                  <div className="font-bold text-[#0C2651]">Arjun Mehta</div>
                  <div className="text-[10px] text-slate-500">Head of Revenue Ops</div>
                </div>
                <span className="rounded-[4px] bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0D94FB]">Admin</span>
              </div>

              <div className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-slate-50 p-2.5">
                <div>
                  <div className="font-bold text-[#0C2651]">Neha Gupta</div>
                  <div className="text-[10px] text-slate-500">Recovery Specialist</div>
                </div>
                <span className="rounded-[4px] bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">Staff</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
