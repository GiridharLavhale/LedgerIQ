import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, Plus, CheckCircle2, Trash2, ShieldCheck, Zap, RefreshCw, Key, ExternalLink, AlertCircle } from 'lucide-react';
import { dataSourcesApi, razorpayApi } from '../../api';
import { DataSource } from '../../types';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const DataSourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState('PAYMENT');
  const [fileFormat, setFileFormat] = useState('CSV');
  const [connectionMessage, setConnectionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const { data: sources, isLoading } = useQuery({
    queryKey: ['dataSources'],
    queryFn: dataSourcesApi.list,
  });

  const { data: rzpStatus, isLoading: rzpLoading } = useQuery({
    queryKey: ['razorpayStatus'],
    queryFn: razorpayApi.getStatus,
  });

  const testConnMutation = useMutation({
    mutationFn: razorpayApi.testConnection,
    onSuccess: (data) => {
      setConnectionMessage({
        type: data.success ? 'success' : 'error',
        text: data.message,
      });
    },
    onError: (err: any) => {
      setConnectionMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to connect to Razorpay API.',
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (count: number) => razorpayApi.sync(count),
    onSuccess: (batch) => {
      queryClient.invalidateQueries();
      navigate(`/batches/${batch.id}`);
    },
    onError: (err: any) => {
      setConnectionMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to sync with Razorpay API.',
      });
    },
  });

  const mockSyncMutation = useMutation({
    mutationFn: (count: number) => razorpayApi.mockSync(count),
    onSuccess: (batch) => {
      queryClient.invalidateQueries();
      navigate(`/batches/${batch.id}`);
    },
    onError: (err: any) => {
      setConnectionMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to simulate Razorpay API sync.',
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; source_type: string; file_format: string }) =>
      dataSourcesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
      setIsModalOpen(false);
      setName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dataSourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name, source_type: sourceType, file_format: fileFormat });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Data Sources & Financial Feeds</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure integrations and statement feeds for Razorpay API, Core Bank Accounts, and ERP Ledgers.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded bg-[#0066ff] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0050cc] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Feed</span>
        </button>
      </div>

      {/* Razorpay Live Integration Card */}
      <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg p-2.5 bg-[#031635] text-white shadow-sm">
              <Zap className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Razorpay Direct REST API Connector</h3>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 uppercase font-mono">
                  Track 04 Core
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Direct async connector for <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/v1/payments</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/v1/settlements</code> with automatic paise-to-INR conversion, MDR fee (2%), and GST (18%) normalization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {rzpStatus?.configured ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Configured ({rzpStatus.key_id_masked})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span>Demo / Unconfigured</span>
              </span>
            )}
          </div>
        </div>

        {/* Status Message Alert */}
        {connectionMessage && (
          <div
            className={`rounded p-3 text-xs flex items-start gap-2 border ${
              connectionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {connectionMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <span>{connectionMessage.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3 text-xs">
          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
            <span>Endpoint: {rzpStatus?.base_url || 'https://api.razorpay.com/v1'}</span>
            <span>Auth: HTTP Basic (Key ID / Secret)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => testConnMutation.mutate()}
              disabled={testConnMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testConnMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{testConnMutation.isPending ? 'Testing...' : 'Check API Connection'}</span>
            </button>

            {rzpStatus?.configured && (
              <button
                onClick={() => syncMutation.mutate(50)}
                disabled={syncMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded bg-[#0066ff] px-3.5 py-1.5 font-semibold text-white hover:bg-[#0050cc] transition-colors disabled:opacity-50 shadow-sm"
              >
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                <span>{syncMutation.isPending ? 'Ingesting from Razorpay...' : 'Sync Live Razorpay Data (50 Txns)'}</span>
              </button>
            )}

            <button
              onClick={() => mockSyncMutation.mutate(50)}
              disabled={mockSyncMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
              title="Test the complete Razorpay API ingestion, paise normalization, and reconciliation pipeline offline"
            >
              <Database className="h-3.5 w-3.5 text-amber-700" />
              <span>{mockSyncMutation.isPending ? 'Simulating...' : 'Simulate Razorpay API Sync (50 Txns)'}</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
          {sources && sources.map((ds) => (
            <div key={ds.id} className="rounded-lg border border-slate-200 bg-white p-5 space-y-4 hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded p-2.5 bg-blue-50 border border-blue-100 text-[#0066ff]">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{ds.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase font-mono">
                        {ds.source_type}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">Format: {ds.file_format}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                    Active
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(ds.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete connection"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Schema mapping fields */}
              <div className="rounded border border-slate-100 bg-slate-50/60 p-3 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Applied Column Aliases
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700">
                  {Object.entries(ds.schema_mapping || {}).map(([canonical, raw]) => (
                    <div key={canonical} className="flex justify-between border-b border-slate-200/50 pb-0.5">
                      <span className="text-slate-500">{canonical}:</span>
                      <span className="font-semibold text-slate-900">{String(raw)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-modal">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">Register New Data Source</h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Razorpay Payment Gateway Live"
                  required
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-[#0066ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Classification Type</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-[#0066ff] focus:outline-none"
                >
                  <option value="PAYMENT">Payment Gateway (Gross Payments)</option>
                  <option value="SETTLEMENT">Settlement Batch (Net Gateway Payouts)</option>
                  <option value="BANK_STATEMENT">Core Banking Feed (Debits & Credits)</option>
                  <option value="INVOICE">ERP / Invoices (OMS Orders)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">File Format</label>
                <select
                  value={fileFormat}
                  onChange={(e) => setFileFormat(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-[#0066ff] focus:outline-none"
                >
                  <option value="CSV">CSV Tabular Delimited</option>
                  <option value="XLSX">Excel Workbook (.xlsx)</option>
                  <option value="JSON">JSON / REST Webhook Payload</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded bg-[#0066ff] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0050cc] disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Register Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
