/**
 * Veyra Webhooks — End-to-End Consequence Flow
 *
 * Prerequisites:
 *   1. Veyra API running on localhost:3000 (pnpm dev)
 *   2. veyra-webhooks running on localhost:4100 (cd apps/veyra-webhooks && npm run dev)
 *   3. Delegation + seed data in DB
 *
 * Run:
 *   node client.mjs
 */

const VEYRA_API = "http://localhost:3000";
const WEBHOOKS_API = "http://localhost:4100";
const API_KEY = "tr_test_key_2026";
const AGENT_ID = "22222222-2222-2222-2222-222222222222";

async function main() {
  // ── Step 1: Check public stats before ──
  console.log("=== Step 1: Public stats (before) ===");
  const statsBefore = await fetch(`${VEYRA_API}/v1/public/stats`);
  const before = await statsBefore.json();
  console.log(JSON.stringify(before, null, 2));

  // ── Step 2: Try webhook without token → 403 ──
  console.log("\n=== Step 2: POST /webhooks/send without token ===");
  const blocked = await fetch(`${WEBHOOKS_API}/webhooks/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "https://hooks.example.com/notify",
      method: "POST",
      payload: { text: "Hello from Veyra" },
      risk_class: "B",
      outcome_type: "notification",
      is_external: true,
      is_reversible: false,
    }),
  });
  console.log(`Status: ${blocked.status}`);
  console.log(JSON.stringify(await blocked.json(), null, 2));

  // ── Step 3: Authorize via Veyra ──
  console.log("\n=== Step 3: Authorize action ===");
  const authRes = await fetch(`${VEYRA_API}/v1/authorize-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({
      agent_id: AGENT_ID,
      action_type: "send_webhook",
      target: "crm",
    }),
  });
  const auth = await authRes.json();
  console.log(`Decision: ${auth.decision}, Class: ${auth.action_class}`);

  if (auth.decision !== "allow") {
    console.log("Authorization denied.");
    return;
  }

  // ── Step 4: Execute webhook with token ──
  console.log("\n=== Step 4: POST /webhooks/send with X-Veyra-Token ===");
  const committed = await fetch(`${WEBHOOKS_API}/webhooks/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Veyra-Token": auth.execution_token,
    },
    body: JSON.stringify({
      url: "https://hooks.example.com/notify",
      method: "POST",
      payload: { text: "Hello from Veyra" },
      risk_class: "B",
      outcome_type: "notification",
      is_external: true,
      is_reversible: false,
    }),
  });
  console.log(`Status: ${committed.status}`);
  const result = await committed.json();
  console.log(JSON.stringify(result, null, 2));

  // ── Step 5: Submit receipt ──
  console.log("\n=== Step 5: Submit receipt ===");
  const receiptRes = await fetch(`${VEYRA_API}/v1/submit-receipt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({
      token: auth.execution_token,
      protocol: "http",
      result: result.execution,
    }),
  });
  const receipt = await receiptRes.json();
  console.log(JSON.stringify(receipt, null, 2));

  // ── Step 6: Settle action ──
  console.log("\n=== Step 6: Settle action ===");
  const settleRes = await fetch(`${VEYRA_API}/v1/settle-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({
      token: auth.execution_token,
      decision: "executed",
    }),
  });
  const settlement = await settleRes.json();
  console.log(JSON.stringify(settlement, null, 2));

  // ── Step 7: Check stats + billing after ──
  console.log("\n=== Step 7: Public stats (after) ===");
  const statsAfter = await fetch(`${VEYRA_API}/v1/public/stats`);
  console.log(JSON.stringify(await statsAfter.json(), null, 2));

  console.log("\n=== Step 8: Billing usage ===");
  const billingRes = await fetch(`${VEYRA_API}/v1/billing/usage`, {
    headers: { "X-API-Key": API_KEY },
  });
  console.log(JSON.stringify(await billingRes.json(), null, 2));

  console.log("\n=== Done: Full consequence flow completed ===");
}

main().catch(console.error);
