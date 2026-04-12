import { env } from "./env.js";
import { buildApp } from "./app.js";

const app = await buildApp();

await app.listen({ host: "0.0.0.0", port: env.PORT });
