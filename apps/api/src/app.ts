import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { env } from "./env.js";
import { healthRoute } from "./routes/health.js";
import { delegationsRoute } from "./routes/delegations.js";
import { authorizeActionRoute } from "./routes/authorize-action.js";
import { verifyTokenRoute } from "./routes/verify-token.js";
import { submitReceiptRoute } from "./routes/submit-receipt.js";
import { settleActionRoute } from "./routes/settle-action.js";
import { trustStatusRoute } from "./routes/trust-status.js";

export async function buildApp() {
  const app = Fastify({ logger: { level: env.LOG_LEVEL } });

  await app.register(cors);
  await app.register(sensible);

  await app.register(healthRoute);
  await app.register(delegationsRoute);
  await app.register(authorizeActionRoute);
  await app.register(verifyTokenRoute);
  await app.register(submitReceiptRoute);
  await app.register(settleActionRoute);
  await app.register(trustStatusRoute);

  return app;
}
