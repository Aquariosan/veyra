import type { ReceiptResult, VeyraClientOptions } from "./types.js";
import { DEFAULT_BASE_URL } from "./types.js";

export async function submitVeyraReceipt(
  token: string,
  protocol: "mcp" | "http",
  result?: Record<string, unknown>,
  options?: VeyraClientOptions,
): Promise<ReceiptResult> {
  const baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  const apiKey = options?.apiKey;
  if (!apiKey) throw new Error("apiKey is required for submitVeyraReceipt");

  const res = await fetch(`${baseUrl}/v1/submit-receipt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({ token, protocol, result }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`submit-receipt failed (${res.status}): ${body}`);
  }

  return (await res.json()) as ReceiptResult;
}
