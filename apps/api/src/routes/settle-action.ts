import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { pool } from "../db/client.js";
import { settleAction } from "../modules/settlement/settle-action.js";
import { requireApiKey } from "../middleware/api-key.js";

const schema = z.object({
  token: z.string().min(1),
  decision: z.enum(["executed", "voided"]),
});

export const settleActionRoute: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/settle-action",
    { preHandler: [requireApiKey] },
    async (req) => {
      const { tenant_id } = req.authContext!;
      const body = schema.parse(req.body);
      return settleAction(pool, { tenant_id, ...body });
    },
  );
};
