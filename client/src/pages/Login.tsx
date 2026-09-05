import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleStandardPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] px-4 py-12 text-slate-800">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[4px] bg-[#0C2651] text-white shadow-blade-sm">
            <Shield className="h-6 w-6 text-[#0D94FB]" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-[#0C2651] sm:text-2xl font-heading">
            Sign in to RazorRecover AI
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Autonomous revenue recovery & real-time customer billing
          </p>
        </div>

        {/* Real-Time Google Authentication Container */}
        <div className="mt-6 rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Real-Time Google OAuth
          </div>
          <GoogleSignInButton text="continue_with" />
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-[#F4F6F8] px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            or email & password
          </span>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleStandardPasswordLogin} className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-sm">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-[4px] border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  className="w-full rounded-[4px] border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[10px] text-slate-400">Password protected</span>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[4px] border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Signing in...' : 'Sign in to Account'}
            {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          New customer or employer?{' '}
          <Link to="/signup" className="text-[#0D94FB] font-bold hover:underline">
            Join with your Google account
          </Link>
        </p>
      </div>
    </div>
  );
};
