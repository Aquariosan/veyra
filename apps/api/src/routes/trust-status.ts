import type { FastifyPluginAsync } from "fastify";
import { lookupDomain } from "../data/trusted-domains.js";

export const trustStatusRoute: FastifyPluginAsync = async (app) => {
  app.get("/v1/trust-status/:domain", async (req, reply) => {
    const { domain } = req.params as { domain: string };
    reply.header("Cache-Control", "public, max-age=300");
    return lookupDomain(domain);
  });
};
