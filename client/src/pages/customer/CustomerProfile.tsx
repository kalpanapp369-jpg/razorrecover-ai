import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Building, Phone, ShieldCheck } from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Profile & Security"
        subtitle="Manage your company contact details, billing contacts & notification channels"
        badge="Account Settings"
        light
      />

      <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-sm max-w-2xl">
        <div className="flex items-center gap-3.5 border-b border-slate-200 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-blue-50 border border-blue-200 text-[#0D94FB] font-bold text-lg">
            {user?.fullName?.charAt(0) || 'C'}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0C2651] font-heading">{user?.fullName || 'Customer User'}</h3>
            <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Full Name</label>
            <div className="flex items-center gap-2 rounded-[4px] border border-slate-200 bg-slate-50 p-2.5 text-slate-800 font-medium">
              <User className="h-4 w-4 text-slate-400" />
              <span>{user?.fullName || 'Rohan Sharma'}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Company Name</label>
            <div className="flex items-center gap-2 rounded-[4px] border border-slate-200 bg-slate-50 p-2.5 text-slate-800 font-medium">
              <Building className="h-4 w-4 text-slate-400" />
              <span>{user?.company || 'Apex Growth Labs'}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Email Address</label>
            <div className="flex items-center gap-2 rounded-[4px] border border-slate-200 bg-slate-50 p-2.5 text-slate-800 font-mono">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Phone (WhatsApp Notifications)</label>
            <div className="flex items-center gap-2 rounded-[4px] border border-slate-200 bg-slate-50 p-2.5 text-slate-800 font-mono">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>+91 91234 56789</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Assigned Role</label>
            <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-blue-200 bg-blue-50 px-3 py-1.5 font-bold text-[#0D94FB]">
              <ShieldCheck className="h-4 w-4" />
              <span>{user?.role || 'CUSTOMER'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
