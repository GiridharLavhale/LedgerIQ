import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BarChart3, Play, CheckCircle2, Zap, ShieldCheck, Database } from 'lucide-react';
import { evaluationsApi } from '../../api';
import { EvaluationRun } from '../../types';
import { KPICard } from '../../components/KPICard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const EvaluationsPage: React.FC = () => {
  const [selectedSize, setSelectedSize] = useState<number>(100);
  const [selectedSeed, setSelectedSeed] = useState<number>(42);
  const [latestRun, setLatestRun] = useState<EvaluationRun | null>(null);

  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['evaluationsHistory'],
    queryFn: evaluationsApi.getHistory,
  });

  const benchmarkMutation = useMutation({
    mutationFn: (payload: { size: number; seed: number }) =>
      evaluationsApi.run(payload.size, payload.seed),
    onSuccess: (data) => {
      setLatestRun(data);
      refetch();
    },
  });

  const activeData = latestRun || (history && history.length > 0 ? history[0] : null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Evaluation & Benchmarking Suite</h2>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200 uppercase font-mono">
              Ground Truth Rigor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Repeatable synthetic testing against deterministic ground-truth labels for precision, recall, and throughput.
          </p>
        </div>
      </div>

      {/* Benchmark Control Bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Dataset Size</label>
              <div className="flex gap-2">
                {[50, 100, 500, 1000].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`rounded px-3 py-1.5 font-mono font-semibold transition-all ${
                      selectedSize === sz
                        ? 'bg-blue-50 text-[#0066ff] border border-blue-300'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sz} Records
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Seed (Determinism)</label>
              <input
                type="number"
                value={selectedSeed}
                onChange={(e) => setSelectedSeed(parseInt(e.target.value, 10) || 42)}
                className="w-24 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 font-mono focus:border-[#0066ff] focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => benchmarkMutation.mutate({ size: selectedSize, seed: selectedSeed })}
            disabled={benchmarkMutation.isPending}
            className="inline-flex items-center gap-2 rounded bg-[#0066ff] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0050cc] transition-all disabled:opacity-50 shadow-sm"
          >
            <Play className={`h-4 w-4 ${benchmarkMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{benchmarkMutation.isPending ? 'Executing Evaluation...' : 'Run Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Active Run Metric Scorecards */}
      {activeData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Precision"
              value={`${activeData.precision}%`}
              subtitle={`${activeData.correct_matches} correct / ${activeData.predicted_matches} predicted`}
              icon={CheckCircle2}
              accentColor="emerald"
            />
            <KPICard
              title="Recall"
              value={`${activeData.recall}%`}
              subtitle={`${activeData.correct_matches} / ${activeData.ground_truth_matches} ground truth`}
              icon={ShieldCheck}
              accentColor="blue"
            />
            <KPICard
              title="F1 Accuracy Score"
              value={`${activeData.f1_score}%`}
              subtitle="Harmonic mean of precision & recall"
              icon={Zap}
              accentColor="purple"
            />
            <KPICard
              title="Reconciliation Speed"
              value={`${activeData.throughput_rps} RPS`}
              subtitle={`${activeData.execution_time_ms} ms runtime`}
              icon={Zap}
              accentColor="amber"
            />
          </div>

          {/* Ground Truth Confusion Matrix & Category Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Confusion Matrix */}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
                Ground Truth Confusion Matrix
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center font-mono tnum">
                <div className="rounded border border-emerald-200 bg-emerald-50/50 p-4">
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-500">True Positives (TP)</span>
                  <p className="text-2xl font-bold text-emerald-800 mt-1">
                    {activeData.confusion_matrix?.true_positives || activeData.correct_matches}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-sans">Correctly Matched</span>
                </div>

                <div className="rounded border border-rose-200 bg-rose-50/50 p-4">
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-500">False Positives (FP)</span>
                  <p className="text-2xl font-bold text-rose-800 mt-1">
                    {activeData.confusion_matrix?.false_positives || activeData.false_matches}
                  </p>
                  <span className="text-[11px] text-rose-700 font-sans">False Matches</span>
                </div>

                <div className="rounded border border-amber-200 bg-amber-50/50 p-4">
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-500">False Negatives (FN)</span>
                  <p className="text-2xl font-bold text-amber-800 mt-1">
                    {activeData.confusion_matrix?.false_negatives || activeData.missed_matches}
                  </p>
                  <span className="text-[11px] text-amber-700 font-sans">Missed Matches</span>
                </div>

                <div className="rounded border border-blue-200 bg-blue-50/50 p-4">
                  <span className="text-[10px] uppercase font-sans font-bold text-slate-500">True Negatives (TN)</span>
                  <p className="text-2xl font-bold text-blue-800 mt-1">
                    {activeData.confusion_matrix?.true_negatives || 0}
                  </p>
                  <span className="text-[11px] text-blue-700 font-sans">Exceptions Preserved</span>
                </div>
              </div>
            </div>

            {/* Breakdown by Category */}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
                Matching Hierarchy Breakdown
              </h3>
              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between rounded bg-slate-50 p-3 border border-slate-200">
                  <span className="font-sans font-semibold text-slate-800">Level 1: Exact Gateway ID Matches</span>
                  <span className="font-bold text-[#0066ff]">
                    {activeData.breakdown_by_category?.exact_matches_detected || 0} pairs
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-50 p-3 border border-slate-200">
                  <span className="font-sans font-semibold text-slate-800">Level 4: Settlement Fee/Tax Aware Matches</span>
                  <span className="font-bold text-emerald-700">
                    {activeData.breakdown_by_category?.fee_tax_matches_detected || 0} pairs
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-50 p-3 border border-slate-200">
                  <span className="font-sans font-semibold text-slate-800">Level 3: Fuzzy Proximity Matches</span>
                  <span className="font-bold text-amber-700">
                    {activeData.breakdown_by_category?.fuzzy_matches_detected || 0} pairs
                  </span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-50 p-3 border border-slate-200">
                  <span className="font-sans font-semibold text-slate-800">Exceptions & Discrepancies Classified</span>
                  <span className="font-bold text-rose-700">
                    {activeData.breakdown_by_category?.exceptions_classified || 0} items
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500">
          Click "Run Benchmark" above to execute evaluation on deterministic synthetic data.
        </div>
      )}

      {/* Benchmark History Table */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
          Historical Benchmark Runs
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs tnum">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-2.5 px-3">Dataset Name</th>
                <th className="py-2.5 px-3">Records</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1 Score</th>
                <th className="py-2.5 px-3">Throughput</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {history && history.length > 0 ? (
                history.map((h) => (
                  <tr
                    key={h.id}
                    onClick={() => setLatestRun(h)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900">{h.dataset_name}</td>
                    <td className="py-3 px-3 text-slate-700">{h.record_count}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700">{h.precision}%</td>
                    <td className="py-3 px-3 font-bold text-[#0066ff]">{h.recall}%</td>
                    <td className="py-3 px-3 font-bold text-indigo-700">{h.f1_score}%</td>
                    <td className="py-3 px-3 text-slate-700">{h.throughput_rps} RPS</td>
                    <td className="py-3 px-3 text-slate-500 font-sans text-[11px]">{h.created_at.slice(0, 19).replace('T', ' ')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No benchmark history recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
