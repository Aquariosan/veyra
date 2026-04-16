import { randomUUID } from "node:crypto";
import { requirePool } from "./db.js";

export interface NoteRow {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  project: string;
  due: string;
  created_at: string;
  updated_at: string;
}

export interface BookmarkRow {
  id: string;
  workspace_id: string;
  url: string;
  title: string;
  tags: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const newId = (prefix: string) => `${prefix}_${randomUUID()}`;
const like = (q: string) => `%${q}%`;

// ── notes ────────────────────────────────────────────────────────────

export async function notesList(
  ws: string,
  opts: { tag?: string; limit?: number } = {},
): Promise<NoteRow[]> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const p = requirePool();
  if (opts.tag) {
    const r = await p.query<NoteRow>(
      "SELECT * FROM pack_notes WHERE workspace_id=$1 AND tags ILIKE $2 ORDER BY updated_at DESC LIMIT $3",
      [ws, like(opts.tag), limit],
    );
    return r.rows;
  }
  const r = await p.query<NoteRow>(
    "SELECT * FROM pack_notes WHERE workspace_id=$1 ORDER BY updated_at DESC LIMIT $2",
    [ws, limit],
  );
  return r.rows;
}

export async function notesGet(
  ws: string,
  id: string,
): Promise<NoteRow | null> {
  const p = requirePool();
  const r = await p.query<NoteRow>(
    "SELECT * FROM pack_notes WHERE id=$1 AND workspace_id=$2",
    [id, ws],
  );
  return r.rows[0] ?? null;
}

export async function notesSearch(
  ws: string,
  q: string,
  limit = 50,
): Promise<NoteRow[]> {
  const p = requirePool();
  const r = await p.query<NoteRow>(
    "SELECT * FROM pack_notes WHERE workspace_id=$1 AND (title ILIKE $2 OR content ILIKE $2 OR tags ILIKE $2) ORDER BY updated_at DESC LIMIT $3",
    [ws, like(q), limit],
  );
  return r.rows;
}

export async function notesCreate(
  ws: string,
  input: { title: string; content?: string; tags?: string },
): Promise<NoteRow> {
  const p = requirePool();
  const id = newId("note");
  const r = await p.query<NoteRow>(
    "INSERT INTO pack_notes (id, workspace_id, title, content, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [id, ws, input.title, input.content ?? "", input.tags ?? ""],
  );
  return r.rows[0];
}

export async function notesUpdate(
  ws: string,
  id: string,
  patch: { title?: string; content?: string; tags?: string },
): Promise<NoteRow | null> {
  const p = requirePool();
  const r = await p.query<NoteRow>(
    "UPDATE pack_notes SET title=COALESCE($3, title), content=COALESCE($4, content), tags=COALESCE($5, tags), updated_at=NOW() WHERE id=$1 AND workspace_id=$2 RETURNING *",
    [id, ws, patch.title ?? null, patch.content ?? null, patch.tags ?? null],
  );
  return r.rows[0] ?? null;
}

export async function notesDelete(ws: string, id: string): Promise<boolean> {
  const p = requirePool();
  const r = await p.query(
    "DELETE FROM pack_notes WHERE id=$1 AND workspace_id=$2",
    [id, ws],
  );
  return (r.rowCount ?? 0) > 0;
}

// ── tasks ────────────────────────────────────────────────────────────

export async function tasksList(
  ws: string,
  opts: { status?: string; project?: string; priority?: string; limit?: number } = {},
): Promise<TaskRow[]> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const filters: string[] = ["workspace_id=$1"];
  const params: unknown[] = [ws];
  if (opts.status) {
    params.push(opts.status);
    filters.push(`status=$${params.length}`);
  }
  if (opts.project) {
    params.push(opts.project);
    filters.push(`project=$${params.length}`);
  }
  if (opts.priority) {
    params.push(opts.priority);
    filters.push(`priority=$${params.length}`);
  }
  params.push(limit);
  const sql = `SELECT * FROM pack_tasks WHERE ${filters.join(" AND ")} ORDER BY updated_at DESC LIMIT $${params.length}`;
  const r = await requirePool().query<TaskRow>(sql, params);
  return r.rows;
}

export async function tasksGet(
  ws: string,
  id: string,
): Promise<TaskRow | null> {
  const p = requirePool();
  const r = await p.query<TaskRow>(
    "SELECT * FROM pack_tasks WHERE id=$1 AND workspace_id=$2",
    [id, ws],
  );
  return r.rows[0] ?? null;
}

export async function tasksSearch(
  ws: string,
  q: string,
  limit = 50,
): Promise<TaskRow[]> {
  const p = requirePool();
  const r = await p.query<TaskRow>(
    "SELECT * FROM pack_tasks WHERE workspace_id=$1 AND (title ILIKE $2 OR project ILIKE $2 OR description ILIKE $2) ORDER BY updated_at DESC LIMIT $3",
    [ws, like(q), limit],
  );
  return r.rows;
}

export async function tasksCreate(
  ws: string,
  input: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    project?: string;
    due?: string;
  },
): Promise<TaskRow> {
  const p = requirePool();
  const id = newId("task");
  const r = await p.query<TaskRow>(
    `INSERT INTO pack_tasks
       (id, workspace_id, title, description, status, priority, project, due)
     VALUES ($1, $2, $3, $4, COALESCE($5,'todo'), COALESCE($6,'medium'), COALESCE($7,''), COALESCE($8,''))
     RETURNING *`,
    [
      id,
      ws,
      input.title,
      input.description ?? "",
      input.status ?? null,
      input.priority ?? null,
      input.project ?? null,
      input.due ?? null,
    ],
  );
  return r.rows[0];
}

export async function tasksUpdate(
  ws: string,
  id: string,
  patch: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    project?: string;
    due?: string;
  },
): Promise<TaskRow | null> {
  const p = requirePool();
  const r = await p.query<TaskRow>(
    `UPDATE pack_tasks SET
       title=COALESCE($3, title),
       description=COALESCE($4, description),
       status=COALESCE($5, status),
       priority=COALESCE($6, priority),
       project=COALESCE($7, project),
       due=COALESCE($8, due),
       updated_at=NOW()
     WHERE id=$1 AND workspace_id=$2
     RETURNING *`,
    [
      id,
      ws,
      patch.title ?? null,
      patch.description ?? null,
      patch.status ?? null,
      patch.priority ?? null,
      patch.project ?? null,
      patch.due ?? null,
    ],
  );
  return r.rows[0] ?? null;
}

export async function tasksDelete(ws: string, id: string): Promise<boolean> {
  const p = requirePool();
  const r = await p.query(
    "DELETE FROM pack_tasks WHERE id=$1 AND workspace_id=$2",
    [id, ws],
  );
  return (r.rowCount ?? 0) > 0;
}

// ── bookmarks ────────────────────────────────────────────────────────

export async function bookmarksList(
  ws: string,
  opts: { tag?: string; category?: string; limit?: number } = {},
): Promise<BookmarkRow[]> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const filters: string[] = ["workspace_id=$1"];
  const params: unknown[] = [ws];
  if (opts.tag) {
    params.push(like(opts.tag));
    filters.push(`tags ILIKE $${params.length}`);
  }
  if (opts.category) {
    params.push(opts.category);
    filters.push(`category=$${params.length}`);
  }
  params.push(limit);
  const sql = `SELECT * FROM pack_bookmarks WHERE ${filters.join(" AND ")} ORDER BY updated_at DESC LIMIT $${params.length}`;
  const r = await requirePool().query<BookmarkRow>(sql, params);
  return r.rows;
}

export async function bookmarksGet(
  ws: string,
  id: string,
): Promise<BookmarkRow | null> {
  const p = requirePool();
  const r = await p.query<BookmarkRow>(
    "SELECT * FROM pack_bookmarks WHERE id=$1 AND workspace_id=$2",
    [id, ws],
  );
  return r.rows[0] ?? null;
}

export async function bookmarksSearch(
  ws: string,
  q: string,
  limit = 50,
): Promise<BookmarkRow[]> {
  const p = requirePool();
  const r = await p.query<BookmarkRow>(
    "SELECT * FROM pack_bookmarks WHERE workspace_id=$1 AND (title ILIKE $2 OR url ILIKE $2 OR tags ILIKE $2) ORDER BY updated_at DESC LIMIT $3",
    [ws, like(q), limit],
  );
  return r.rows;
}

export async function bookmarksCreate(
  ws: string,
  input: {
    url: string;
    title?: string;
    tags?: string;
    category?: string;
  },
): Promise<BookmarkRow> {
  const p = requirePool();
  const id = newId("bmk");
  const r = await p.query<BookmarkRow>(
    "INSERT INTO pack_bookmarks (id, workspace_id, url, title, tags, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [id, ws, input.url, input.title ?? "", input.tags ?? "", input.category ?? ""],
  );
  return r.rows[0];
}

export async function bookmarksUpdate(
  ws: string,
  id: string,
  patch: {
    url?: string;
    title?: string;
    tags?: string;
    category?: string;
  },
): Promise<BookmarkRow | null> {
  const p = requirePool();
  const r = await p.query<BookmarkRow>(
    `UPDATE pack_bookmarks SET
       url=COALESCE($3, url),
       title=COALESCE($4, title),
       tags=COALESCE($5, tags),
       category=COALESCE($6, category),
       updated_at=NOW()
     WHERE id=$1 AND workspace_id=$2
     RETURNING *`,
    [
      id,
      ws,
      patch.url ?? null,
      patch.title ?? null,
      patch.tags ?? null,
      patch.category ?? null,
    ],
  );
  return r.rows[0] ?? null;
}

export async function bookmarksDelete(
  ws: string,
  id: string,
): Promise<boolean> {
  const p = requirePool();
  const r = await p.query(
    "DELETE FROM pack_bookmarks WHERE id=$1 AND workspace_id=$2",
    [id, ws],
  );
  return (r.rowCount ?? 0) > 0;
}
