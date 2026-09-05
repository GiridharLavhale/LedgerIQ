import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Filter,
  ArrowRight,
  Search,
  Download,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { exceptionsApi } from '../../api';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

const EXCEPTION_TYPES = [
  'ALL',
  'AMOUNT_MISMATCH',
  'MISSING_SETTLEMENT',
  'MISSING_PAYMENT',
  'DUPLICATE_TRANSACTION',
  'DATE_MISMATCH',
  'FEE_DISCREPANCY',
  'TAX_DISCREPANCY',
  'PARTIAL_SETTLEMENT',
  'UNKNOWN',
];

export const ExceptionsPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: exceptions, isLoading } = useQuery({
    queryKey: ['exceptionsQueue', selectedType, selectedStatus, selectedSeverity],
    queryFn: () =>
      exceptionsApi.list({
        exception_type: selectedType === 'ALL' ? undefined : selectedType,
        status_filter: selectedStatus === 'ALL' ? undefined : selectedStatus,
        severity: selectedSeverity === 'ALL' ? undefined : selectedSeverity,
      }),
  });

  const filteredExceptions = (exceptions || []).filter((exc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      exc.exception_type.toLowerCase().includes(q) ||
      (exc.ai_explanation && exc.ai_explanation.toLowerCase().includes(q)) ||
      (exc.ai_recommended_action && exc.ai_recommended_action.toLowerCase().includes(q)) ||
      exc.id.toLowerCase().includes(q)
    );
  });

  const totalDiscrepancy = filteredExceptions.reduce(
    (sum, e) => sum + (Number(e.difference_amount) || 0),
    0
  );
  const criticalCount = filteredExceptions.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
  const resolvedCount = filteredExceptions.filter((e) => e.status === 'RESOLVED').length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredExceptions.map((x) => x.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const exportSelectedCsv = () => {
    const records = filteredExceptions.filter((e) => selectedIds.length === 0 || selectedIds.includes(e.id));
    const headers = ['ID', 'Exception Type', 'Severity', 'Status', 'Discrepancy (INR)', 'AI Explanation', 'Created At'];
    const rows = records.map((r) => [
      r.id,
      r.exception_type,
      r.severity,
      r.status,
      r.difference_amount,
      `"${(r.ai_explanation || r.ai_recommended_action || '').replace(/"/g, '""')}"`,
      r.created_at,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `exceptions_queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Exception Triage Workbench</h2>
            <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200 uppercase font-mono">
              Audit & Resolution Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Investigate multi-source financial variances, review AI root-cause hypotheses, and execute audited human resolutions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSelectedCsv}
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border border-slate-200 bg-white p-4 font-mono tnum shadow-2xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Total Exceptions</span>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{filteredExceptions.length}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Total Unreconciled Variance</span>
          <p className="text-lg font-bold text-rose-700 mt-0.5">
            ₹{totalDiscrepancy.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">High / Critical Severity</span>
          <p className="text-lg font-bold text-amber-700 mt-0.5">{criticalCount}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Resolution State</span>
          <p className="text-lg font-bold text-emerald-700 mt-0.5">
            {resolvedCount} <span className="text-xs text-slate-400 font-sans">resolved</span>
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exceptions by type, root cause, or ID..."
            className="w-full text-xs bg-transparent focus:outline-none text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none"
          >
            {EXCEPTION_TYPES.map((t) => (
              <option key={t} value={t}>
                Category: {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Status: Open</option>
            <option value="UNDER_INVESTIGATION">Status: Under Investigation</option>
            <option value="RESOLVED">Status: Resolved</option>
            <option value="REJECTED_MATCH">Status: Rejected Match</option>
          </select>

          {/* Severity selector */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : filteredExceptions.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 space-y-2 shadow-2xs">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No Exceptions in Selected View</h3>
          <p>No financial records currently match the selected severity and category filters.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredExceptions.length && filteredExceptions.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-[#0066ff] focus:ring-0"
                    />
                  </th>
                  <th className="px-4 py-3">Exception Category</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Variance Amount</th>
                  <th className="px-4 py-3">AI Root-Cause Explanation</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tnum">
                {filteredExceptions.map((exc) => {
                  const isSelected = selectedIds.includes(exc.id);
                  return (
                    <tr
                      key={exc.id}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(exc.id)}
                          className="rounded border-slate-300 text-[#0066ff] focus:ring-0"
                        />
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <span className="font-bold text-slate-900 block">{exc.exception_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {exc.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <SeverityBadge severity={exc.severity} />
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <StatusBadge status={exc.status} />
                      </td>
                      <td className="px-4 py-3 font-bold text-rose-700">
                        ₹{Number(exc.difference_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-700 text-[11px] max-w-xs truncate" title={exc.ai_explanation || exc.ai_recommended_action}>
                        {exc.ai_explanation || exc.ai_recommended_action || 'Awaiting operator investigation'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(exc.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-sans">
                        <Link
                          to={`/exceptions/${exc.id}`}
                          className="inline-flex items-center gap-1 rounded bg-[#0066ff] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0050cc] transition-colors shadow-2xs"
                        >
                          <span>Investigate</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
