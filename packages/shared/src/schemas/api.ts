import { z } from "zod";

const actionClass = z.enum(["A", "B", "C", "D"]);
const protocol = z.enum(["mcp", "http"]);

export const authorizeActionSchema = z.object({
  agent_id: z.string().uuid(),
  action_type: z.string().min(1),
  target: z.string().min(1),
  target_tenant_id: z.string().uuid().optional(),
});

export const issueTokenSchema = z.object({
  tenant_id: z.string().uuid(),
  delegation_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  action_type: z.string().min(1),
  action_class: actionClass,
});

export const verifyTokenSchema = z.object({
  token: z.string().min(1),
});

export const submitReceiptSchema = z.object({
  tenant_id: z.string().uuid(),
  token_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  action_type: z.string().min(1),
  action_class: actionClass,
  protocol: protocol,
  result: z.record(z.unknown()).optional(),
});

export const settleActionSchema = z.object({
  token: z.string().min(1),
  decision: z.enum(["executed", "voided"]),
});
