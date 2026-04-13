/**
 * Veyra — One-call commit automation
 *
 * commitAwareFetch() works like fetch(), but if the target
 * returns VeyraCommitRequired, it automatically obtains a
 * settlement token and retries. Normal responses pass through.
 *
 * Prerequisites:
 *   - Veyra API running on localhost:3000
 *   - Tool server running on localhost:4000
 *     (see examples/fastify-protected-write)
 *   - Delegation created for the test agent
 *
 * Run:
 *   node client.mjs
 */

// In production: import { commitAwareFetch } from '@veyrahq/sdk-node'

// ── Inline commitAwareFetch for standalone demo ──
async function commitAwareFetch(url, init, options) {
  const res = await fetch(url, init);
  if (res.status !== 403) return res;

  const clone = res.clone();
  const body = await clone.json();
  if (body?.error !== "VeyraCommitRequired") return res;

  // Authorize via Veyra
  const authRes = await fetch(`${options.baseUrl}/v1/authorize-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": options.apiKey,
    },
    body: JSON.stringify({
      agent_id: options.agentId,
      action_type: options.actionType,
      target: options.target,
    }),
  });

  const auth = await authRes.json();
  if (auth.decision !== "allow") throw new Error("Authorization denied");

  // Retry with token
  return fetch(url, {
    ...init,
    headers: { ...init?.headers, "X-Veyra-Token": auth.execution_token },
  });
}

// ── Use it ──
async function main() {
  console.log("Writing to protected endpoint...\n");

  const res = await commitAwareFetch(
    "http://localhost:4000/api/contacts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane" }),
    },
    {
      baseUrl: "http://localhost:3000",
      apiKey: "tr_test_key_2026",
      agentId: "22222222-2222-2222-2222-222222222222",
      actionType: "create_contact",
      target: "crm",
    },
  );

  console.log(`Status: ${res.status}`);
  console.log(await res.json());
}

main().catch(console.error);
