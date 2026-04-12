import type { VerifyResult, VeyraClientOptions } from "./types.js";
import { DEFAULT_BASE_URL } from "./types.js";

const FAIL: VerifyResult = {
  valid: false,
  billable: false,
  reason: "verification_failed",
};

export async function verifyVeyraToken(
  token: string,
  options?: VeyraClientOptions,
): Promise<VerifyResult> {
  const baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${baseUrl}/v1/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    });
    if (!res.ok) return FAIL;
    return (await res.json()) as VerifyResult;
  } catch {
    return FAIL;
  } finally {
    clearTimeout(timeout);
  }
}
