import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
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
  Zap,
  X,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCopilot: () => void;
  onSeedDemo: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenCopilot,
  onSeedDemo,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Operations Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => navigate('/'),
      shortcut: 'G D',
    },
    {
      id: 'reconciliation',
      title: 'Reconciliation Batches',
      category: 'Navigation',
      icon: Layers,
      action: () => navigate('/reconciliation'),
      shortcut: 'G R',
    },
    {
      id: 'exceptions',
      title: 'Exception Workbench',
      category: 'Navigation',
      icon: AlertTriangle,
      action: () => navigate('/exceptions'),
      shortcut: 'G E',
    },
    {
      id: 'transactions',
      title: 'Canonical Ledger',
      category: 'Navigation',
      icon: ArrowLeftRight,
      action: () => navigate('/transactions'),
      shortcut: 'G T',
    },
    {
      id: 'payments',
      title: 'Payment Gateway Collections',
      category: 'Navigation',
      icon: CreditCard,
      action: () => navigate('/payments'),
    },
    {
      id: 'settlements',
      title: 'Settlement Feeds & Payouts',
      category: 'Navigation',
      icon: Building2,
      action: () => navigate('/settlements'),
    },
    {
      id: 'bank-statements',
      title: 'Core Banking Statements',
      category: 'Navigation',
      icon: Receipt,
      action: () => navigate('/bank-statements'),
    },
    {
      id: 'invoices',
      title: 'OMS & ERP Invoices',
      category: 'Navigation',
      icon: FileSpreadsheet,
      action: () => navigate('/invoices'),
    },
    {
      id: 'verification',
      title: 'Independent Settlement Verifier',
      category: 'Tools',
      icon: Calculator,
      action: () => navigate('/verification'),
      shortcut: 'G V',
    },
    {
      id: 'evaluations',
      title: 'Ground-Truth Benchmark Suite',
      category: 'Governance',
      icon: BarChart3,
      action: () => navigate('/evaluations'),
    },
    {
      id: 'reports',
      title: 'Reports & Export Center',
      category: 'Reporting',
      icon: FileSpreadsheet,
      action: () => navigate('/reports'),
    },
    {
      id: 'audit',
      title: 'Compliance Audit Trail',
      category: 'Governance',
      icon: ShieldCheck,
      action: () => navigate('/audit'),
      shortcut: 'G A',
    },
    {
      id: 'data-sources',
      title: 'Data Sources & Razorpay Connector',
      category: 'Data',
      icon: Database,
      action: () => navigate('/data-sources'),
    },
    {
      id: 'settings',
      title: 'Organization & AI Settings',
      category: 'Settings',
      icon: Settings,
      action: () => navigate('/settings'),
      shortcut: 'G S',
    },
    {
      id: 'copilot',
      title: 'Open Finance Copilot (AI)',
      category: 'Actions',
      icon: Bot,
      action: () => onOpenCopilot(),
      shortcut: 'Ctrl+/',
    },
    {
      id: 'seed-demo',
      title: 'Run 100-Record Benchmark',
      category: 'Actions',
      icon: Zap,
      action: () => onSeedDemo(),
    },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/50">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, page name, or financial view..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No financial commands found matching "{query}"
            </div>
          ) : (
            filteredCommands.map((command, index) => {
              const Icon = command.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded text-xs transition-colors ${
                    isSelected ? 'bg-blue-50 text-[#0066ff]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#0066ff]' : 'text-slate-400'}`} />
                    <span className="font-semibold text-slate-900 truncate">{command.title}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider font-mono">
                      {command.category}
                    </span>
                  </div>

                  {command.shortcut && (
                    <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shadow-2xs">
                      {command.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 font-mono">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select with <kbd>↵ Enter</kbd></span>
          <span>Close with <kbd>Esc</kbd></span>
        </div>
      </div>
    </div>
  );
};
