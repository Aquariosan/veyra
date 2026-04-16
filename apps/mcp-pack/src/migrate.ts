import { pool } from "./db.js";

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS pack_notes (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_pack_notes_ws ON pack_notes(workspace_id)`,
  `CREATE TABLE IF NOT EXISTS pack_tasks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    project TEXT DEFAULT '',
    due TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_pack_tasks_ws ON pack_tasks(workspace_id)`,
  `CREATE TABLE IF NOT EXISTS pack_bookmarks (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    category TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_pack_bookmarks_ws ON pack_bookmarks(workspace_id)`,
];

export interface MigrationResult {
  ok: boolean;
  statements?: number;
  reason?: string;
  error?: string;
}

export async function migrate(): Promise<MigrationResult> {
  if (!pool) {
    return { ok: false, reason: "DATABASE_URL not set" };
  }
  try {
    for (const sql of STATEMENTS) {
      await pool.query(sql);
    }
    return { ok: true, statements: STATEMENTS.length };
  } catch (err) {
    return {
      ok: false,
      reason: "migration_failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
