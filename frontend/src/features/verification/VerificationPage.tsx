import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calculator, CheckCircle2, AlertOctagon, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { verificationApi } from '../../api';
import { VerificationResult } from '../../types';

export const VerificationPage: React.FC = () => {
  const [grossAmount, setGrossAmount] = useState<string>('10000');
  const [netAmount, setNetAmount] = useState<string>('9764');
  const [feeRate, setFeeRate] = useState<string>('2.0');
  const [gstRate, setGstRate] = useState<string>('18.0');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const { data: rulesData } = useQuery({
    queryKey: ['verificationRules'],
    queryFn: verificationApi.getRules,
  });

  const verifyMutation = useMutation({
    mutationFn: (payload: { gross_amount: number; actual_net_amount: number; fee_rate: number; gst_rate: number }) =>
      verificationApi.verifyPair(payload),
    onSuccess: (data) => {
      setVerificationResult(data);
    },
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({
      gross_amount: parseFloat(grossAmount) || 0,
      actual_net_amount: parseFloat(netAmount) || 0,
      fee_rate: (parseFloat(feeRate) || 2.0) / 100.0,
      gst_rate: (parseFloat(gstRate) || 18.0) / 100.0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Independent Mathematical Verification Engine</h2>
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 uppercase font-mono">
            Zero LLM Math • Ground Truth Source
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Enforces deterministic statutory decomposition: Gross Payment − MDR Fee (2%) − GST (18%) = Net Settlement.
        </p>
      </div>

      {/* Interactive Verification Workbench */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Inputs */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Calculator className="h-4 w-4 text-[#0066ff]" />
            <h3 className="text-sm font-bold text-slate-900">Test Financial Reconciliation Pair</h3>
          </div>

          <form onSubmit={handleVerify} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gross Payment Amount (INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  required
                  className="w-full rounded border border-slate-300 bg-white pl-7 pr-3 py-1.5 text-xs text-slate-900 font-mono focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Actual Net Settlement Credit (INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={netAmount}
                  onChange={(e) => setNetAmount(e.target.value)}
                  required
                  className="w-full rounded border border-slate-300 bg-white pl-7 pr-3 py-1.5 text-xs text-slate-900 font-mono focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">MDR Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={feeRate}
                  onChange={(e) => setFeeRate(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 font-mono focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GST on Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 font-mono focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifyMutation.isPending}
              className="w-full mt-3 flex items-center justify-center gap-1.5 rounded bg-[#0066ff] py-2 text-xs font-semibold text-white hover:bg-[#0050cc] transition-colors disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{verifyMutation.isPending ? 'Verifying...' : 'Execute Mathematical Verification'}</span>
            </button>
          </form>

          {/* Quick preset buttons */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Preset Examples</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setGrossAmount('10000'); setNetAmount('9764'); }}
                className="text-[11px] rounded bg-slate-50 border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100 font-mono"
              >
                ₹10,000 → ₹9,764 (Match)
              </button>
              <button
                type="button"
                onClick={() => { setGrossAmount('10000'); setNetAmount('9500'); }}
                className="text-[11px] rounded bg-slate-50 border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100 font-mono"
              >
                ₹10,000 → ₹9,500 (Leakage)
              </button>
            </div>
          </div>
        </div>

        {/* Verification Proof & Output */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Deterministic Mathematical Proof</h3>
            {verificationResult && (
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-bold font-mono uppercase ${
                  verificationResult.is_mathematically_verified
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {verificationResult.is_mathematically_verified ? 'VERIFIED RECONCILED' : 'DISCREPANCY DETECTED'}
              </span>
            )}
          </div>

          {verificationResult ? (
            <div className="space-y-4 font-mono text-xs">
              <div className="rounded border border-slate-200 bg-slate-50 p-3.5 text-slate-800 font-sans leading-relaxed">
                <span className="font-semibold text-slate-900 block mb-1">Mathematical Formula Proof:</span>
                <p className="text-xs font-mono">{verificationResult.formula_proof}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded border border-slate-200 bg-white p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-sans block">Calculated MDR Fee</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">
                    ₹{verificationResult.calculated_mdr_fee.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500">({verificationResult.fee_rate_pct}%)</span>
                </div>

                <div className="rounded border border-slate-200 bg-white p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-sans block">Calculated GST Tax</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">
                    ₹{verificationResult.calculated_gst_tax.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500">({verificationResult.gst_rate_pct}%)</span>
                </div>

                <div className="rounded border border-slate-200 bg-white p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-sans block">Expected Net Payout</span>
                  <span className="text-base font-bold text-emerald-700 mt-1 block">
                    ₹{verificationResult.expected_net_settlement.toFixed(2)}
                  </span>
                </div>

                <div className="rounded border border-slate-200 bg-white p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-sans block">Detected Variance</span>
                  <span
                    className={`text-base font-bold mt-1 block ${
                      verificationResult.variance_amount === 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    ₹{verificationResult.variance_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Statutory Tax Decomposition */}
              <div className="rounded border border-slate-200 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 font-sans">
                  Indian Statutory GST & Payout Decomposition (CGST + SGST / IGST)
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700">
                  <div>
                    <span className="text-slate-500 block">CGST (9%):</span>
                    <span className="font-semibold text-slate-900">₹{verificationResult.statutory_breakdown?.cgst_9pct || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SGST (9%):</span>
                    <span className="font-semibold text-slate-900">₹{verificationResult.statutory_breakdown?.sgst_9pct || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Effective Deductions:</span>
                    <span className="font-semibold text-slate-900">{verificationResult.statutory_breakdown?.effective_deduction_rate_pct}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Enter gross and net amounts on the left or click a preset to execute deterministic verification.
            </div>
          )}
        </div>
      </div>

      {/* Matching Rules Hierarchy Table */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
          Deterministic 4-Tier Matching Hierarchy Rules
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-2.5 px-3">Rule Tier ID</th>
                <th className="py-2.5 px-3">Hierarchy Match Strategy</th>
                <th className="py-2.5 px-3">Confidence Score</th>
                <th className="py-2.5 px-3">Mathematical Matching Logic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {rulesData && rulesData.rules?.map((r: any) => (
                <tr key={r.rule_id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 font-semibold text-slate-900">{r.rule_id}</td>
                  <td className="py-3 px-3 font-sans font-semibold text-slate-800">{r.name}</td>
                  <td className="py-3 px-3 font-bold text-emerald-700">{(r.confidence * 100).toFixed(0)}%</td>
                  <td className="py-3 px-3 font-sans text-slate-600 max-w-md">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
