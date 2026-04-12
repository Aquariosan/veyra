import type { AuthorizeResult } from "./types.js";
import { DEFAULT_BASE_URL } from "./types.js";

export interface CommitRequiredBody {
  error: "VeyraCommitRequired";
  authorize_endpoint: string;
  verify_endpoint: string;
  retry_strategy: string;
  [key: string]: unknown;
}

export interface RecoveryOptions {
  baseUrl?: string;
  apiKey: string;
  agentId: string;
  actionType: string;
  target: string;
  targetTenantId?: string;
  protocol?: "mcp" | "http";
}

export interface RecoveryResult {
  token: string;
  actionClass: string;
  retryHeaders: { "X-Veyra-Token": string };
  retryFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

/**
 * Detect whether a response is a VeyraCommitRequired error.
 * Checks HTTP status 403 + either the JSON body or the
 * WWW-Authenticate header.
 */
export async function isVeyraCommitRequired(
  response: Response,
): Promise<boolean> {
  if (response.status !== 403) return false;

  const wwwAuth = response.headers.get("www-authenticate") ?? "";
  if (wwwAuth.includes("VeyraCommit")) return true;

  try {
    const clone = response.clone();
    const body = await clone.json();
    return body?.error === "VeyraCommitRequired";
  } catch {
    return false;
  }
}

/**
 * Handle a VeyraCommitRequired error by automatically authorizing
 * the action and returning a ready-to-use retry function.
 *
 * Usage:
 *   const res = await fetch(toolUrl, { method: 'POST', body })
 *   if (await isVeyraCommitRequired(res)) {
 *     const retry = await handleCommitRequired(res, { apiKey, agentId, actionType, target })
 *     await retry.retryFetch(toolUrl, { method: 'POST', body })
 *   }
 */
export async function handleCommitRequired(
  response: Response,
  options: RecoveryOptions,
): Promise<RecoveryResult> {
  // 1. Parse the commit-required body to get endpoints
  let authorizeEndpoint: string;
  try {
    const clone = response.clone();
    const body = (await clone.json()) as CommitRequiredBody;
    authorizeEndpoint =
      body.authorize_endpoint ??
      `${options.baseUrl ?? DEFAULT_BASE_URL}/v1/authorize-action`;
  } catch {
    authorizeEndpoint = `${options.baseUrl ?? DEFAULT_BASE_URL}/v1/authorize-action`;
  }

  // 2. Authorize the action
  const authBody: Record<string, string> = {
    agent_id: options.agentId,
    action_type: options.actionType,
    target: options.target,
  };
  if (options.targetTenantId) {
    authBody.target_tenant_id = options.targetTenantId;
  }

  const authRes = await fetch(authorizeEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": options.apiKey,
    },
    body: JSON.stringify(authBody),
  });

  if (!authRes.ok) {
    const text = await authRes.text();
    throw new Error(
      `Veyra authorize-action failed (${authRes.status}): ${text}`,
    );
  }

  const authResult = (await authRes.json()) as AuthorizeResult;

  if (authResult.decision !== "allow" || !authResult.execution_token) {
    throw new Error(
      `Veyra authorization denied: ${authResult.reason ?? authResult.decision}`,
    );
  }

  const token = authResult.execution_token;

  // 3. Return recovery result with retry helpers
  return {
    token,
    actionClass: authResult.action_class ?? "A",
    retryHeaders: { "X-Veyra-Token": token },
    retryFetch: (url: string, init?: RequestInit) =>
      fetch(url, {
        ...init,
        headers: {
          ...(init?.headers as Record<string, string> | undefined),
          "X-Veyra-Token": token,
        },
      }),
  };
}
