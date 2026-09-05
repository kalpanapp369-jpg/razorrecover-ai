import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/database.types';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { Shield, User, Lock, Mail, Building, UserCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await signup({
        email,
        password,
        fullName,
        company,
        role,
      });

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
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
            Create your account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join with your Google account for real-time authentication
          </p>
        </div>

        {/* Real-Time Google Authentication Container */}
        <div className="mt-6 rounded-[4px] border border-slate-200 bg-white p-5 shadow-blade-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Real-Time Google Sign-Up
          </div>
          <GoogleSignInButton text="signup_with" />
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-[#F4F6F8] px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            or standard email sign up
          </span>
        </div>

        <form onSubmit={handleSignup} className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-blade-sm">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-[4px] border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Picker */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`flex items-center justify-center gap-1.5 rounded-[4px] border p-2 text-xs font-bold transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  role === 'CUSTOMER'
                    ? 'border-[#0D94FB] bg-blue-50 text-[#0D94FB]'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Customer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`flex items-center justify-center gap-1.5 rounded-[4px] border p-2 text-xs font-bold transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  role === 'ADMIN'
                    ? 'border-[#0D94FB] bg-blue-50 text-[#0D94FB]'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin / Ops</span>
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Full Name</label>
              <div className="relative mt-1">
                <UserCheck className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Arjun Mehta"
                  className="w-full rounded-[4px] border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Company Name</label>
              <div className="relative mt-1">
                <Building className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Apex SaaS Labs"
                  className="w-full rounded-[4px] border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Email address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjun@company.com"
                  className="w-full rounded-[4px] border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (min 6 chars)"
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
            {isLoading ? 'Creating account...' : 'Complete Sign Up'}
            {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0D94FB] font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
