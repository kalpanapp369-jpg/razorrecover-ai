import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  Users,
  CreditCard,
  Repeat,
  Receipt,
  PlaySquare,
  BarChart3,
  Bot,
  ScrollText,
  ShieldCheck,
  Settings,
  Zap,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeType?: 'default' | 'action';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'MONITOR',
    items: [
      { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { title: 'Recovery Queue', href: '/admin/recovery-queue', icon: Layers, badge: '1 Action', badgeType: 'action' },
      { title: 'Cases', href: '/admin/cases', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'REVENUE SOURCES',
    items: [
      { title: 'Customers', href: '/admin/customers', icon: Users },
      { title: 'Payments', href: '/admin/payments', icon: CreditCard },
      { title: 'Subscriptions', href: '/admin/subscriptions', icon: Repeat },
      { title: 'Invoices', href: '/admin/invoices', icon: Receipt },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { title: 'Simulation', href: '/admin/simulation', icon: PlaySquare },
      { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { title: 'AI Copilot', href: '/admin/copilot', icon: Bot, badge: 'Agent' },
    ],
  },
  {
    label: 'GOVERNANCE',
    items: [
      { title: 'Policies', href: '/admin/policies', icon: ShieldCheck },
      { title: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
      { title: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC<{ onCloseMobile?: () => void }> = ({ onCloseMobile }) => {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-[#13356E] bg-[#0C2651] text-white">
      {/* Institutional Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-[#13356E] px-5 bg-[#081C3D]">
        <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#0D94FB] text-white shadow-sm">
          <Zap className="h-4 w-4 fill-current" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-white font-heading">RazorRecover</span>
            <span className="rounded-[4px] bg-[#0D94FB]/20 px-1 py-0.2 text-[9px] font-bold text-[#0D94FB]">AI</span>
          </div>
          <p className="text-[10px] text-slate-300">Blade Design System</p>
        </div>
      </div>

      {/* Navigation List - Grouped by Developer Mental Model */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.label}
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center justify-between rounded-[4px] px-3 py-2 text-xs transition-all duration-150 ease-out',
                      isActive
                        ? 'bg-[#0D94FB] text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'rounded-[4px] px-1.5 py-0.2 text-[9px] font-bold font-mono',
                        item.badgeType === 'action'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-white/15 text-white'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Environment & Ops Status Footer */}
      <div className="border-t border-[#13356E] p-3 bg-[#081C3D]">
        <div className="rounded-[4px] border border-[#13356E] bg-[#0C2651] p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Activity className="h-3.5 w-3.5 text-[#0D94FB]" />
              <span>Razorpay Test Sandbox</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Blade tokens active. RazorSense motion enabled.
          </p>
        </div>
      </div>
    </aside>
  );
};
