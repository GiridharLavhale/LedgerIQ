export type UserRole = 'ADMIN' | 'FINANCE_MANAGER' | 'FINANCE_ANALYST' | 'VIEWER';

export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: User;
}

export interface DataSource {
  id: string;
  org_id: string;
  name: string;
  source_type: string;
  file_format: string;
  schema_mapping: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export type BatchStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ReconciliationBatch {
  id: string;
  name: string;
  status: BatchStatus;
  total_records: number;
  matched_records: number;
  likely_matched_records: number;
  partial_matched_records: number;
  unmatched_records: number;
  exception_records: number;
  resolved_exceptions: number;
  match_rate: number;
  exception_rate: number;
  resolution_rate: number;
  total_volume: number;
  matched_volume: number;
  discrepancy_amount: number;
  total_fee_amount: number;
  total_tax_amount: number;
  processing_time_ms: number;
  throughput_rps: number;
  created_at: string;
  completed_at?: string;
  metadata_json?: Record<string, any>;
  notes?: string;
  created_by?: string;
}

export type SourceType = 'PAYMENT' | 'SETTLEMENT' | 'BANK_STATEMENT' | 'INVOICE' | 'FEE' | 'TAX' | 'REFUND';
export type TransactionStatus = 'UNRECONCILED' | 'MATCHED' | 'LIKELY_MATCH' | 'PARTIAL_MATCH' | 'EXCEPTION' | 'MANUAL_RESOLVED' | 'DUPLICATE' | 'INVALID';

export interface Transaction {
  id: string;
  batch_id: string;
  upload_id?: string;
  source_type: SourceType;
  source_name: string;
  external_id?: string;
  reference_id?: string;
  order_id?: string;
  amount: number;
  fee: number;
  tax: number;
  net_amount: number;
  currency: string;
  transaction_date: string;
  status: TransactionStatus;
  counterparty?: string;
  description?: string;
  raw_data: Record<string, any>;
  created_at: string;
}

export type MatchStrategy = 'EXACT_ID' | 'STRICT_COMPOSITE' | 'FUZZY_PROXIMITY' | 'SETTLEMENT_FEE_AWARE' | 'MANUAL_USER_MATCH';
export type MatchStatus = 'MATCHED' | 'LIKELY_MATCH' | 'PARTIAL_MATCH' | 'MANUAL_OVERRIDE';

export interface ReconciliationMatch {
  id: string;
  batch_id: string;
  primary_txn_id: string;
  matched_txn_id: string;
  strategy: MatchStrategy;
  confidence: number;
  status: MatchStatus;
  amount_difference: number;
  date_difference_days: number;
  calculated_fee: number;
  calculated_tax: number;
  evidence_summary: string;
  created_at: string;
  primary_txn?: Transaction;
  matched_txn?: Transaction;
}

export type ExceptionType = 
  | 'AMOUNT_MISMATCH'
  | 'MISSING_SETTLEMENT'
  | 'MISSING_PAYMENT'
  | 'DUPLICATE_TRANSACTION'
  | 'DATE_MISMATCH'
  | 'REFERENCE_MISMATCH'
  | 'FEE_DISCREPANCY'
  | 'TAX_DISCREPANCY'
  | 'PARTIAL_SETTLEMENT'
  | 'UNKNOWN';

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExceptionStatus = 'OPEN' | 'UNDER_INVESTIGATION' | 'APPROVED_MATCH' | 'REJECTED_MATCH' | 'RESOLVED' | 'IGNORED';

export interface ExceptionAction {
  id: string;
  action_type: string;
  previous_status?: string;
  new_status?: string;
  notes?: string;
  user_id?: string;
  created_at: string;
}

export interface ExceptionRecord {
  id: string;
  batch_id: string;
  transaction_id: string;
  exception_type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  expected_amount: number;
  actual_amount: number;
  difference_amount: number;
  evidence_json: Record<string, any>;
  ai_explanation?: string;
  ai_confidence?: number;
  ai_recommended_action?: string;
  ai_evidence?: any[];
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  transaction?: Transaction;
  actions?: ExceptionAction[];
  comparative_ledger?: {
    payment?: any;
    settlement?: any;
    bank_statement?: any;
    invoice?: any;
  };
}

export interface Citation {
  entity_type: string;
  entity_id: string;
  reference_code: string;
  amount?: number;
  status?: string;
  details?: string;
}

export interface ToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  result_summary: string;
}

export interface CopilotResponse {
  reply: string;
  session_id: string;
  citations: Citation[];
  tool_calls: ToolCall[];
  confidence: number;
  suggested_followups?: string[];
}

export interface EvaluationRun {
  id: string;
  dataset_name: string;
  record_count: number;
  seed: number;
  ground_truth_matches: number;
  predicted_matches: number;
  correct_matches: number;
  false_matches: number;
  missed_matches: number;
  precision: number;
  recall: number;
  f1_score: number;
  match_rate: number;
  exception_rate: number;
  execution_time_ms: number;
  throughput_rps: number;
  confusion_matrix: {
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    true_negatives: number;
  };
  breakdown_by_category: Record<string, any>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  target_entity: string;
  target_id: string;
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  ip_address?: string;
  request_id?: string;
  details?: string;
  created_at: string;
}

export interface VerificationResult {
  gross_amount: number;
  actual_net_amount: number;
  fee_rate_pct: number;
  gst_rate_pct: number;
  calculated_mdr_fee: number;
  calculated_gst_tax: number;
  total_deductions: number;
  expected_net_settlement: number;
  variance_amount: number;
  is_mathematically_verified: boolean;
  formula_proof: string;
  statutory_breakdown: Record<string, any>;
}
