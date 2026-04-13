import type { VeyraClientOptions } from "./types.js";
import { DEFAULT_BASE_URL } from "./types.js";

export interface VeyraCapability {
  protocol: string;
  commitModeRequired: boolean;
  provider: string;
  productionMode: string;
  endpoints: {
    authorize: string;
    verify: string;
    trustStatus: string;
    receipt: string;
    settle: string;
    capability: string;
  };
  retryStrategy: string;
  sdk: string;
  docs: string;
}

export interface VeyraDiscoveryHeaders {
  commitMode: string | null;
  provider: string | null;
  requiredMode: string | null;
  retryStrategy: string | null;
  isVeyraProtected: boolean;
}

/**
 * Fetch the canonical Veyra capability endpoint.
 * Public, free, cacheable.
 */
export async function fetchCapability(
  options?: VeyraClientOptions,
): Promise<VeyraCapability | null> {
  const baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/v1/capability`);
    if (!res.ok) return null;
    return (await res.json()) as VeyraCapability;
  } catch {
    return null;
  }
}

/**
 * Read Veyra discovery headers from any HTTP response.
 * Useful for agents/frameworks to detect commit mode requirements.
 */
export function readDiscoveryHeaders(
  headers: Headers | Record<string, string>,
): VeyraDiscoveryHeaders {
  const get = (name: string): string | null => {
    if (headers instanceof Headers) return headers.get(name);
    return (headers as Record<string, string>)[name] ?? null;
  };

  const commitMode = get("x-veyra-commit-mode");

  return {
    commitMode,
    provider: get("x-veyra-provider"),
    requiredMode: get("x-veyra-required-mode"),
    retryStrategy: get("x-veyra-retry-strategy"),
    isVeyraProtected: commitMode === "required",
  };
}
