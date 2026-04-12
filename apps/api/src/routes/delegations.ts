import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { pool } from "../db/client.js";
import { newId } from "../lib/ids.js";
import { requireApiKey } from "../middleware/api-key.js";

const createDelegationSchema = z.object({
  agent_id: z.string().uuid(),
  allowed_actions: z.array(z.string()).optional(),
  allowed_targets: z.array(z.string()).optional(),
  budget_limit: z.number().positive().optional(),
  currency: z.string().default("EUR"),
  expires_at: z.string().optional(),
});

export const delegationsRoute: FastifyPluginAsync = async (app) => {
  app.post(
    "/v1/delegations",
    { preHandler: [requireApiKey] },
    async (req, reply) => {
      const { principal_id, tenant_id } = req.authContext!;
      const input = createDelegationSchema.parse(req.body);

      const id = newId();
      const scope = {
        allowed_actions: input.allowed_actions,
        allowed_targets: input.allowed_targets,
        budget_limit: input.budget_limit,
        currency: input.currency,
      };

      await pool.query(
        `INSERT INTO delegations (id, tenant_id, principal_id, agent_id, scope, action_class, risk_level, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, 'B', 'medium', 'active', $6)`,
        [
          id,
          tenant_id,
          principal_id,
          input.agent_id,
          JSON.stringify(scope),
          input.expires_at ?? null,
        ],
      );

      reply.status(201);
      return { id };
    },
  );
};
