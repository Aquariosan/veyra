import type {
  TrustStatus,
  VerifyResult,
  ReceiptResult,
  AuthorizeResult,
  VeyraClientOptions,
} from "./types.js";
import { DEFAULT_BASE_URL } from "./types.js";
import { checkTrustStatus } from "./preflight.js";
import { verifyVeyraToken } from "./verify.js";
import { submitVeyraReceipt } from "./receipt.js";

export class VeyraClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(options?: VeyraClientOptions) {
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
    this.apiKey = options?.apiKey;
  }

  private get opts(): VeyraClientOptions {
    return { baseUrl: this.baseUrl, apiKey: this.apiKey };
  }

  async checkTrustStatus(domain: string): Promise<TrustStatus> {
    return checkTrustStatus(domain, this.opts);
  }

  async verifyToken(token: string): Promise<VerifyResult> {
    return verifyVeyraToken(token, this.opts);
  }

  async submitReceipt(
    token: string,
    protocol: "mcp" | "http",
    result?: Record<string, unknown>,
  ): Promise<ReceiptResult> {
    return submitVeyraReceipt(token, protocol, result, this.opts);
  }

  async authorizeAction(
    agentId: string,
    actionType: string,
    target: string,
    targetTenantId?: string,
  ): Promise<AuthorizeResult> {
    if (!this.apiKey)
      throw new Error("apiKey is required for authorizeAction");

    const body: Record<string, string> = {
      agent_id: agentId,
      action_type: actionType,
      target,
    };
    if (targetTenantId) body.target_tenant_id = targetTenantId;

    const res = await fetch(`${this.baseUrl}/v1/authorize-action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`authorize-action failed (${res.status}): ${text}`);
    }

    return (await res.json()) as AuthorizeResult;
  }
}
