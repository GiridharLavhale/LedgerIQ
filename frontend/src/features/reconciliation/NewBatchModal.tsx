import React, { useState } from 'react';
import { X, Upload, Plus, FileText, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { uploadsApi, batchesApi } from '../../api';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (batchId: string) => void;
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState('PAYMENT');
  const [files, setFiles] = useState<{ id: string; name: string; rows: number; source: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeRate, setFeeRate] = useState('2.0');
  const [gstRate, setGstRate] = useState('18.0');
  const [dateTolerance, setDateTolerance] = useState('3');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const res = await uploadsApi.upload(file, sourceType);
        setFiles((prev) => [
          ...prev,
          { id: res.id, name: res.filename, rows: res.row_count, source: res.source_type },
        ]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload and parse file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!name.trim()) {
      setError('Please provide a batch name');
      return;
    }
    if (files.length === 0) {
      setError('Please upload at least one transaction file');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await batchesApi.create({
        name,
        upload_ids: files.map((f) => f.id),
        options: {
          fee_rate: parseFloat(feeRate) / 100.0,
          gst_rate: parseFloat(gstRate) / 100.0,
          date_tolerance_days: parseInt(dateTolerance, 10),
          amount_tolerance: 0.05,
        },
      });
      onSuccess(res.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to trigger reconciliation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-modal">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Create Reconciliation Batch</h3>
            <p className="text-xs text-slate-500">Ingest multi-source financial statements and run 4-tier matching</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 space-y-4 text-xs">
          {/* Batch Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Batch Reference Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. September 2026 Razorpay Gateway vs HDFC Bank Settlement Run"
              className="w-full rounded border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-[#0066ff] focus:outline-none"
            />
          </div>

          {/* Upload Dropzone */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Upload Financial Files (CSV, XLSX, JSON)</label>
            <div className="flex gap-2 mb-2">
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-[#0066ff] focus:outline-none"
              >
                <option value="PAYMENT">Gateway Payments Export</option>
                <option value="SETTLEMENT">Gateway Settlement Batch</option>
                <option value="BANK_STATEMENT">Core Bank Account Statement</option>
                <option value="INVOICE">ERP / Order Invoices</option>
              </select>

              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-blue-300 bg-blue-50/50 px-4 py-2 font-semibold text-[#0066ff] hover:bg-blue-50 transition-colors">
                <Upload className="h-4 w-4" />
                <span>{isUploading ? 'Parsing & Normalizing...' : 'Select Statement File'}</span>
                <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Ingested Files List */}
            {files.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#0066ff]" />
                      <span className="font-semibold text-slate-900">{f.name}</span>
                      <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700 uppercase font-mono font-bold">{f.source}</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-mono font-semibold">{f.rows} rows normalized</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Financial Parameters */}
          <div className="rounded border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Deterministic Statutory Parameters</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-600">MDR Fee Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={feeRate}
                  onChange={(e) => setFeeRate(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600">GST on Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-[#0066ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600">Date Window (Days)</label>
                <input
                  type="number"
                  value={dateTolerance}
                  onChange={(e) => setDateTolerance(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-[#0066ff] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateBatch}
            disabled={isSubmitting || files.length === 0}
            className="inline-flex items-center gap-2 rounded bg-[#0066ff] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0050cc] transition-colors disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{isSubmitting ? 'Executing 4-Tier Matching...' : 'Run Reconciliation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
