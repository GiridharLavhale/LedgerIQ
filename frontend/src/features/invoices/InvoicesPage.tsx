import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Search, Filter, Eye } from 'lucide-react';
import { transactionsApi } from '../../api';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { TransactionDrawer } from '../../components/TransactionDrawer';
import { Transaction } from '../../types';

export const InvoicesPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoicesList', statusFilter],
    queryFn: () => transactionsApi.getInvoices({ status_filter: statusFilter === 'ALL' ? undefined : statusFilter, limit: 100 }),
  });

  const filtered = (invoices || []).filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (i.reference_id && i.reference_id.toLowerCase().includes(q)) ||
      (i.counterparty && i.counterparty.toLowerCase().includes(q)) ||
      (i.external_id && i.external_id.toLowerCase().includes(q)) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">ERP & Billing Invoices</h2>
            <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200 uppercase font-mono">
              OMS & ERP Feeds
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Order management records and commercial ERP invoices with customer counterparties and billed totals.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Filter Status:</span>
          {['ALL', 'MATCHED', 'UNRECONCILED', 'EXCEPTION'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-blue-50 text-[#0066ff] border border-blue-200'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice no, customer..."
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
                  <th className="py-3 px-3">Invoice Number / ID</th>
                  <th className="py-3 px-3">Customer Counterparty</th>
                  <th className="py-3 px-3">Billed Grand Total</th>
                  <th className="py-3 px-3">Invoice Date</th>
                  <th className="py-3 px-3">System Origin</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filtered.length > 0 ? (
                  filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedTxn(inv)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {inv.reference_id || inv.external_id || inv.id.slice(0, 10)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700 max-w-[150px] truncate" title={inv.counterparty}>
                        {inv.counterparty || 'Enterprise Client'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">₹{Number(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{new Date(inv.transaction_date).toLocaleDateString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800">{inv.source_name}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxn(inv);
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
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                      No billing invoices found in current view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TransactionDrawer
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />
    </div>
  );
};
