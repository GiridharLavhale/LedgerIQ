import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Zap,
  Clock,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import { batchesApi, reportsApi, exceptionsApi, auditApi } from '../../api';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { TransactionDrawer } from '../../components/TransactionDrawer';
import { Transaction } from '../../types';

export const BatchDetailPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const [activeTab, setActiveTab] = useState<'matches' | 'transactions' | 'exceptions' | 'overview'>('matches');
  const [searchQuery, setSearchQuery] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('ALL');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const { data: batch, isLoading: batchLoading } = useQuery({
    queryKey: ['batchDetail', batchId],
    queryFn: () => batchesApi.get(batchId!),
    enabled: !!batchId,
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['batchMatches', batchId],
    queryFn: () => batchesApi.getMatches(batchId!),
    enabled: !!batchId && activeTab === 'matches',
  });

  const { data: transactions, isLoading: txnsLoading } = useQuery({
    queryKey: ['batchTransactions', batchId],
    queryFn: () => batchesApi.getTransactions(batchId!),
    enabled: !!batchId && activeTab === 'transactions',
  });

  const { data: exceptions, isLoading: exceptionsLoading } = useQuery({
    queryKey: ['batchExceptions', batchId],
    queryFn: () => exceptionsApi.list({ batch_id: batchId }),
    enabled: !!batchId && (activeTab === 'exceptions' || activeTab === 'overview'),
  });

  if (batchLoading || !batch) {
    return <LoadingSkeleton rows={8} />;
  }

  const filteredMatches = (matches || []).filter((m) => {
    const matchesStrategy = strategyFilter === 'ALL' || m.strategy === strategyFilter;
    const matchesQuery =
      !searchQuery ||
      m.evidence_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.primary_txn_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.matched_txn_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStrategy && matchesQuery;
  });

  const filteredTxns = (transactions || []).filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.external_id && t.external_id.toLowerCase().includes(q)) ||
      (t.reference_id && t.reference_id.toLowerCase().includes(q)) ||
      (t.source_name && t.source_name.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.counterparty && t.counterparty.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/reconciliation"
            className="rounded border border-slate-300 bg-white p-2 text-slate-500 hover:text-slate-900 transition-colors shadow-2xs"
            title="Back to Batches"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{batch.name}</h2>
              <StatusBadge status={batch.status} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Batch ID: {batch.id} • Created: {new Date(batch.created_at).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => reportsApi.downloadReconciliation(batch.id, 'CSV')}
            className="flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => reportsApi.downloadReconciliation(batch.id, 'XLSX')}
            className="flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => reportsApi.downloadReconciliation(batch.id, 'PDF')}
            className="flex items-center gap-1.5 rounded bg-[#0066ff] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0050cc] transition-colors shadow-2xs"
          >
            <FileText className="h-3.5 w-3.5 text-white" />
            <span>PDF Executive Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Scorecard Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 rounded-lg border border-slate-200 bg-white p-4 font-mono tnum shadow-2xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Total Records</span>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{batch.total_records.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Matched Records</span>
          <p className="text-lg font-bold text-emerald-700 mt-0.5">{batch.matched_records.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Exceptions</span>
          <p className="text-lg font-bold text-rose-700 mt-0.5">{batch.exception_records}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Match Rate</span>
          <p className="text-lg font-bold text-[#0066ff] mt-0.5">{batch.match_rate}%</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Discrepancy</span>
          <p className="text-lg font-bold text-amber-700 mt-0.5">
            ₹{Number(batch.discrepancy_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Throughput</span>
          <p className="text-lg font-bold text-slate-800 mt-0.5">
            {batch.processing_time_ms}ms <span className="text-xs text-slate-400 font-sans">({batch.throughput_rps} rps)</span>
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'matches'
              ? 'border-[#0066ff] text-[#0066ff]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Matched Pairs ({batch.matched_records / 2 || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('exceptions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'exceptions'
              ? 'border-[#0066ff] text-[#0066ff]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Exception Queue ({batch.exception_records})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'transactions'
              ? 'border-[#0066ff] text-[#0066ff]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Canonical Transactions ({batch.total_records})</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'border-[#0066ff] text-[#0066ff]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Reconciliation Metrics</span>
        </button>
      </div>

      {/* TAB 1: MATCHES */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {/* Filter / Search toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search matched pairs or reference IDs..."
                className="text-xs bg-transparent focus:outline-none w-full sm:w-64 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={strategyFilter}
                onChange={(e) => setStrategyFilter(e.target.value)}
                className="text-xs rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Match Strategies</option>
                <option value="EXACT_ID">Level 1: Exact ID</option>
                <option value="STRICT_COMPOSITE">Level 2: Strict Composite</option>
                <option value="FUZZY_PROXIMITY">Level 3: Fuzzy Reference</option>
                <option value="SETTLEMENT_FEE_AWARE">Level 4: Settlement Fee/Tax Aware</option>
              </select>
            </div>
          </div>

          {matchesLoading ? (
            <LoadingSkeleton rows={6} />
          ) : filteredMatches.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 rounded-lg border border-slate-200 bg-white p-8">
              No matched records found matching current filter criteria.
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10 text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Strategy</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Amount Variance</th>
                      <th className="px-4 py-3">Date Delta</th>
                      <th className="px-4 py-3">Deterministic Evidence Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tnum">
                    {filteredMatches.map((m) => (
                      <tr key={m.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              m.strategy === 'SETTLEMENT_FEE_AWARE'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : m.strategy === 'EXACT_ID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {m.strategy}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          {(m.confidence * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          ₹{Number(m.amount_difference).toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {m.date_difference_days} day(s)
                        </td>
                        <td className="px-4 py-2.5 font-sans text-slate-800 text-[11px] max-w-md truncate" title={m.evidence_summary}>
                          {m.evidence_summary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXCEPTIONS */}
      {activeTab === 'exceptions' && (
        <div className="space-y-4">
          {exceptionsLoading ? (
            <LoadingSkeleton rows={6} />
          ) : (exceptions || []).length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 rounded-lg border border-slate-200 bg-white p-8 space-y-1">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-900">Zero Unreconciled Exceptions</p>
              <p>All records in this batch were successfully verified against counterpart ledgers.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Exception Category</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Discrepancy (INR)</th>
                      <th className="px-4 py-3">Root Cause Analysis</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(exceptions || []).map((exc) => (
                      <tr key={exc.id} className="hover:bg-rose-50/30 transition-colors font-mono tnum">
                        <td className="px-4 py-2.5 font-sans font-bold text-slate-900">
                          {exc.exception_type}
                        </td>
                        <td className="px-4 py-2.5 font-sans">
                          <SeverityBadge severity={exc.severity} />
                        </td>
                        <td className="px-4 py-2.5 font-sans">
                          <StatusBadge status={exc.status} />
                        </td>
                        <td className="px-4 py-2.5 font-bold text-rose-700">
                          ₹{Number(exc.difference_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2.5 font-sans text-slate-700 text-[11px] max-w-sm truncate" title={exc.ai_explanation || exc.ai_recommended_action}>
                          {exc.ai_explanation || exc.ai_recommended_action || 'Awaiting operator investigation'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-sans">
                          <Link
                            to={`/exceptions/${exc.id}`}
                            className="inline-flex items-center gap-1 rounded bg-[#0066ff] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0050cc] transition-colors shadow-2xs"
                          >
                            <span>Investigate</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CANONICAL TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw transactions..."
                className="text-xs bg-transparent focus:outline-none w-full sm:w-64 text-slate-900"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredTxns.length} records
            </span>
          </div>

          {txnsLoading ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Source Feed</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">External / Order ID</th>
                      <th className="px-4 py-3">Gross Amount</th>
                      <th className="px-4 py-3">Fee / Tax</th>
                      <th className="px-4 py-3">Net Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tnum">
                    {filteredTxns.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-sans font-medium text-slate-900">{t.source_name}</td>
                        <td className="px-4 py-2.5">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                            {t.source_type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-blue-700">{t.external_id || t.reference_id || 'N/A'}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2.5 text-slate-500">₹{Number(t.fee || 0).toFixed(2)} / ₹{Number(t.tax || 0).toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-700">₹{Number(t.net_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2.5 font-sans">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-2.5 text-right font-sans">
                          <button
                            onClick={() => setSelectedTxn(t)}
                            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RECONCILIATION METRICS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              4-Tier Hierarchy Matching Breakdown
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Level 1: Exact Identifier Match</span>
                  <span>100% Confidence</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Level 4: Settlement Fee/Tax Aware (MDR 2% + GST 18%)</span>
                  <span>95% Confidence</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Level 3: Fuzzy Proximity Match</span>
                  <span>85% Confidence</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              Statutory Fee & Tax Decomposition Proof
            </h3>
            <div className="rounded border border-slate-100 bg-slate-50/80 p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Payment Formula:</span>
                <span className="font-bold text-slate-900">Gross = Net + MDR + GST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Applied MDR Schedule:</span>
                <span className="font-semibold text-slate-900">2.00% Gateway Fee</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Applied GST Schedule:</span>
                <span className="font-semibold text-slate-900">18.00% on MDR</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500">Verification Source:</span>
                <span className="text-emerald-700 font-bold">100% Deterministic Code</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Transaction Detail Inspector Drawer */}
      <TransactionDrawer
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />
    </div>
  );
};
