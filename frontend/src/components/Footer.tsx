import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity, Database, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="h-9 border-t border-slate-200 bg-white px-6 shrink-0 flex items-center justify-between text-[11px] text-slate-500 font-mono select-none">
      {/* Left: System & Brand */}
      <div className="flex items-center gap-3">
        <span className="font-semibold text-slate-800 font-sans flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          LedgerIQ Enterprise
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500">v1.0.0</span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span className="text-slate-500 hidden sm:inline">Org: razorpay-finops</span>
      </div>

      {/* Middle: Live Engine Status */}
      <div className="hidden md:flex items-center gap-4">
        <span className="flex items-center gap-1 text-slate-600">
          <Activity className="h-3 w-3 text-emerald-600" />
          <span>API: 127.0.0.1:8000 (Healthy)</span>
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1 text-slate-600">
          <Database className="h-3 w-3 text-[#0066ff]" />
          <span>Engine: 4-Tier Matcher (Active)</span>
        </span>
      </div>

      {/* Right: Quick Links */}
      <div className="flex items-center gap-3">
        <Link to="/audit" className="hover:text-slate-900 transition-colors">
          Audit Trail
        </Link>
        <span className="text-slate-300">|</span>
        <Link to="/verification" className="hover:text-slate-900 transition-colors">
          Verifier
        </Link>
        <span className="text-slate-300">|</span>
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="hover:text-slate-900 transition-colors"
        >
          Swagger Docs
        </a>
      </div>
    </footer>
  );
};
