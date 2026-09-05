import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K', desc: 'Open Command Palette / Global Search' },
    { key: '?', desc: 'Open Keyboard Shortcuts Cheat Sheet' },
    { key: 'Ctrl + /', desc: 'Open Grounded Finance Copilot Drawer' },
    { key: 'G then D', desc: 'Navigate to Operations Dashboard' },
    { key: 'G then R', desc: 'Navigate to Reconciliation Batches' },
    { key: 'G then E', desc: 'Navigate to Exception Workbench' },
    { key: 'G then T', desc: 'Navigate to Canonical Ledger' },
    { key: 'G then V', desc: 'Navigate to Independent Verifier' },
    { key: 'G then A', desc: 'Navigate to Compliance Audit Trail' },
    { key: 'G then S', desc: 'Navigate to Organization & AI Settings' },
    { key: 'Esc', desc: 'Close open modal, drawer, or search dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Keyboard className="h-4 w-4 text-[#0066ff]" />
            <span>FinOps Enterprise Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {shortcuts.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 text-xs">
              <span className="text-slate-600 font-medium">{item.desc}</span>
              <kbd className="rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold text-slate-800 shadow-2xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-3 flex justify-between items-center text-[11px] text-slate-500 font-mono">
          <span>LedgerIQ Institutional FinOps</span>
          <button
            onClick={onClose}
            className="rounded bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
