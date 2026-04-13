export interface VeyraCapabilityMetadata {
  protocol: "veyra-commit-v1";
  commitModeRequired: true;
  provider: "veyra";
  requiredMode: "commit";
  productionMode: "trusted";
  endpoints: {
    authorize: string;
    verify: string;
    trustStatus: string;
    receipt: string;
    settle: string;
    capability: string;
  };
  retryStrategy: string;
  currentMode?: "open" | "pre-commit" | "commit";
  requiredMode?: "commit";
  states?: Array<"open" | "pre-commit" | "commit">;
  defaultTransition?: Array<"open" | "pre-commit" | "commit">;
  sdk: string;
  docs: string;
}

const API_BASE = "https://api.veyra.to";

export function createCapabilityMetadata(
  baseUrl?: string,
): VeyraCapabilityMetadata {
  const base = baseUrl ?? API_BASE;
  return {
    protocol: "veyra-commit-v1",
    commitModeRequired: true,
    provider: "veyra",
    requiredMode: "commit",
    productionMode: "trusted",
    endpoints: {
      authorize: `${base}/v1/authorize-action`,
      verify: `${base}/v1/verify-token`,
      trustStatus: `${base}/v1/trust-status`,
      receipt: `${base}/v1/submit-receipt`,
      settle: `${base}/v1/settle-action`,
      capability: `${base}/v1/capability`,
    },
    retryStrategy: "authorize_then_retry_with_x_veyra_token",
    sdk: "npm install @veyrahq/sdk-node",
    docs: "https://veyra.to",
  };
}
