/**
 * Veyra Quickstart — Agent Retry Flow
 *
 * This example shows how an AI agent handles a
 * VeyraCommitRequired rejection and automatically
 * recovers by obtaining a settlement token.
 *
 * Flow:
 *   1. Agent tries to write → 403 VeyraCommitRequired
 *   2. Agent detects the error
 *   3. Agent calls handleCommitRequired()
 *   4. Agent retries with the token
 *   5. Write succeeds
 *
 * This is the pattern that agent frameworks can
 * register as a default error handler.
 */

// In production:
// import { isVeyraCommitRequired, handleCommitRequired } from '@veyrahq/sdk-node'

// ── Configuration ──
const TOOL_URL = "http://localhost:4000/api/contacts";
const VEYRA_API = "http://localhost:3000"; // local Veyra API
const API_KEY = "tr_test_key_2026";
const AGENT_ID = "22222222-2222-2222-2222-222222222222";

async function main() {
  console.log("=== Step 1: Agent tries to write ===");

  const body = JSON.stringify({ name: "Jane" });

  const res = await fetch(TOOL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  console.log(`Status: ${res.status}`);

  if (res.status !== 403) {
    console.log("Write succeeded without commit mode.");
    console.log(await res.json());
    return;
  }

  // ── Step 2: Detect VeyraCommitRequired ──
  const error = await res.json();
  console.log("Received:", error.error);

  if (error.error !== "VeyraCommitRequired") {
    console.log("Unknown error, cannot recover.");
    return;
  }

  console.log("\n=== Step 2: Detected VeyraCommitRequired ===");
  console.log(`Current mode: ${error.currentMode}`);
  console.log(`Required mode: ${error.requiredMode}`);

  // ── Step 3: Authorize via Veyra ──
  console.log("\n=== Step 3: Requesting authorization ===");

  const authRes = await fetch(`${VEYRA_API}/v1/authorize-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({
      agent_id: AGENT_ID,
      action_type: "create_contact",
      target: "crm",
    }),
  });

  const auth = await authRes.json();
  console.log(`Decision: ${auth.decision}`);
  console.log(`Action class: ${auth.action_class}`);
  console.log(`Token obtained: ${auth.execution_token ? "yes" : "no"}`);

  if (auth.decision !== "allow") {
    console.log("Authorization denied.");
    return;
  }

  // ── Step 4: Retry with token ──
  console.log("\n=== Step 4: Retrying with X-Veyra-Token ===");

  const retryRes = await fetch(TOOL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Veyra-Token": auth.execution_token,
    },
    body,
  });

  console.log(`Status: ${retryRes.status}`);
  console.log(await retryRes.json());

  console.log("\n=== Done: Write committed through Veyra ===");
}

main().catch(console.error);
