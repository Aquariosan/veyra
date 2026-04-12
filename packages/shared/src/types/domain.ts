export type ActionClass = "A" | "B" | "C" | "D";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type Protocol = "mcp" | "http";

export type DelegationStatus = "active" | "revoked" | "expired";

export type TokenStatus =
  | "issued"
  | "verified"
  | "consumed"
  | "expired"
  | "revoked";

export type ReceiptStatus = "pending" | "accepted" | "rejected";

export type SettlementStatus = "finalized" | "disputed" | "voided";

// authorize-action

export interface AuthorizeActionInput {
  agent_id: string;
  action_type: string;
  target: string;
  target_tenant_id?: string;
}

export interface AuthorizeActionOutput {
  authorized: boolean;
  delegation_id: string;
  quota_reserved?: boolean;
}

// issue_execution_token

export interface IssueTokenInput {
  tenant_id: string;
  delegation_id: string;
  agent_id: string;
  action_type: string;
  action_class: ActionClass;
}

export interface IssueTokenOutput {
  token: string;
  token_id: string;
  expires_at: string;
}

// verify-token

export interface VerifyTokenInput {
  token: string;
}

export interface VerifyTokenOutput {
  valid: boolean;
  token_id: string;
  agent_id: string;
  action_type: string;
  action_class: ActionClass;
  billable: false;
}

// submit-receipt

export interface SubmitReceiptInput {
  tenant_id: string;
  token_id: string;
  agent_id: string;
  action_type: string;
  action_class: ActionClass;
  protocol: Protocol;
  result?: Record<string, unknown>;
}

export interface SubmitReceiptOutput {
  receipt_id: string;
  status: ReceiptStatus;
}

// settle_action

export interface SettleActionInput {
  token: string;
  decision: "executed" | "voided";
}

export interface SettleActionOutput {
  settlement_id: string;
  amount_eur: number;
  status: SettlementStatus;
  settled_at: string;
}
