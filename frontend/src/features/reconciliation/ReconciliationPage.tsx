import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Plus, Filter, ArrowRight } from 'lucide-react';
import { batchesApi } from '../../api';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { NewBatchModal } from './NewBatchModal';

export const ReconciliationPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: batches, isLoading, refetch } = useQuery({
    queryKey: ['batchesList'],
    queryFn: () => batchesApi.list(100),
  });

  const filteredBatches = (batches || []).filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Reconciliation Batches</h2>
          <p className="text-xs text-slate-500 mt-1">
            Multi-source financial matching runs, settlement verification and progress tracking.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded bg-[#0066ff] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0050cc] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Reconciliation Batch</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
        {['ALL', 'COMPLETED', 'PROCESSING', 'FAILED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === st
                ? 'bg-blue-50 text-[#0066ff] border border-blue-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tnum">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th className="py-3 px-3">Batch Name</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Total Ingested</th>
                  <th className="py-3 px-3">Match Rate</th>
                  <th className="py-3 px-3">Exceptions</th>
                  <th className="py-3 px-3">Gross Volume</th>
                  <th className="py-3 px-3">Discrepancy</th>
                  <th className="py-3 px-3">Throughput</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredBatches.length > 0 ? (
                  filteredBatches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-sans font-semibold text-slate-900">
                        <Link to={`/batches/${b.id}`} className="hover:text-[#0066ff] hover:underline">
                          {b.name}
                        </Link>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{b.id}</p>
                      </td>
                      <td className="py-3.5 px-3 font-sans">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3.5 px-3 text-slate-700">{b.total_records.toLocaleString()}</td>
                      <td className="py-3.5 px-3 font-bold text-emerald-700">{b.match_rate}%</td>
                      <td className="py-3.5 px-3 text-rose-700 font-bold">{b.exception_records}</td>
                      <td className="py-3.5 px-3 text-slate-700">
                        ₹{Number(b.total_volume || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-rose-700 font-semibold">
                        ₹{Number(b.discrepancy_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">{b.throughput_rps} RPS</td>
                      <td className="py-3.5 px-3 text-right font-sans">
                        <Link
                          to={`/batches/${b.id}`}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-[#0066ff] hover:text-[#0066ff] transition-all"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                      No reconciliation batches found. Create a new batch or run a demo benchmark.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewBatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(batchId) => {
          refetch();
          navigate(`/batches/${batchId}`);
        }}
      />
    </div>
  );
};
