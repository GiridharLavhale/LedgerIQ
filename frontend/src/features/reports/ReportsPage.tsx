import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Download, FileText, CheckCircle2, Layers } from 'lucide-react';
import { batchesApi, reportsApi } from '../../api';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const ReportsPage: React.FC = () => {
  const { data: batches, isLoading } = useQuery({
    queryKey: ['batchesList'],
    queryFn: () => batchesApi.list(50),
  });

  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const activeBatch = batches?.find((b) => b.id === (selectedBatchId || batches[0]?.id));

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Financial Reports & Statements</h2>
        <p className="text-xs text-slate-500 mt-1">
          Export audit-ready reconciliation statements, exception manifests, and executive summaries.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <div className="space-y-6">
          {/* Batch Selector Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Batch to Export</label>
              <select
                value={selectedBatchId || (batches && batches.length > 0 ? batches[0].id : '')}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full max-w-md rounded border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-[#0066ff] focus:outline-none"
              >
                {batches &&
                  batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.total_records} txns — {b.match_rate}% match)
                    </option>
                  ))}
              </select>
            </div>

            {activeBatch && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
                {/* 1. CSV Data Export */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Download className="h-5 w-5 text-[#0066ff]" />
                    <h4 className="text-sm font-bold text-slate-900">CSV Ledger Export</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Complete tabular record of all transactions with raw parameters, fees, taxes, and match status.
                  </p>
                  <button
                    onClick={() => reportsApi.downloadReconciliation(activeBatch.id, 'CSV')}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  >
                    Download CSV
                  </button>
                </div>

                {/* 2. Multi-Sheet Excel */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">Excel Workbook (XLSX)</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Formatted multi-sheet workbook including Executive Summary, Matches Log, and Exception Manifest.
                  </p>
                  <button
                    onClick={() => reportsApi.downloadReconciliation(activeBatch.id, 'XLSX')}
                    className="w-full rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    Download Excel (XLSX)
                  </button>
                </div>

                {/* 3. Formal Executive PDF */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <FileText className="h-5 w-5 text-[#0066ff]" />
                    <h4 className="text-sm font-bold text-slate-900">Executive PDF Report</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Printable compliance report with KPI summaries, top exception breakdown, and auditor sign-off.
                  </p>
                  <button
                    onClick={() => reportsApi.downloadReconciliation(activeBatch.id, 'PDF')}
                    className="w-full rounded bg-[#0066ff] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0050cc] transition-colors shadow-sm"
                  >
                    Download Official PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
