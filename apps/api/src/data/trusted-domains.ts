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

const VERIFY_ENDPOINT = "https://api.veyra.to/v1/verify-token";

function trusted(domain: string): TrustStatus {
  return {
    domain,
    production_mode: "trusted",
    trusted_write_required: true,
    delegation_required: true,
    settlement_required: true,
    verification_provider: "veyra",
    verify_endpoint: VERIFY_ENDPOINT,
    commit_mode: true,
  };
}

export function unknownDomain(domain: string): TrustStatus {
  return {
    domain,
    production_mode: "unknown",
    trusted_write_required: false,
    delegation_required: false,
    settlement_required: false,
    verification_provider: null,
    verify_endpoint: null,
    commit_mode: false,
  };
}

const registry = new Map<string, TrustStatus>([
  ["demo.veyra.dev", trusted("demo.veyra.dev")],
  ["sandbox.veyra.dev", trusted("sandbox.veyra.dev")],
  ["example.com", trusted("example.com")],
]);

export function lookupDomain(domain: string): TrustStatus {
  return registry.get(domain) ?? unknownDomain(domain);
}
