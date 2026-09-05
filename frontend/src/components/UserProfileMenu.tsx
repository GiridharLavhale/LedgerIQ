import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  LogOut,
  Settings,
  ShieldCheck,
  Building2,
  ExternalLink,
  Keyboard,
  ChevronDown,
} from 'lucide-react';
import { User } from '../types';

interface UserProfileMenuProps {
  user: User | null;
  onLogout: () => void;
  onOpenShortcuts: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  user,
  onLogout,
  onOpenShortcuts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    FINANCE_MANAGER: 'bg-blue-50 text-blue-700 border-blue-200',
    FINANCE_ANALYST: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    VIEWER: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const userRole = user?.role || 'ADMIN';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#031635] text-white text-xs font-bold shadow-2xs">
          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
            {user?.full_name || 'FinOps Controller'}
          </p>
          <span className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold font-mono uppercase border ${roleColors[userRole] || roleColors.ADMIN}`}>
            {userRole}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-200 bg-white shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
          {/* User & Org Header */}
          <div className="p-3.5 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-900">{user?.full_name || 'FinOps Controller'}</p>
            <p className="text-[11px] text-slate-500 truncate font-mono">{user?.email || 'admin@ledgeriq.io'}</p>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-600">
              <Building2 className="h-3.5 w-3.5 text-[#0066ff]" />
              <span className="font-semibold">Razorpay FinOps Org</span>
              <span className="text-slate-400 font-mono">(Live)</span>
            </div>
          </div>

          {/* Menu Actions */}
          <div className="p-1.5 space-y-0.5 text-xs">
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Organization & Settings</span>
            </Link>

            <Link
              to="/audit"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <span>Compliance Audit Trail</span>
            </Link>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenShortcuts();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Keyboard className="h-4 w-4 text-slate-400" />
                <span>Keyboard Shortcuts</span>
              </div>
              <kbd className="rounded border border-slate-200 bg-white px-1 text-[10px] font-mono text-slate-400">?</kbd>
            </button>

            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="h-4 w-4 text-slate-400" />
                <span>API Swagger Docs</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">/docs</span>
            </a>
          </div>

          {/* Sign Out */}
          <div className="p-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-xs font-semibold text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out of session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
