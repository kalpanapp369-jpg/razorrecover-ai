import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  Repeat,
  Receipt,
  HelpCircle,
  User,
  LogOut,
  Shield,
  Menu,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const customerNavItems = [
  { title: 'Overview', href: '/customer/dashboard', icon: LayoutDashboard },
  { title: 'My Payments', href: '/customer/payments', icon: CreditCard },
  { title: 'Subscriptions', href: '/customer/subscriptions', icon: Repeat },
  { title: 'Invoices', href: '/customer/invoices', icon: Receipt },
  { title: 'Resolution Center', href: '/customer/recovery', icon: HelpCircle, badge: 'Offers' },
  { title: 'My Profile', href: '/customer/profile', icon: User },
];

export const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 bg-slate-50/70">
        <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#0C2651] text-white shadow-sm">
          <Shield className="h-4 w-4 text-[#0D94FB]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-[#0C2651] font-heading">Customer Portal</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">RazorRecover Verified</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Account Services
        </div>
        <nav className="space-y-1">
          {customerNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between rounded-[4px] px-3 py-2 text-xs font-semibold transition-all duration-150 ease-out',
                  isActive
                    ? 'bg-blue-50 text-[#0D94FB] border border-blue-200 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#0C2651]'
                )
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#0D94FB] transition-colors" />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span className="rounded-[4px] bg-blue-100 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-[#0D94FB]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Card Footer */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/70">
        <div className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-white p-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-blue-50 border border-blue-200 text-xs font-bold text-[#0D94FB]">
              {user?.fullName?.charAt(0) || 'C'}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[#0C2651]">{user?.fullName || 'Customer'}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="rounded-[4px] p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F6F8] text-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-64 flex-1">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-[4px] p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-[#0C2651] font-heading">Customer Account Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-[4px] border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Session</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F4F6F8]">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
