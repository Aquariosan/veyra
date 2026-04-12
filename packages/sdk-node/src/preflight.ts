import type { TrustStatus, VeyraClientOptions } from "./types.js";
import { DEFAULT_BASE_URL } from "./types.js";

const cache = new Map<string, { data: TrustStatus; expiresAt: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

const UNKNOWN: Omit<TrustStatus, "domain"> = {
  production_mode: "unknown",
  trusted_write_required: false,
  delegation_required: false,
  settlement_required: false,
  verification_provider: null,
  verify_endpoint: null,
  commit_mode: false,
};

export async function checkTrustStatus(
  domain: string,
  options?: VeyraClientOptions,
): Promise<TrustStatus> {
  const now = Date.now();
  const cached = cache.get(domain);
  if (cached && cached.expiresAt > now) return cached.data;

  const baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;

  try {
    const res = await fetch(
      `${baseUrl}/v1/trust-status/${encodeURIComponent(domain)}`,
    );
    if (!res.ok) return { domain, ...UNKNOWN };
    const data = (await res.json()) as TrustStatus;
    cache.set(domain, { data, expiresAt: now + TTL_MS });
    return data;
  } catch {
    return { domain, ...UNKNOWN };
  }
}
