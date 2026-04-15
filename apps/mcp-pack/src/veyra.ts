import type { PackTool } from "./tools.js";

const VEYRA_BASE_URL = process.env.VEYRA_BASE_URL ?? "https://api.veyra.to";

export interface VeyraCommitRequired {
  error: "VeyraCommitRequired";
  message: string;
  currentMode: "open";
  requiredMode: "commit";
  transitionStrategy: "authorize_then_retry_with_x_veyra_token";
  provider: "veyra";
  authorize_endpoint: string;
  verify_endpoint: string;
  receipt_endpoint: string;
  settle_endpoint: string;
  docs_url: string;
  install: string;
  retry_strategy: "authorize_then_retry_with_x_veyra_token";
  action_hint?: string;
  tool_family?: string;
  side_effects?: {
    risk_class?: string;
    outcome_type?: string;
    is_external?: boolean;
    is_reversible?: boolean;
    side_effect_class?: string;
  };
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  claims?: Record<string, unknown>;
}

export async function verifyToken(token: string): Promise<VerificationResult> {
  try {
    const res = await fetch(`${VEYRA_BASE_URL}/v1/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      return { valid: false, reason: `verify_http_${res.status}` };
    }
    const body = (await res.json()) as { valid?: boolean; reason?: string } & Record<
      string,
      unknown
    >;
    if (body && body.valid === true) {
      return { valid: true, claims: body };
    }
    return { valid: false, reason: (body && body.reason) || "invalid_token" };
  } catch {
    return { valid: false, reason: "verify_endpoint_unreachable" };
  }
}

export function buildCommitRequired(
  tool: PackTool,
  reason?: string,
): VeyraCommitRequired {
  const base: VeyraCommitRequired = {
    error: "VeyraCommitRequired",
    message: reason
      ? `Write operations require Veyra commit mode. Previous token rejected: ${reason}.`
      : "Write operations require Veyra commit mode.",
    currentMode: "open",
    requiredMode: "commit",
    transitionStrategy: "authorize_then_retry_with_x_veyra_token",
    provider: "veyra",
    authorize_endpoint: `${VEYRA_BASE_URL}/v1/authorize-action`,
    verify_endpoint: `${VEYRA_BASE_URL}/v1/verify-token`,
    receipt_endpoint: `${VEYRA_BASE_URL}/v1/submit-receipt`,
    settle_endpoint: `${VEYRA_BASE_URL}/v1/settle-action`,
    docs_url: "https://veyra.to",
    install: "npm install @veyrahq/sdk-node",
    retry_strategy: "authorize_then_retry_with_x_veyra_token",
    action_hint: tool.operation ?? tool.name,
    tool_family: tool.tool_family,
    side_effects: {
      risk_class: tool.risk_class,
      outcome_type: tool.outcome_type,
      is_external: tool.is_external,
      is_reversible: tool.is_reversible,
      side_effect_class: tool.side_effect_class,
    },
  };
  return base;
}

export function veyraBaseUrl(): string {
  return VEYRA_BASE_URL;
}
