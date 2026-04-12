import type pg from "pg";
import { newId } from "../../lib/ids.js";
import { decodeTokenPayload } from "../../lib/jwt.js";
import { AppError } from "../../lib/errors.js";

interface SubmitReceiptInput {
  token: string;
  protocol: "mcp" | "http";
  result?: Record<string, unknown>;
}

export async function submitReceipt(
  pool: pg.Pool,
  input: SubmitReceiptInput,
) {
  // 1. Decode token to get execution context
  let payload;
  try {
    payload = decodeTokenPayload(input.token);
  } catch {
    throw new AppError(401, "invalid_execution_token");
  }

  // 2. Load execution token from DB
  const { rows } = await pool.query(
    `SELECT id, status, action_type, action_class, agent_id, tenant_id, token_hash
     FROM execution_tokens WHERE id = $1`,
    [payload.token_id],
  );

  if (rows.length === 0) {
    throw new AppError(404, "token_not_found");
  }

  const token = rows[0];

  if (token.token_hash !== input.token) {
    throw new AppError(401, "token_mismatch");
  }

  if (token.status === "revoked" || token.status === "expired") {
    throw new AppError(409, `token_${token.status}`);
  }

  // 3. Insert receipt — do not finalize settlement
  const receiptId = newId();

  await pool.query(
    `INSERT INTO receipts (id, tenant_id, token_id, agent_id, action_type, action_class, protocol, result)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      receiptId,
      token.tenant_id,
      token.id,
      token.agent_id,
      token.action_type,
      token.action_class,
      input.protocol,
      JSON.stringify(input.result ?? {}),
    ],
  );

  return {
    receipt_id: receiptId,
    settlement_status: "pending",
  };
}
