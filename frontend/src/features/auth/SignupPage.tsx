import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User as UserIcon, Mail, Lock, ArrowRight } from 'lucide-react';
import { authApi } from '../../api';

interface SignupPageProps {
  onSignupSuccess: (token: string, user: any) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess }) => {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await authApi.register({
        org_name: orgName,
        full_name: fullName,
        email,
        password,
      });
      localStorage.setItem('ledgeriq_token', data.access_token);
      onSignupSuccess(data.access_token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded bg-[#031635] font-mono text-2xl font-extrabold text-white shadow-sm">
            LQ
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">Create LedgerIQ Account</h1>
          <p className="text-xs text-slate-500">
            Deploy autonomous finance operations & reconciliation for your company.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-card">
          {error && (
            <div className="mb-4 rounded bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Organization Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  placeholder="e.g. Razorpay Technologies"
                  className="w-full rounded border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900 focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="e.g. Priya Sharma"
                  className="w-full rounded border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900 focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="priya@company.com"
                  className="w-full rounded border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900 focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900 focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded bg-[#0066ff] py-2.5 text-xs font-semibold text-white hover:bg-[#0050cc] transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Creating Organization...' : 'Get Started'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0066ff] hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
