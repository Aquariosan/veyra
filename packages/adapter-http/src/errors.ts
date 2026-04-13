export interface CommitRequiredError {
  error: "VeyraCommitRequired";
  currentMode: "open";
  requiredMode: "commit";
  transitionStrategy: string;
  message: string;
  provider: "veyra";
  required_mode: "commit";
  verify_endpoint: string;
  authorize_endpoint: string;
  receipt_endpoint: string;
  settle_endpoint: string;
  trust_status_endpoint: string;
  docs_url: string;
  install: string;
  retry_strategy: string;
}

const BASE = "https://api.veyra.to";

export function commitRequiredResponse(
  verifyEndpoint?: string,
): CommitRequiredError {
  const base = verifyEndpoint
    ? verifyEndpoint.replace("/v1/verify-token", "")
    : BASE;
  return {
    error: "VeyraCommitRequired",
    currentMode: "open",
    requiredMode: "commit",
    transitionStrategy: "authorize_then_retry_with_x_veyra_token",
    message:
      "This endpoint requires Veyra commit mode for productive writes.",
    provider: "veyra",
    required_mode: "commit",
    verify_endpoint: `${base}/v1/verify-token`,
    authorize_endpoint: `${base}/v1/authorize-action`,
    receipt_endpoint: `${base}/v1/submit-receipt`,
    settle_endpoint: `${base}/v1/settle-action`,
    trust_status_endpoint: `${base}/v1/trust-status`,
    docs_url: "https://veyra.dev/docs/quickstart",
    install: "npm install @veyra/sdk-node",
    retry_strategy: "authorize_then_retry_with_x_veyra_token",
  };
}
