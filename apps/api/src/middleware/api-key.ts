import type { FastifyRequest, FastifyReply } from "fastify";
import { pool } from "../db/client.js";

export interface AuthContext {
  principal_id: string;
  tenant_id: string;
}

declare module "fastify" {
  interface FastifyRequest {
    authContext?: AuthContext;
  }
}

const cache = new Map<string, AuthContext>();

export async function requireApiKey(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = req.headers["x-api-key"] as string | undefined;

  if (!apiKey) {
    reply.status(401).send({ error: "missing_api_key" });
    return;
  }

  let auth = cache.get(apiKey);

  if (!auth) {
    const { rows } = await pool.query(
      "SELECT id, tenant_id FROM principals WHERE api_key = $1",
      [apiKey],
    );

    if (rows.length === 0) {
      reply.status(401).send({ error: "invalid_api_key" });
      return;
    }

    auth = { principal_id: rows[0].id, tenant_id: rows[0].tenant_id };
    cache.set(apiKey, auth);
  }

  req.authContext = auth;
}
