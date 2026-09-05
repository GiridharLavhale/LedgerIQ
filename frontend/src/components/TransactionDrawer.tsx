import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ArrowRight, ShieldCheck, Database, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { Transaction } from '../types';
import { StatusBadge } from './StatusBadge';

interface TransactionDrawerProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({ transaction, onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!transaction) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold font-mono text-slate-800 uppercase">
                {transaction.source_type}
              </span>
              <StatusBadge status={transaction.status} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">Transaction Detail</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Primary Amount Card */}
          <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-blue-50/40 to-slate-50 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
              Financial Monetary Breakdown
            </span>
            <div className="grid grid-cols-2 gap-3 font-mono tnum">
              <div>
                <span className="text-slate-500 text-[11px]">Gross Amount:</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  ₹{Number(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Net Amount:</span>
                <p className="text-base font-bold text-emerald-700 mt-0.5">
                  ₹{Number(transaction.net_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">MDR Gateway Fee:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  ₹{Number(transaction.fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">GST on MDR (18%):</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  ₹{Number(transaction.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Canonical Identifiers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-[#0066ff]" />
              <span>Identifiers & Entity Mapping</span>
            </h4>

            <div className="space-y-2 font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans uppercase block">Internal Record ID</span>
                  <span className="text-[11px] text-slate-900 font-semibold">{transaction.id}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(transaction.id, 'id')}
                  className="p-1 text-slate-400 hover:text-slate-800"
                  title="Copy ID"
                >
                  {copiedField === 'id' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {transaction.external_id && (
                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans uppercase block">Gateway External ID</span>
                    <span className="text-[11px] text-blue-700 font-bold">{transaction.external_id}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(transaction.external_id!, 'ext')}
                    className="p-1 text-slate-400 hover:text-slate-800"
                  >
                    {copiedField === 'ext' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}

              {transaction.reference_id && (
                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans uppercase block">Reference ID / Order ID / UTR</span>
                    <span className="text-[11px] text-indigo-700 font-semibold">{transaction.reference_id}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(transaction.reference_id!, 'ref')}
                    className="p-1 text-slate-400 hover:text-slate-800"
                  >
                    {copiedField === 'ref' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Metadata attributes */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#0066ff]" />
              <span>Operational Metadata</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Source Feed:</span>
                <span className="font-semibold text-slate-900">{transaction.source_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Transaction Date:</span>
                <span className="font-mono text-slate-900">
                  {new Date(transaction.transaction_date).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Counterparty:</span>
                <span className="font-medium text-slate-900">{transaction.counterparty || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Currency:</span>
                <span className="font-mono font-bold text-slate-900">{transaction.currency}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Description / Narration:</span>
                <span className="text-slate-800">{transaction.description || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Raw JSON Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">Raw Ingestion Payload (JSON)</h4>
              <span className="text-[10px] text-slate-400 font-mono">Immutable audit source</span>
            </div>
            <pre className="rounded bg-slate-900 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(transaction.raw_data || {}, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 text-xs font-mono text-slate-500">
          <span>Batch ID: {transaction.batch_id?.slice(0, 8)}...</span>
          <button
            onClick={onClose}
            className="rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-1.5 transition-colors font-sans"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
