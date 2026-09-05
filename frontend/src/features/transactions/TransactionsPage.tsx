import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Search, Filter, Download, Eye } from 'lucide-react';
import { transactionsApi } from '../../api';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { TransactionDrawer } from '../../components/TransactionDrawer';
import { Transaction } from '../../types';

export const TransactionsPage: React.FC = () => {
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['canonicalTransactions', sourceFilter, statusFilter, search],
    queryFn: () =>
      transactionsApi.list({
        source_type: sourceFilter === 'ALL' ? undefined : sourceFilter,
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search || undefined,
        limit: 100,
      }),
  });

  const exportCsv = () => {
    if (!transactions || transactions.length === 0) return;
    const headers = ['ID', 'Source Type', 'Source Feed', 'External ID', 'Reference ID', 'Gross Amount', 'Fee', 'Tax', 'Net Amount', 'Currency', 'Date', 'Status'];
    const rows = transactions.map((t) => [
      t.id,
      t.source_type,
      t.source_name,
      t.external_id || '',
      t.reference_id || '',
      t.amount,
      t.fee,
      t.tax,
      t.net_amount,
      t.currency,
      t.transaction_date,
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `canonical_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Canonical Transactions Ledger</h2>
          <p className="text-xs text-slate-500 mt-1">
            Normalized financial records across Gateway Payments, Settlements, Bank Feeds, and Invoices.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Ledger (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-semibold text-slate-700">Filters:</span>
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Source Types</option>
            <option value="PAYMENT">Payments (Gateway)</option>
            <option value="SETTLEMENT">Settlements (Gateway)</option>
            <option value="BANK_STATEMENT">Bank Statements</option>
            <option value="INVOICE">Invoices / Orders</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="MATCHED">Matched</option>
            <option value="EXCEPTION">Exception</option>
            <option value="UNRECONCILED">Unreconciled</option>
            <option value="MANUAL_RESOLVED">Manually Resolved</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, UTR, merchant..."
            className="w-full rounded border border-slate-300 bg-white pl-8 pr-3 py-1 text-xs text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tnum">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-3">Source Type</th>
                  <th className="py-3 px-3">Reference / Ext ID</th>
                  <th className="py-3 px-3">Counterparty</th>
                  <th className="py-3 px-3">Gross Amount</th>
                  <th className="py-3 px-3">MDR Fee</th>
                  <th className="py-3 px-3">GST Tax</th>
                  <th className="py-3 px-3">Net Amount</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {transactions && transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTxn(t)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                          {t.source_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-blue-700">
                        {t.external_id || t.reference_id || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-800 max-w-[150px] truncate" title={t.counterparty}>
                        {t.counterparty || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        ₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        ₹{Number(t.fee || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        ₹{Number(t.tax || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        ₹{Number(t.net_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {new Date(t.transaction_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxn(t);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
                      No canonical transactions found in current view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Slide-over Drawer */}
      <TransactionDrawer
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />
    </div>
  );
};
