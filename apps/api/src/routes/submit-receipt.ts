import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { pool } from "../db/client.js";
import { submitReceipt } from "../modules/receipts/submit-receipt.js";
import { requireApiKey } from "../middleware/api-key.js";

const schema = z.object({
  token: z.string().min(1),
  protocol: z.enum(["mcp", "http"]),
  result: z.record(z.unknown()).optional(),
});

export const submitReceiptRoute: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/submit-receipt",
    { preHandler: [requireApiKey] },
    async (req) => {
      const input = schema.parse(req.body);
      return submitReceipt(pool, input);
    },
  );
};
