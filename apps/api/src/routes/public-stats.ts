import type { FastifyPluginAsync } from "fastify";
import { pool } from "../db/client.js";

export const publicStatsRoute: FastifyPluginAsync = async (app) => {
  app.get("/v1/public/stats", async (_req, reply) => {
    reply.header("Cache-Control", "public, max-age=60");

    let totalSettled = 0;
    let last24h = 0;
    let totalVerified = 0;

    try {
      const settled = await pool.query(
        "SELECT COALESCE(COUNT(*), 0)::int AS cnt FROM settlement_events",
      );
      totalSettled = settled.rows[0].cnt;

      const recent = await pool.query(
        "SELECT COALESCE(COUNT(*), 0)::int AS cnt FROM settlement_events WHERE settled_at > now() - interval '24 hours'",
      );
      last24h = recent.rows[0].cnt;

      const verified = await pool.query(
        "SELECT COALESCE(COUNT(*), 0)::int AS cnt FROM execution_tokens WHERE status IN ('verified', 'consumed')",
      );
      totalVerified = verified.rows[0].cnt;
    } catch {
      // DB unavailable — return base stats only
    }

    return {
      capability_live: true,
      verify_live: true,
      sdk_package: "@veyrahq/sdk-node",
      request_observability: true,
      total_settled_actions: totalSettled,
      last_24h_actions: last24h,
      total_verified_tokens: totalVerified,
    };
  });
};
