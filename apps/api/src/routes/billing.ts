import type { FastifyPluginAsync } from "fastify";
import { pool } from "../db/client.js";
import { requireApiKey } from "../middleware/api-key.js";

export const billingRoute: FastifyPluginAsync = async (app) => {
  app.get(
    "/v1/billing/usage",
    { preHandler: [requireApiKey] },
    async (req) => {
      const { tenant_id } = req.authContext!;
      const query = req.query as { from?: string; to?: string };

      const from = query.from ?? "1970-01-01";
      const to = query.to ?? "2099-12-31";

      const { rows } = await pool.query(
        `SELECT usage_date, action_class, action_count AS count, total_eur AS amount_eur
         FROM billing_usage_daily
         WHERE tenant_id = $1 AND usage_date >= $2 AND usage_date <= $3
         ORDER BY usage_date, action_class`,
        [tenant_id, from, to],
      );

      const totalEur = rows.reduce(
        (sum: number, r: { amount_eur: string }) =>
          sum + parseFloat(r.amount_eur),
        0,
      );

      return {
        tenant_id,
        period: { from, to },
        usage: rows.map(
          (r: {
            usage_date: Date;
            action_class: string;
            count: number;
            amount_eur: string;
          }) => ({
            date: r.usage_date.toISOString().split("T")[0],
            action_class: r.action_class,
            count: r.count,
            amount_eur: parseFloat(r.amount_eur),
          }),
        ),
        total_eur: Math.round(totalEur * 1000000) / 1000000,
      };
    },
  );
};
