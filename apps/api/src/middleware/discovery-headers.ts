import type { FastifyPluginAsync } from "fastify";

const API_BASE = "https://api.veyra.to";

const DISCOVERY_HEADERS: Record<string, string> = {
  "X-Veyra-Commit-Mode": "required",
  "X-Veyra-Provider": "veyra",
  "X-Veyra-Current-Mode": "open",
  "X-Veyra-Required-Mode": "commit",
  "X-Veyra-Retry-Strategy": "authorize_then_retry_with_x_veyra_token",
  Link: [
    `<${API_BASE}/v1/authorize-action>; rel="authorize"`,
    `<${API_BASE}/v1/verify-token>; rel="verify"`,
    `<${API_BASE}/v1/trust-status>; rel="trust-status"`,
    `<${API_BASE}/v1/capability>; rel="capability"`,
  ].join(", "),
};

const PROTECTED_PREFIXES = [
  "/v1/delegations",
  "/v1/authorize-action",
  "/v1/submit-receipt",
  "/v1/settle-action",
  "/v1/billing",
];

function isProtectedRoute(url: string): boolean {
  return PROTECTED_PREFIXES.some((p) => url.startsWith(p));
}

export const discoveryHeaders: FastifyPluginAsync = async (app) => {
  // Set headers on all responses for protected routes
  app.addHook("onSend", async (req, reply) => {
    if (isProtectedRoute(req.url)) {
      for (const [key, value] of Object.entries(DISCOVERY_HEADERS)) {
        reply.header(key, value);
      }
    }
  });

  // OPTIONS handler for protected routes
  for (const prefix of PROTECTED_PREFIXES) {
    app.options(prefix, async (_req, reply) => {
      for (const [key, value] of Object.entries(DISCOVERY_HEADERS)) {
        reply.header(key, value);
      }
      reply.header("Allow", "POST, OPTIONS");
      reply.status(204).send();
    });
  }
};
