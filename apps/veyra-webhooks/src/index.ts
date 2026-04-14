import Fastify from "fastify";
import cors from "@fastify/cors";

const VEYRA_VERIFY_ENDPOINT =
  process.env.VEYRA_BASE_URL
    ? `${process.env.VEYRA_BASE_URL}/v1/verify-token`
    : "https://api.veyra.to/v1/verify-token";

const PORT = parseInt(process.env.WEBHOOKS_PORT ?? "4100", 10);

// ── Commit mode enforcement (inline, uses existing Veyra verify) ──

interface VerifyResult {
  valid: boolean;
  [key: string]: unknown;
}

async function requireCommitMode(
  req: any,
  reply: any,
): Promise<void> {
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    return;
  }

  const token = req.headers["x-veyra-token"] as string | undefined;

  if (!token) {
    reply
      .header("WWW-Authenticate", 'VeyraCommit realm="api.veyra.to"')
      .status(403)
      .send({
        error: "VeyraCommitRequired",
        currentMode: "open",
        requiredMode: "commit",
        message:
          "This endpoint requires Veyra commit mode for productive writes.",
        verify_endpoint: VEYRA_VERIFY_ENDPOINT,
        retry_strategy: "authorize_then_retry_with_x_veyra_token",
        install: "npm install @veyrahq/sdk-node",
      });
    return;
  }

  try {
    const res = await fetch(VEYRA_VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const result = (await res.json()) as VerifyResult;
    if (!result.valid) {
      reply.status(403).send({ error: "invalid_veyra_token" });
      return;
    }
    // Attach verification context for downstream use
    (req as any).veyraToken = token;
    (req as any).veyraVerify = result;
  } catch {
    reply.status(503).send({ error: "verification_unavailable" });
    return;
  }
}

// ── Settlement Passport builder ──

interface ConsequenceInput {
  url: string;
  method: "POST" | "PUT" | "PATCH";
  payload: unknown;
  risk_class: "A" | "B" | "C" | "D";
  outcome_type: "external_http_call" | "notification";
  is_external: boolean;
  is_reversible: boolean;
}

const PRICE: Record<string, number> = {
  A: 0.005,
  B: 0.02,
  C: 0.1,
  D: 0.25,
};

function buildSettlementPassport(
  input: ConsequenceInput,
  verify: Record<string, unknown>,
) {
  return {
    action_type: "send_webhook",
    risk_class: input.risk_class,
    outcome_type: input.outcome_type,
    is_external: input.is_external,
    is_reversible: input.is_reversible,
    verification_state: "verified",
    settlement_state: "pending",
    estimated_amount_eur: PRICE[input.risk_class] ?? 0,
    target_url: input.url,
    target_method: input.method,
    timestamp: new Date().toISOString(),
    trust_tier: verify.trust_tier ?? "standard",
  };
}

// ── App ──

const app = Fastify({ logger: true });
await app.register(cors);

// Health — open
app.get("/webhooks/health", async () => ({
  ok: true,
  tool: "veyra-webhooks",
}));

// Send — commit-protected consequence endpoint
app.post(
  "/webhooks/send",
  { preHandler: [requireCommitMode] },
  async (req, reply) => {
    const input = req.body as ConsequenceInput;
    const verify = (req as any).veyraVerify ?? {};

    // Validate required fields
    if (!input.url || !input.method || !input.risk_class) {
      reply.status(400).send({ error: "missing_required_fields" });
      return;
    }

    // Simulated outbound webhook execution
    // In production this would be a real HTTP call to input.url
    const executionResult = {
      simulated: true,
      target: input.url,
      method: input.method,
      payload_size: JSON.stringify(input.payload ?? {}).length,
      executed_at: new Date().toISOString(),
    };

    const passport = buildSettlementPassport(input, verify);

    reply.status(201);
    return {
      status: "committed",
      execution: executionResult,
      settlement_passport: passport,
      veyra_token: (req as any).veyraToken,
      consequence_metadata: {
        risk_class: input.risk_class,
        outcome_type: input.outcome_type,
        is_external: input.is_external,
        is_reversible: input.is_reversible,
      },
    };
  },
);

await app.listen({ host: "0.0.0.0", port: PORT });
console.log(`veyra-webhooks running on http://localhost:${PORT}`);
console.log(`GET  /webhooks/health  → open`);
console.log(`POST /webhooks/send    → commit-protected`);
