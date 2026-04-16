import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const pool: Pool | null = connectionString
  ? new Pool({ connectionString, max: 10 })
  : null;

export function isDbConfigured(): boolean {
  return pool !== null;
}

export function requirePool(): Pool {
  if (!pool) {
    throw new Error("DATABASE_URL not configured");
  }
  return pool;
}
