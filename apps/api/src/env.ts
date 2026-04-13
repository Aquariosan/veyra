import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../../.env");
dotenv.config({ path: envPath });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  DATABASE_URL: z.string().min(1),

  JWT_ISSUER: z.string().default("veyra"),
  JWT_AUDIENCE: z.string().default("veyra"),
  JWT_PRIVATE_KEY_BASE64: z.string(),
  JWT_PUBLIC_KEY_BASE64: z.string(),

  TOKEN_TTL_SECONDS: z.coerce.number().positive().default(60),

  BILLING_CLASS_A: z.coerce.number().default(0.005),
  BILLING_CLASS_B: z.coerce.number().default(0.02),
  BILLING_CLASS_C: z.coerce.number().default(0.1),
  BILLING_CLASS_D: z.coerce.number().default(0.25),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
