export interface TrustStatus {
  domain: string;
  production_mode: "trusted" | "unknown";
  trusted_write_required: boolean;
  delegation_required: boolean;
  settlement_required: boolean;
  verification_provider: string | null;
  verify_endpoint: string | null;
  commit_mode: boolean;
}

export interface VerifyResult {
  valid: boolean;
  revoked?: boolean;
  matches_action?: boolean;
  budget_reserved?: boolean;
  trust_tier?: string;
  billable: false;
  reason?: string;
}

export interface ReceiptResult {
  receipt_id: string;
  settlement_status: string;
}

export interface AuthorizeResult {
  decision: string;
  action_class?: string;
  risk_level?: string;
  execution_token?: string;
  reserved_budget?: number;
  quota_reserved?: boolean;
  expires_at?: string;
  reason?: string;
}

export interface VeyraClientOptions {
  baseUrl?: string;
  apiKey?: string;
}

export const DEFAULT_BASE_URL = "https://api.veyra.dev";
