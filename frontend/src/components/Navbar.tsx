import React from 'react';
import { Bot, Database, Search, Zap, Activity } from 'lucide-react';
import { User } from '../types';
import { Breadcrumbs } from './Breadcrumbs';
import { NotificationsPopover, NotificationItem } from './NotificationsPopover';
import { UserProfileMenu } from './UserProfileMenu';

interface NavbarProps {
  user: User | null;
  notifications: NotificationItem[];
  onOpenCopilot: () => void;
  onSeedDemo: () => void;
  onLogout: () => void;
  onOpenSearch: () => void;
  onOpenShortcuts: () => void;
  onClearNotifications: () => void;
  isSeeding?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  notifications,
  onOpenCopilot,
  onSeedDemo,
  onLogout,
  onOpenSearch,
  onOpenShortcuts,
  onClearNotifications,
  isSeeding = false,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 shrink-0 select-none shadow-2xs">
      {/* Left: Brand & Breadcrumbs */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#031635] font-bold text-white shadow-2xs">
            <span className="font-mono text-sm font-black tracking-tighter">LQ</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-black tracking-tight text-[#0b1c30]">LedgerIQ</span>
            <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.2 text-[9px] font-bold font-mono text-blue-700 border border-blue-200">
              PROD
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block shrink-0" />

        {/* Dynamic Breadcrumbs */}
        <div className="min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      {/* Center: Global Search / Command Palette Trigger */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-xs mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:border-slate-300 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search ledger, views, actions...</span>
          </div>
          <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.2 text-[10px] font-mono text-slate-500">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Actions & User Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Search icon on small screens */}
        <button
          onClick={onOpenSearch}
          className="md:hidden rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          title="Search (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* 1-Click Demo Benchmark Execution Button */}
        <button
          onClick={onSeedDemo}
          disabled={isSeeding}
          className="hidden sm:inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
          title="Instantly generate, normalize, and reconcile 100 benchmark records"
        >
          <Database className={`h-3.5 w-3.5 text-amber-700 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Reconciling...' : 'Demo Benchmark'}</span>
        </button>

        {/* Grounded AI Finance Copilot Trigger */}
        <button
          onClick={onOpenCopilot}
          className="inline-flex items-center gap-1.5 rounded bg-[#0066ff] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0050cc] transition-colors shadow-2xs"
        >
          <Bot className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Finance Copilot</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Notifications Popover */}
        <NotificationsPopover
          notifications={notifications}
          onClear={onClearNotifications}
        />

        {/* User Profile Menu */}
        <UserProfileMenu
          user={user}
          onLogout={onLogout}
          onOpenShortcuts={onOpenShortcuts}
        />
      </div>
    </header>
  );
};
