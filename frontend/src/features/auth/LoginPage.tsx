import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Database } from 'lucide-react';
import { authApi } from '../../api';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@ledgeriq.io');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('ledgeriq_token', data.access_token);
      onLoginSuccess(data.access_token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('admin@ledgeriq.io');
    setPassword('admin123');
    setLoading(true);
    try {
      const data = await authApi.demoLogin();
      localStorage.setItem('ledgeriq_token', data.access_token);
      onLoginSuccess(data.access_token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Demo user login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded bg-[#031635] font-mono text-2xl font-extrabold text-white shadow-sm">
            LQ
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30]">LedgerIQ</h1>
          <p className="text-xs text-slate-500">
            Reconcile faster. Explain every rupee. Resolve exceptions with confidence.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-card">
          <h2 className="text-base font-bold text-slate-900 mb-4">Sign In to FinOps Command Center</h2>

          {error && (
            <div className="mb-4 rounded bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@ledgeriq.io"
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
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              onClick={handleQuickDemoLogin}
              className="w-full flex items-center justify-center gap-2 rounded border border-amber-300 bg-amber-50 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
            >
              <Database className="h-3.5 w-3.5 text-amber-700" />
              <span>Instant Demo Login (admin@ledgeriq.io)</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Need an organization account?{' '}
          <Link to="/signup" className="text-[#0066ff] hover:underline font-semibold">
            Register your team
          </Link>
        </p>
      </div>
    </div>
  );
};
