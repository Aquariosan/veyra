import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { pool } from "../db/client.js";
import { authorizeAction } from "../modules/authorization/authorize-action.js";
import { requireApiKey } from "../middleware/api-key.js";

const schema = z.object({
  agent_id: z.string().uuid(),
  action_type: z.string().min(1),
  target: z.string().min(1),
  target_tenant_id: z.string().uuid().optional(),
});

export const authorizeActionRoute: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/authorize-action",
    { preHandler: [requireApiKey] },
    async (req) => {
      const { principal_id, tenant_id } = req.authContext!;
      const body = schema.parse(req.body);
      return authorizeAction(pool, {
        tenant_id,
        principal_id,
        ...body,
      });
    },
  );
};
