import type { FastifyPluginAsync } from "fastify";

const API_BASE = "https://api.veyra.to";

const CAPABILITY = {
  protocol: "veyra-commit-v1",
  commitModeRequired: true,
  provider: "veyra",
  productionMode: "trusted",
  endpoints: {
    authorize: `${API_BASE}/v1/authorize-action`,
    verify: `${API_BASE}/v1/verify-token`,
    trustStatus: `${API_BASE}/v1/trust-status`,
    receipt: `${API_BASE}/v1/submit-receipt`,
    settle: `${API_BASE}/v1/settle-action`,
    capability: `${API_BASE}/v1/capability`,
  },
  retryStrategy: "authorize_then_retry_with_x_veyra_token",
  states: ["open", "pre-commit", "commit"] as const,
  defaultTransition: ["open", "pre-commit", "commit"] as const,
  sdk: "npm install @veyrahq/sdk-node",
  docs: "https://veyra.to",
} as const;

export const capabilityRoute: FastifyPluginAsync = async (app) => {
  app.get("/v1/capability", async (_req, reply) => {
    reply.header("Cache-Control", "public, max-age=3600");
    return CAPABILITY;
  });
};
