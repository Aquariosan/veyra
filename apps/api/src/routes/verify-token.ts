import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { pool } from "../db/client.js";
import { verifyToken } from "../modules/verification/verify-token.js";

const schema = z.object({
  token: z.string().min(1),
});

export const verifyTokenRoute: FastifyPluginAsync = async (app) => {
  app.post("/v1/verify-token", async (req) => {
    const { token } = schema.parse(req.body);
    return verifyToken(pool, token);
  });
};
