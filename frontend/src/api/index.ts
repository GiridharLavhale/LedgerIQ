import { apiClient } from './client';
import {
  AuthResponse,
  ReconciliationBatch,
  Transaction,
  ReconciliationMatch,
  ExceptionRecord,
  CopilotResponse,
  EvaluationRun,
  AuditLog,
  User,
  DataSource,
  VerificationResult
} from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  demoLogin: async (): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/demo-login');
    return res.data;
  },
  register: async (payload: { email: string; password: string; full_name: string; org_name: string }): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/register', payload);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

export const dashboardApi = {
  getMetrics: async () => {
    const res = await apiClient.get('/dashboard/metrics');
    return res.data;
  },
};

export const dataSourcesApi = {
  list: async (): Promise<DataSource[]> => {
    const res = await apiClient.get('/data-sources');
    return res.data;
  },
  create: async (payload: { name: string; source_type: string; file_format?: string; schema_mapping?: any }): Promise<DataSource> => {
    const res = await apiClient.post('/data-sources', payload);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/data-sources/${id}`);
  },
};

export const transactionsApi = {
  list: async (params?: { source_type?: string; status_filter?: string; batch_id?: string; search?: string; limit?: number; offset?: number }): Promise<Transaction[]> => {
    const res = await apiClient.get('/transactions', { params });
    return res.data;
  },
  getPayments: async (params?: { status_filter?: string; batch_id?: string; limit?: number }): Promise<Transaction[]> => {
    const res = await apiClient.get('/transactions/payments', { params });
    return res.data;
  },
  getSettlements: async (params?: { status_filter?: string; batch_id?: string; limit?: number }): Promise<Transaction[]> => {
    const res = await apiClient.get('/transactions/settlements', { params });
    return res.data;
  },
  getBankStatements: async (params?: { status_filter?: string; batch_id?: string; limit?: number }): Promise<Transaction[]> => {
    const res = await apiClient.get('/transactions/bank-statements', { params });
    return res.data;
  },
  getInvoices: async (params?: { status_filter?: string; batch_id?: string; limit?: number }): Promise<Transaction[]> => {
    const res = await apiClient.get('/transactions/invoices', { params });
    return res.data;
  },
  get: async (id: string): Promise<Transaction> => {
    const res = await apiClient.get(`/transactions/${id}`);
    return res.data;
  },
};

export const batchesApi = {
  list: async (limit = 50, offset = 0): Promise<ReconciliationBatch[]> => {
    const res = await apiClient.get('/batches', { params: { limit, offset } });
    return res.data;
  },
  get: async (batchId: string): Promise<ReconciliationBatch> => {
    const res = await apiClient.get(`/batches/${batchId}`);
    return res.data;
  },
  getProgress: async (batchId: string) => {
    const res = await apiClient.get(`/batches/${batchId}/progress`);
    return res.data;
  },
  create: async (payload: { name: string; upload_ids: string[]; options?: any; notes?: string }): Promise<ReconciliationBatch> => {
    const res = await apiClient.post('/batches', payload);
    return res.data;
  },
  getTransactions: async (batchId: string, params?: { source_type?: string; status_filter?: string; limit?: number }): Promise<Transaction[]> => {
    const res = await apiClient.get(`/batches/${batchId}/transactions`, { params });
    return res.data;
  },
  getMatches: async (batchId: string, strategy?: string): Promise<ReconciliationMatch[]> => {
    const res = await apiClient.get(`/batches/${batchId}/matches`, { params: { strategy } });
    return res.data;
  },
};

export const verificationApi = {
  verifyPair: async (payload: { gross_amount: number; actual_net_amount: number; fee_rate?: number; gst_rate?: number; amount_tolerance?: number }): Promise<VerificationResult> => {
    const res = await apiClient.post('/verification/verify-pair', payload);
    return res.data;
  },
  getRules: async () => {
    const res = await apiClient.get('/verification/rules');
    return res.data;
  },
};

export const exceptionsApi = {
  list: async (params?: { batch_id?: string; status_filter?: string; severity?: string; exception_type?: string }): Promise<ExceptionRecord[]> => {
    const res = await apiClient.get('/exceptions', { params });
    return res.data;
  },
  get: async (exceptionId: string): Promise<ExceptionRecord> => {
    const res = await apiClient.get(`/exceptions/${exceptionId}`);
    return res.data;
  },
  performAction: async (exceptionId: string, payload: { action_type: string; notes?: string; target_user_id?: string; matched_transaction_id?: string }): Promise<ExceptionRecord> => {
    const res = await apiClient.post(`/exceptions/${exceptionId}/actions`, payload);
    return res.data;
  },
};

export const agentsApi = {
  analyzeBatch: async (batchId: string) => {
    const res = await apiClient.post('/agents/reconciliation-agent/analyze', { batch_id: batchId });
    return res.data;
  },
  investigateException: async (exceptionId: string) => {
    const res = await apiClient.post('/agents/exception-agent/investigate', { exception_id: exceptionId });
    return res.data;
  },
  generateReportNarrative: async (batchId: string) => {
    const res = await apiClient.post('/agents/report-agent/narrative', { batch_id: batchId });
    return res.data;
  },
};

export const copilotApi = {
  chat: async (message: string, sessionId?: string, batchId?: string): Promise<CopilotResponse> => {
    const res = await apiClient.post('/copilot/chat', { message, session_id: sessionId, batch_id: batchId });
    return res.data;
  },
};

export const evaluationsApi = {
  run: async (size = 100, seed = 42): Promise<EvaluationRun> => {
    const res = await apiClient.post('/evaluations/run', { size, seed });
    return res.data;
  },
  getHistory: async (): Promise<EvaluationRun[]> => {
    const res = await apiClient.get('/evaluations/history');
    return res.data;
  },
  seedDemo: async (size = 100, seed = 42): Promise<ReconciliationBatch> => {
    const res = await apiClient.post(`/evaluations/seed-demo?size=${size}&seed=${seed}`);
    return res.data;
  },
};

export const reportsApi = {
  downloadReconciliation: (batchId: string, format = 'CSV') => {
    window.open(`${apiClient.defaults.baseURL}/reports/reconciliation/${batchId}?format=${format}`, '_blank');
  },
};

export const auditApi = {
  list: async (params?: { action?: string; target_entity?: string }): Promise<AuditLog[]> => {
    const res = await apiClient.get('/audit', { params });
    return res.data;
  },
};

export const settingsApi = {
  get: async () => {
    const res = await apiClient.get('/settings');
    return res.data;
  },
  updateAi: async (payload: any) => {
    const res = await apiClient.post('/settings/ai-config', payload);
    return res.data;
  },
};

export const uploadsApi = {
  upload: async (file: File, sourceType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);
    const res = await apiClient.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const razorpayApi = {
  getStatus: async () => {
    const res = await apiClient.get('/integrations/razorpay/status');
    return res.data;
  },
  testConnection: async () => {
    const res = await apiClient.post('/integrations/razorpay/test-connection');
    return res.data;
  },
  sync: async (count: number = 50) => {
    const res = await apiClient.post('/integrations/razorpay/sync', { count });
    return res.data;
  },
  mockSync: async (count: number = 50) => {
    const res = await apiClient.post('/integrations/razorpay/mock-sync', { count });
    return res.data;
  },
};
