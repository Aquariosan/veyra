/**
 * Veyra Quickstart — Fastify Protected Write
 *
 * This example shows how a tool builder can protect
 * productive write endpoints with Veyra commit mode
 * while keeping read endpoints open.
 *
 * Install:
 *   npm install fastify @veyrahq/sdk-node
 *
 * Run:
 *   node server.mjs
 *
 * Test read (open, no token needed):
 *   curl http://localhost:4000/api/contacts
 *
 * Test write (requires Veyra token):
 *   curl -X POST http://localhost:4000/api/contacts \
 *     -H "Content-Type: application/json" \
 *     -d '{"name": "Jane"}'
 *   # → 403 VeyraCommitRequired
 *
 *   curl -X POST http://localhost:4000/api/contacts \
 *     -H "Content-Type: application/json" \
 *     -H "X-Veyra-Token: <your-execution-token>" \
 *     -d '{"name": "Jane"}'
 *   # → 201 Created
 */

import Fastify from "fastify";

// In production, import from '@veyrahq/sdk-node'
// For this example, we inline a minimal check
const VERIFY_ENDPOINT = "https://api.veyra.to/v1/verify-token";

async function requireCommitMode(req, reply) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return; // reads are open
  }

  const token = req.headers["x-veyra-token"];

  if (!token) {
    reply.status(403).send({
      error: "VeyraCommitRequired",
      currentMode: "open",
      requiredMode: "commit",
      message: "This endpoint requires Veyra commit mode for productive writes.",
      verify_endpoint: VERIFY_ENDPOINT,
      install: "npm install @veyrahq/sdk-node",
      retry_strategy: "authorize_then_retry_with_x_veyra_token",
    });
    return;
  }

  // Verify token with Veyra (free)
  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const result = await res.json();
    if (!result.valid) {
      reply.status(403).send({ error: "invalid_veyra_token" });
      return;
    }
  } catch {
    reply.status(503).send({ error: "verification_unavailable" });
    return;
  }
}

const app = Fastify({ logger: true });

// ── Read endpoint: open, no token needed ──
app.get("/api/contacts", async () => {
  return [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];
});

// ── Write endpoint: protected by Veyra commit mode ──
app.post(
  "/api/contacts",
  { preHandler: [requireCommitMode] },
  async (req, reply) => {
    const { name } = req.body;
    reply.status(201);
    return { id: 3, name, committed: true };
  },
);

app.listen({ port: 4000 }, () => {
  console.log("Tool server running on http://localhost:4000");
  console.log("GET  /api/contacts  → open (no token needed)");
  console.log("POST /api/contacts  → requires Veyra commit mode");
});
