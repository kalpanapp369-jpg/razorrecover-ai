import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  LogOut,
  Shield,
  Menu,
} from 'lucide-react';

interface TopBarProps {
  onOpenMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-[4px] p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search with RazorSense Focus */}
        <div className="relative hidden w-80 md:block">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search case ID, customer, transaction..."
            className="w-full rounded-[4px] border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Gateway Mode Indicator */}
        <div className="hidden items-center gap-2 rounded-[4px] border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>Gateway Active</span>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-1.5 rounded-[4px] border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0D94FB]">
          <Shield className="h-3.5 w-3.5" />
          <span>{user?.role || 'ADMIN'}</span>
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          title="Notifications"
          className="relative rounded-[4px] border border-slate-200 bg-white p-2 text-slate-600 transition-all duration-150 ease-out hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#0D94FB]" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#0C2651] text-xs font-bold text-white shadow-2xs">
            {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-xs font-bold text-[#0C2651]">{user?.fullName || user?.email}</div>
            <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">{user?.company || 'Merchant Ops'}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="rounded-[4px] p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
