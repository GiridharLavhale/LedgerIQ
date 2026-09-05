import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Database,
  ArrowLeftRight,
  CreditCard,
  Building2,
  Receipt,
  AlertTriangle,
  Calculator,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  Bot,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCopilot?: () => void;
}

interface NavSection {
  title: string;
  items: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenCopilot,
}) => {
  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { to: '/', label: 'Operations Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Finance Operations',
      items: [
        { to: '/reconciliation', label: 'Reconciliation Batches', icon: Layers },
        { to: '/exceptions', label: 'Exception Workbench', icon: AlertTriangle },
        { to: '/transactions', label: 'Canonical Ledger', icon: ArrowLeftRight },
        { to: '/payments', label: 'Gateway Payments', icon: CreditCard },
        { to: '/settlements', label: 'Settlement Feeds', icon: Building2 },
        { to: '/bank-statements', label: 'Bank Statements', icon: Receipt },
        { to: '/invoices', label: 'OMS & ERP Invoices', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Intelligence & Verification',
      items: [
        { to: '/verification', label: 'Settlement Verifier', icon: Calculator },
        { to: '/evaluations', label: 'Benchmark Accuracy', icon: BarChart3 },
      ],
    },
    {
      title: 'Reporting & Governance',
      items: [
        { to: '/reports', label: 'Reports & Exports', icon: FileSpreadsheet },
        { to: '/audit', label: 'Compliance Audit Trail', icon: ShieldCheck },
      ],
    },
    {
      title: 'Data & Settings',
      items: [
        { to: '/data-sources', label: 'Data Sources & Feeds', icon: Database },
        { to: '/settings', label: 'Organization & Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {/* Organization / Workspace Header in expanded mode */}
        {!isCollapsed && (
          <div className="px-2 pb-1">
            <div className="rounded border border-blue-100 bg-blue-50/60 p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded bg-[#031635] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                  RP
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Razorpay FinOps Org</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">Live Production</p>
                </div>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Active Organization"></span>
            </div>
          </div>
        )}

        {/* AI Copilot Quick Button in Sidebar */}
        <div className="px-1">
          <button
            onClick={onOpenCopilot}
            className={`w-full flex items-center gap-2.5 rounded bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-2 text-xs font-bold text-[#0066ff] hover:from-blue-100 hover:to-indigo-100 transition-all shadow-2xs ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            title="Open Finance Copilot"
          >
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#0066ff] shrink-0" />
              {!isCollapsed && <span>Finance Copilot</span>}
            </div>
            {!isCollapsed && (
              <span className="rounded bg-[#0066ff] text-white px-1.5 py-0.2 text-[9px] font-mono">
                AI
              </span>
            )}
          </button>
        </div>

        {/* Grouped Nav Items */}
        {sections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {!isCollapsed ? (
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                {section.title}
              </div>
            ) : (
              <div className="h-px bg-slate-100 my-2 mx-1" />
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded px-2.5 py-2 text-xs font-medium transition-colors group relative ${
                      isActive
                        ? 'bg-blue-50 text-[#0066ff] font-semibold border-l-3 border-[#0066ff]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto rounded px-1.5 py-0.2 text-[10px] font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer Button */}
      <div className="p-2 border-t border-slate-200 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 rounded px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-[11px] font-mono">Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
