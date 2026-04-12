import type pg from "pg";
import { env } from "../../env.js";
import { newId } from "../../lib/ids.js";
import { AppError } from "../../lib/errors.js";
import { decodeTokenPayload } from "../../lib/jwt.js";
import { incrementUsage } from "../billing/increment-usage.js";

const PRICE_PER_CLASS: Record<string, number> = {
  A: env.BILLING_CLASS_A,
  B: env.BILLING_CLASS_B,
  C: env.BILLING_CLASS_C,
  D: env.BILLING_CLASS_D,
};

interface SettleInput {
  tenant_id: string;
  token: string;
  decision: "executed" | "voided";
}

export async function settleAction(pool: pg.Pool, input: SettleInput) {
  // 1. Decode execution token to get token_id
  let payload;
  try {
    payload = decodeTokenPayload(input.token);
  } catch {
    throw new AppError(401, "invalid_execution_token");
  }

  // 2. Load receipt via execution token
  const { rows: receipts } = await pool.query(
    `SELECT r.id AS receipt_id, r.tenant_id,
            et.status AS token_status, et.id AS et_id, et.action_class, et.token_hash
     FROM execution_tokens et
     JOIN receipts r ON r.token_id = et.id
     WHERE et.id = $1 AND r.tenant_id = $2
     LIMIT 1`,
    [payload.token_id, input.tenant_id],
  );

  if (receipts.length === 0) {
    throw new AppError(404, "receipt_not_found");
  }

  if (receipts[0].token_hash !== input.token) {
    throw new AppError(401, "token_mismatch");
  }

  const receipt = receipts[0];
  const actionClass: string = receipt.action_class;
  const finalAmount =
    input.decision === "executed"
      ? PRICE_PER_CLASS[actionClass] ?? 0
      : 0;

  const settlementStatus =
    input.decision === "executed" ? "finalized" : "voided";

  // 3. Insert settlement event
  const settlementId = newId();

  await pool.query(
    `INSERT INTO settlement_events (id, tenant_id, receipt_id, action_class, amount_eur, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      settlementId,
      input.tenant_id,
      receipt.receipt_id,
      actionClass,
      finalAmount,
      settlementStatus,
    ],
  );

  // 4. Update execution token status
  const newTokenStatus =
    input.decision === "executed" ? "consumed" : "revoked";

  await pool.query(
    `UPDATE execution_tokens SET status = $1, consumed_at = now() WHERE id = $2`,
    [newTokenStatus, receipt.et_id],
  );

  // 5. Update receipt status
  const receiptStatus =
    input.decision === "executed" ? "accepted" : "rejected";

  await pool.query(
    `UPDATE receipts SET status = $1 WHERE id = $2`,
    [receiptStatus, receipt.receipt_id],
  );

  // 6. Billing increment — only for finalized executed actions
  if (input.decision === "executed") {
    await incrementUsage(
      pool,
      input.tenant_id,
      actionClass,
      finalAmount,
    );
  }

  return {
    settlement_id: settlementId,
    settlement_status: settlementStatus,
    final_amount: finalAmount,
    action_class: actionClass,
  };
}
