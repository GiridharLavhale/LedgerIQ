import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  CreditCard,
  Building2,
  Receipt,
  Layers,
  Sparkles,
} from 'lucide-react';
import { exceptionsApi } from '../../api';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const ExceptionDetailPage: React.FC = () => {
  const { exceptionId } = useParams<{ exceptionId: string }>();
  const queryClient = useQueryClient();
  const [actionNotes, setActionNotes] = useState('');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState<string>('');

  const { data: exception, isLoading } = useQuery({
    queryKey: ['exceptionDetail', exceptionId],
    queryFn: () => exceptionsApi.get(exceptionId!),
    enabled: !!exceptionId,
  });

  const actionMutation = useMutation({
    mutationFn: (payload: { action_type: string; notes?: string }) =>
      exceptionsApi.performAction(exceptionId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exceptionDetail', exceptionId] });
      queryClient.invalidateQueries({ queryKey: ['exceptionsQueue'] });
      setIsActionModalOpen(false);
      setActionNotes('');
    },
  });

  if (isLoading || !exception) {
    return <LoadingSkeleton rows={10} />;
  }

  const comparative = exception.comparative_ledger || {};

  const handleActionClick = (actionType: string) => {
    setModalActionType(actionType);
    setIsActionModalOpen(true);
  };

  const confirmAction = () => {
    actionMutation.mutate({
      action_type: modalActionType,
      notes: actionNotes || `Performed ${modalActionType} via Exception Workbench`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/exceptions"
            className="rounded border border-slate-300 bg-white p-2 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Exception Investigation: {exception.exception_type}</h2>
              <SeverityBadge severity={exception.severity} />
              <StatusBadge status={exception.status} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Exception ID: {exception.id}</p>
          </div>
        </div>

        {/* Action Center Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleActionClick('APPROVE_MATCH')}
            className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approve Match</span>
          </button>
          <button
            onClick={() => handleActionClick('REJECT_MATCH')}
            className="inline-flex items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Reject Match</span>
          </button>
          <button
            onClick={() => handleActionClick('RESOLVE')}
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#0066ff]" />
            <span>Resolve Exception</span>
          </button>
        </div>
      </div>

      {/* AI Root-Cause Investigation Card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded p-2 bg-white border border-blue-200 text-[#0066ff] shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Root-Cause & Verification Hypothesis</h3>
              <p className="text-[11px] text-slate-500">Deterministic ledger verification and recommended resolution</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-xs text-slate-500">AI Confidence:</span>
            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              {((exception.ai_confidence || 0.95) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Root Cause Explanation</span>
              <p className="text-sm text-slate-800 mt-1 font-sans leading-relaxed bg-white rounded border border-slate-200 p-3.5 shadow-sm">
                {exception.ai_explanation || 'Discrepancy analyzed by deterministic matching rules.'}
              </p>
            </div>

            {/* Evidence details */}
            {exception.evidence_json && Object.keys(exception.evidence_json).length > 0 && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verification Evidence</span>
                <div className="mt-1 rounded border border-slate-200 bg-white p-3 text-xs font-mono text-slate-800">
                  <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(exception.evidence_json, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="rounded border border-blue-200 bg-white p-4 space-y-3 shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-[#0066ff] uppercase tracking-wider">Recommended Operator Action</span>
              <p className="mt-1 text-sm font-bold text-slate-900 font-mono">
                {exception.ai_recommended_action || 'MANUAL_REVIEW'}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1 font-mono text-xs text-slate-700 tnum">
              <div className="flex justify-between">
                <span className="text-slate-500">Expected:</span>
                <span className="font-semibold">₹{exception.expected_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actual:</span>
                <span className="font-semibold">₹{exception.actual_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-700 border-t border-slate-100 pt-1">
                <span>Variance:</span>
                <span>₹{exception.difference_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Pane Comparative Ledger */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900">4-Pane Comparative Ledger</h3>
          <p className="text-xs text-slate-500">Side-by-side alignment across Payment, Settlement, Bank and Invoice</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. Payment Record */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-sky-700 font-bold text-xs">
                <CreditCard className="h-4 w-4" />
                <span>PAYMENT</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Gateway OMS</span>
            </div>
            {comparative.payment ? (
              <div className="space-y-2 text-xs font-mono text-slate-700 tnum">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Reference / Ext ID</span>
                  <span className="font-bold text-slate-900">{comparative.payment.reference_id || comparative.payment.external_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Gross:</span>
                  <span className="font-bold text-slate-900">₹{comparative.payment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">MDR Fee (2%):</span>
                  <span>₹{comparative.payment.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">GST (18%):</span>
                  <span>₹{comparative.payment.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1 text-emerald-700 font-bold">
                  <span className="font-sans">Expected Net:</span>
                  <span>₹{comparative.payment.net_amount.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans pt-1">
                  Date: {comparative.payment.date?.slice(0, 10)}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-sans">
                No payment record found (Orphan).
              </div>
            )}
          </div>

          {/* 2. Settlement Record */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                <Layers className="h-4 w-4" />
                <span>SETTLEMENT</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Gateway Batch</span>
            </div>
            {comparative.settlement ? (
              <div className="space-y-2 text-xs font-mono text-slate-700 tnum">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Reference</span>
                  <span className="font-bold text-slate-900">{comparative.settlement.reference_id || comparative.settlement.external_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Settled Amount:</span>
                  <span className="font-bold text-slate-900">₹{comparative.settlement.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Deducted Fee:</span>
                  <span>₹{comparative.settlement.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-100 pt-1">
                  <span className="font-sans">Net Credited:</span>
                  <span>₹{comparative.settlement.net_amount.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans pt-1">
                  Date: {comparative.settlement.date?.slice(0, 10)}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-sans">
                No settlement record attached.
              </div>
            )}
          </div>

          {/* 3. Bank Statement Record */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                <Building2 className="h-4 w-4" />
                <span>BANK RECORD</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Core Account</span>
            </div>
            {comparative.bank_statement ? (
              <div className="space-y-2 text-xs font-mono text-slate-700 tnum">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">UTR / Narrative</span>
                  <span className="font-bold text-slate-900">{comparative.bank_statement.external_id || comparative.bank_statement.reference_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Bank Credit:</span>
                  <span className="font-bold text-emerald-700">₹{comparative.bank_statement.amount.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans pt-1">
                  Value Date: {comparative.bank_statement.date?.slice(0, 10)}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-sans">
                No bank transaction located.
              </div>
            )}
          </div>

          {/* 4. Invoice / ERP Record */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs">
                <Receipt className="h-4 w-4" />
                <span>INVOICE</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">ERP Ledger</span>
            </div>
            {comparative.invoice ? (
              <div className="space-y-2 text-xs font-mono text-slate-700 tnum">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Invoice No</span>
                  <span className="font-bold text-slate-900">{comparative.invoice.reference_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Billed Amount:</span>
                  <span className="font-bold text-slate-900">₹{comparative.invoice.amount.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-sans">
                Invoice aligned with primary record.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action History / Audit Trail */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
          Operator Action History & Compliance Audit Log
        </h3>
        <div className="mt-3 divide-y divide-slate-100 font-mono text-xs">
          {exception.actions && exception.actions.length > 0 ? (
            exception.actions.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-50 text-[#0066ff] border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
                    {act.action_type}
                  </span>
                  <span className="font-sans text-slate-900 font-medium">{act.notes || 'Status transition logged'}</span>
                </div>
                <span className="text-slate-400 text-[11px]">{act.created_at.replace('T', ' ').slice(0, 19)} UTC</span>
              </div>
            ))
          ) : (
            <p className="py-4 text-slate-400 text-center font-sans">No manual actions taken yet.</p>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-modal space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Confirm Operator Action: {modalActionType}</h3>
            <p className="text-xs text-slate-500">
              This action will be immutably recorded in the compliance audit trail.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes / Justification</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Verified bank statement UTR manually. Matched net payout."
                rows={3}
                className="w-full rounded border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-[#0066ff] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={actionMutation.isPending}
                className="rounded bg-[#0066ff] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0050cc] transition-colors"
              >
                {actionMutation.isPending ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
