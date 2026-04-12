import type pg from "pg";
import { env } from "../../env.js";
import { newId } from "../../lib/ids.js";
import { futureISO } from "../../lib/time.js";
import { signExecutionToken } from "../../lib/jwt.js";
import { classifyAction } from "./classify-action.js";

const PRICE_PER_CLASS: Record<string, number> = {
  A: env.BILLING_CLASS_A,
  B: env.BILLING_CLASS_B,
  C: env.BILLING_CLASS_C,
  D: env.BILLING_CLASS_D,
};

interface AuthorizeInput {
  tenant_id: string;
  agent_id: string;
  principal_id: string;
  action_type: string;
  target: string;
  target_tenant_id?: string;
}

export async function authorizeAction(pool: pg.Pool, input: AuthorizeInput) {
  // 1. Find active delegation
  const { rows: delegations } = await pool.query(
    `SELECT id, scope, action_class, risk_level
     FROM delegations
     WHERE tenant_id = $1 AND agent_id = $2 AND principal_id = $3
       AND status = 'active'
       AND (expires_at IS NULL OR expires_at > now())
     LIMIT 1`,
    [input.tenant_id, input.agent_id, input.principal_id],
  );

  if (delegations.length === 0) {
    return { decision: "denied", reason: "no_active_delegation" };
  }

  const delegation = delegations[0];
  const scope = delegation.scope || {};

  // 2. Check target against allowed_targets
  if (
    Array.isArray(scope.allowed_targets) &&
    scope.allowed_targets.length > 0 &&
    !scope.allowed_targets.includes(input.target)
  ) {
    return { decision: "denied", reason: "target_not_allowed" };
  }

  // 3. Classify action
  const isCrossOrg =
    !!input.target_tenant_id &&
    input.target_tenant_id !== input.tenant_id;

  const { action_class, risk_level } = classifyAction(
    input.action_type,
    isCrossOrg,
  );

  // 3. Calculate cost and check budget
  const estimatedCost = PRICE_PER_CLASS[action_class] ?? 0;

  if (scope.budget_limit != null) {
    const { rows: usage } = await pool.query(
      `SELECT action_class, COUNT(*)::int AS cnt
       FROM execution_tokens
       WHERE delegation_id = $1 AND quota_reserved = true
         AND status NOT IN ('expired', 'revoked')
       GROUP BY action_class`,
      [delegation.id],
    );

    let totalReserved = 0;
    for (const row of usage) {
      totalReserved += (PRICE_PER_CLASS[row.action_class] ?? 0) * row.cnt;
    }
    if (totalReserved + estimatedCost > scope.budget_limit) {
      return { decision: "denied", reason: "budget_exceeded" };
    }
  }

  // 4. Create execution token
  const tokenId = newId();
  const expiresAt = futureISO(env.TOKEN_TTL_SECONDS);

  const jwt = await signExecutionToken({
    token_id: tokenId,
    tenant_id: input.tenant_id,
    agent_id: input.agent_id,
    delegation_id: delegation.id,
    action_type: input.action_type,
    action_class,
    target_tenant_id: input.target_tenant_id,
  });

  // 5. Insert execution token
  await pool.query(
    `INSERT INTO execution_tokens
       (id, tenant_id, delegation_id, agent_id, action_class, action_type, token_hash, status, quota_reserved, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'issued', true, $8)`,
    [
      tokenId,
      input.tenant_id,
      delegation.id,
      input.agent_id,
      action_class,
      input.action_type,
      jwt,
      expiresAt,
    ],
  );

  return {
    decision: "allow",
    action_class,
    risk_level,
    execution_token: jwt,
    reserved_budget: estimatedCost,
    quota_reserved: true,
    expires_at: expiresAt,
  };
}
