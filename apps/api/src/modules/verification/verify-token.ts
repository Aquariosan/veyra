import type pg from "pg";
import { verifyExecutionToken } from "../../lib/jwt.js";

export async function verifyToken(pool: pg.Pool, token: string) {
  // 1. Verify JWT signature
  let payload;
  try {
    payload = await verifyExecutionToken(token);
  } catch {
    return {
      valid: false,
      reason: "invalid_signature",
      billable: false as const,
    };
  }

  // 2. Load token row from DB
  const { rows } = await pool.query(
    `SELECT et.id, et.agent_id, et.action_type, et.action_class,
            et.status, et.quota_reserved, et.expires_at, et.token_hash,
            COALESCE(
              (SELECT ts.value->>'tier' FROM trust_signals ts
               WHERE ts.agent_id = et.agent_id
               ORDER BY ts.recorded_at DESC LIMIT 1),
              'standard'
            ) AS trust_tier
     FROM execution_tokens et
     WHERE et.id = $1`,
    [payload.token_id],
  );

  if (rows.length === 0) {
    return {
      valid: false,
      reason: "token_not_found",
      billable: false as const,
    };
  }

  const row = rows[0];

  const revoked = row.status === "revoked";
  const expired =
    row.status === "expired" || new Date(row.expires_at) < new Date();
  const matchesAction =
    row.action_type === payload.action_type &&
    row.agent_id === payload.agent_id;

  const valid = !revoked && !expired && matchesAction && row.quota_reserved;

  // Update status to verified if valid and still issued
  if (valid && row.status === "issued") {
    await pool.query(
      `UPDATE execution_tokens SET status = 'verified', verified_at = now() WHERE id = $1`,
      [row.id],
    );
  }

  // Never write billing usage — verification is not billable
  return {
    valid,
    revoked,
    matches_action: matchesAction,
    budget_reserved: row.quota_reserved,
    trust_tier: row.trust_tier,
    billable: false as const,
  };
}
