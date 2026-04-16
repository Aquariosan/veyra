import * as http from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { ZodRawShape } from "zod";

import { describe, selectionHint } from "./descriptions.js";
import {
  TOOLS,
  TOOL_FAMILIES,
  type PackTool,
  type PublicToolDescriptor,
} from "./tools.js";
import { buildCommitRequired, veyraBaseUrl, verifyToken } from "./veyra.js";
import { isDbConfigured } from "./db.js";
import { migrate } from "./migrate.js";
import {
  notesList,
  notesGet,
  notesSearch,
  notesCreate,
  notesUpdate,
  notesDelete,
  tasksList,
  tasksGet,
  tasksSearch,
  tasksCreate,
  tasksUpdate,
  tasksDelete,
  bookmarksList,
  bookmarksGet,
  bookmarksSearch,
  bookmarksCreate,
  bookmarksUpdate,
  bookmarksDelete,
} from "./stores.js";

const PORT = Number(process.env.PORT ?? 4200);
const BASE_URL =
  process.env.BASE_URL ??
  process.env.PUBLIC_BASE_URL ??
  `http://localhost:${PORT}`;

// Tool counts deliberately exclude the workspace (session-identity) tools so
// that the public invariant "48 functional tools, 24 free reads, 24 protected
// writes" stays visible in /health and the pack manifest. Workspace tools are
// reported separately as session_tools.
const SESSION_TOOLS_COUNT = TOOLS.filter(
  (t) => t.tool_family === "workspace",
).length;
const FREE_COUNT = TOOLS.filter(
  (t) => t.mode === "open" && t.tool_family !== "workspace",
).length;
const PROTECTED_COUNT = TOOLS.filter((t) => t.mode === "commit").length;
const FUNCTIONAL_TOTAL = FREE_COUNT + PROTECTED_COUNT;

const BACKED_FAMILIES = new Set(["notes", "tasks", "bookmarks"]);

// workspace_id validation (TEIL A): trim, length-bound, alphanumeric+_/-
const WORKSPACE_ID_MAX_LEN = 128;
const WORKSPACE_ID_REGEX = /^[A-Za-z0-9_-]+$/;

type WorkspaceIdCheck =
  | { ok: true; id: string }
  | { ok: false; error: string };

function validateWorkspaceId(raw: string): WorkspaceIdCheck {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "workspace_id must be a non-empty string" };
  }
  if (trimmed.length > WORKSPACE_ID_MAX_LEN) {
    return {
      ok: false,
      error: `workspace_id too long (max ${WORKSPACE_ID_MAX_LEN} chars)`,
    };
  }
  if (!WORKSPACE_ID_REGEX.test(trimmed)) {
    return {
      ok: false,
      error:
        "workspace_id must contain only letters, digits, dashes, or underscores — UUIDs preferred",
    };
  }
  return { ok: true, id: trimmed };
}

// ── Response shapes ──────────────────────────────────────────────────

type TextBlock = { type: "text"; text: string };
type ToolResult = { content: TextBlock[]; isError?: boolean };

function textResponse(obj: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}

function errorResponse(obj: unknown): ToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(obj, null, 2) }],
  };
}

// ── Session state (per SSE connection) ───────────────────────────────

interface SessionState {
  workspace_id: string;
}

function asStr(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = args[key];
  return typeof v === "string" ? v : undefined;
}

function asNum(
  args: Record<string, unknown>,
  key: string,
): number | undefined {
  const v = args[key];
  return typeof v === "number" ? v : undefined;
}

// ── Workspace identity tools ─────────────────────────────────────────

async function handleWorkspace(
  tool: PackTool,
  args: Record<string, unknown>,
  state: SessionState,
): Promise<ToolResult> {
  if (tool.name === "get_workspace") {
    return textResponse({
      status: "ok",
      workspace_id: state.workspace_id,
      isolation: "private-per-workspace",
      backed_families: Array.from(BACKED_FAMILIES),
      message:
        "Every MCP session starts with a fresh workspace_id. Call set_workspace to restore an existing one.",
    });
  }
  if (tool.name === "set_workspace") {
    const raw = asStr(args, "workspace_id") ?? "";
    const check = validateWorkspaceId(raw);
    if (!check.ok) {
      return errorResponse({
        status: "invalid_input",
        message: check.error,
        workspace_id: state.workspace_id,
      });
    }
    const previous = state.workspace_id;
    state.workspace_id = check.id;
    return textResponse({
      status: "ok",
      workspace_id: state.workspace_id,
      previous_workspace_id: previous,
      message:
        "Workspace identity updated for this session. Subsequent reads and writes scope to this workspace.",
    });
  }
  return textResponse({
    status: "unsupported_workspace_tool",
    tool: tool.name,
  });
}

// ── Backed reads (notes / tasks / bookmarks) ─────────────────────────

async function handleBackedRead(
  tool: PackTool,
  args: Record<string, unknown>,
  ws: string,
): Promise<ToolResult> {
  try {
    switch (tool.name) {
      // notes
      case "list_notes": {
        const rows = await notesList(ws, {
          tag: asStr(args, "tag"),
          limit: asNum(args, "limit"),
        });
        return textResponse({
          items: rows,
          count: rows.length,
          workspace_id: ws,
        });
      }
      case "get_note": {
        const id = asStr(args, "id");
        if (!id)
          return errorResponse({
            status: "invalid_input",
            message: "id is required",
            workspace_id: ws,
          });
        const row = await notesGet(ws, id);
        return textResponse({
          item: row,
          found: row !== null,
          workspace_id: ws,
        });
      }
      case "search_notes": {
        const q = asStr(args, "query") ?? "";
        const rows = await notesSearch(ws, q);
        return textResponse({
          items: rows,
          count: rows.length,
          query: q,
          workspace_id: ws,
        });
      }

      // tasks
      case "list_tasks": {
        const rows = await tasksList(ws, {
          status: asStr(args, "status"),
          project: asStr(args, "project"),
          priority: asStr(args, "priority"),
        });
        return textResponse({
          items: rows,
          count: rows.length,
          workspace_id: ws,
        });
      }
      case "get_task": {
        const id = asStr(args, "id");
        if (!id)
          return errorResponse({
            status: "invalid_input",
            message: "id is required",
            workspace_id: ws,
          });
        const row = await tasksGet(ws, id);
        return textResponse({
          item: row,
          found: row !== null,
          workspace_id: ws,
        });
      }
      case "search_tasks": {
        const q = asStr(args, "query") ?? "";
        const rows = await tasksSearch(ws, q);
        return textResponse({
          items: rows,
          count: rows.length,
          query: q,
          workspace_id: ws,
        });
      }

      // bookmarks
      case "list_bookmarks": {
        const rows = await bookmarksList(ws, {
          tag: asStr(args, "tag"),
          category: asStr(args, "category"),
        });
        return textResponse({
          items: rows,
          count: rows.length,
          workspace_id: ws,
        });
      }
      case "get_bookmark": {
        const id = asStr(args, "id");
        if (!id)
          return errorResponse({
            status: "invalid_input",
            message: "id is required",
            workspace_id: ws,
          });
        const row = await bookmarksGet(ws, id);
        return textResponse({
          item: row,
          found: row !== null,
          workspace_id: ws,
        });
      }
      case "search_bookmarks": {
        const q = asStr(args, "query") ?? "";
        const rows = await bookmarksSearch(ws, q);
        return textResponse({
          items: rows,
          count: rows.length,
          query: q,
          workspace_id: ws,
        });
      }
    }
  } catch (err) {
    return errorResponse({
      status: "db_error",
      tool: tool.name,
      workspace_id: ws,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return textResponse({
    status: "backed_read_not_implemented",
    tool: tool.name,
    workspace_id: ws,
  });
}

// ── Backed writes (notes / tasks / bookmarks) ────────────────────────

async function handleBackedWrite(
  tool: PackTool,
  args: Record<string, unknown>,
  ws: string,
): Promise<ToolResult> {
  try {
    switch (tool.name) {
      // notes
      case "create_note": {
        const title = asStr(args, "title");
        if (!title)
          return errorResponse({
            status: "invalid_input",
            message: "title is required",
            workspace_id: ws,
          });
        const row = await notesCreate(ws, {
          title,
          content: asStr(args, "content"),
          tags: asStr(args, "tags"),
        });
        return persistedResponse(tool, ws, { item: row });
      }
      case "update_note": {
        const id = asStr(args, "id");
        if (!id)
          return errorResponse({
            status: "invalid_input",
            message: "id is required",
            workspace_id: ws,
          });
        const row = await notesUpdate(ws, id, {
          title: asStr(args, "title"),
          content: asStr(args, "content"),
          tags: asStr(args, "tags"),
        });
        if (!row) return notFoundWriteResponse(tool, ws, id, "note");
        return persistedResponse(tool, ws, { item: row });
      }
      case "delete_note": {
        const id = asStr(args, "id");
        if (!id)
          return errorResponse({
            status: "invalid_input",
            message: "id is required",
            workspace_id: ws,
          });
        const removed = await notesDelete(ws, id);
        if (!removed) return notFoundWriteResponse(tool, ws, id, "note");
        return persistedResponse(tool, ws, { deleted: true, id });
      }

      // tasks
      case "create_task": {
        const title = asStr(args, "title");
        if (!title)
          return errorResponse({
            status: "invalid_input",
            message: "title is required",
            workspace_id: ws,
          });
        const row = await tasksCreate(ws, {
          title,
          description: asStr(args, "description"),
          status: asStr(args, "status"),
          priority: asStr(args, "priority"),
          project: asStr(args, "project"),
          due: asStr(args, "due"),
        });
        return persistedResponse(tool, ws, { item: row });
      }
      case "update_task": {
        const id = asStr(args, "id");
        if (!id)
          return errorResponse({
            status: "invalid_input",
            message: "id is required",
            workspace_id: ws,
          });
        const row = await tasksUpdate(ws, id, {
          title: asStr(args, "title"),
          description: asStr(args, "description"),
          status: asStr(args, "status"),
          priority: asStr(args, "priority"),
          project: asStr(args, "project"),
          due: asStr(args, "due"),
        });
        if (!row) return notFoundWriteResponse(tool, ws, id, "task");
        return persistedResponse(tool, ws, { item: row });
      }
      case "delete_task": {
        const id = asStr(args, "id");
        if (!id)
          return errorResponse({
            status: "invalid_input",
            message: "id is required",
            workspace_id: ws,
          });
        const removed = await tasksDelete(ws, id);
        if (!removed) return notFoundWriteResponse(tool, ws, id, "task");
        return persistedResponse(tool, ws, { deleted: true, id });
      }

      // bookmarks
      case "save_bookmark": {
        const url = asStr(args, "url");
        if (!url)
          return errorResponse({
            status: "invalid_input",
            message: "url is required",
            workspace_id: ws,
          });
        const row = await bookmarksCreate(ws, {
          url,
          title: asStr(args, "title"),
          tags: asStr(args, "tags"),
          category: asStr(args, "category"),
        });
        return persistedResponse(tool, ws, { item: row });
      }
      case "update_bookmark": {
        const id = asStr(args, "id");
        if (!id)
          return errorResponse({
            status: "invalid_input",
            message: "id is required",
            workspace_id: ws,
          });
        const row = await bookmarksUpdate(ws, id, {
          url: asStr(args, "url"),
          title: asStr(args, "title"),
          tags: asStr(args, "tags"),
          category: asStr(args, "category"),
        });
        if (!row) return notFoundWriteResponse(tool, ws, id, "bookmark");
        return persistedResponse(tool, ws, { item: row });
      }
      case "delete_bookmark": {
        const id = asStr(args, "id");
        if (!id)
          return errorResponse({
            status: "invalid_input",
            message: "id is required",
            workspace_id: ws,
          });
        const removed = await bookmarksDelete(ws, id);
        if (!removed) return notFoundWriteResponse(tool, ws, id, "bookmark");
        return persistedResponse(tool, ws, { deleted: true, id });
      }
    }
  } catch (err) {
    return errorResponse({
      status: "db_error",
      tool: tool.name,
      workspace_id: ws,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return textResponse({
    status: "backed_write_not_implemented",
    tool: tool.name,
    workspace_id: ws,
  });
}

function notFoundWriteResponse(
  tool: PackTool,
  ws: string,
  id: string,
  entity: string,
): ToolResult {
  return errorResponse({
    status: "not_found",
    tool: tool.name,
    workspace_id: ws,
    id,
    message: `No ${entity} with id=${id} exists in this workspace. No state was changed.`,
    veyra: { verified: true, settled: false },
  });
}

function persistedResponse(
  tool: PackTool,
  ws: string,
  extra: Record<string, unknown>,
): ToolResult {
  return textResponse({
    status: "committed",
    tool: tool.name,
    operation: tool.operation ?? tool.name,
    side_effect_class: tool.side_effect_class,
    persisted: true,
    workspace_id: ws,
    ...extra,
    consequence_metadata: {
      risk_class: tool.risk_class,
      outcome_type: tool.outcome_type,
      is_external: tool.is_external ?? false,
      is_reversible: tool.is_reversible ?? false,
    },
    veyra: {
      verified: true,
      settled: false,
      hint: "Submit a receipt via /v1/submit-receipt to finalize settlement.",
    },
  });
}

// ── Top-level read / write dispatch ──────────────────────────────────

async function handleRead(
  tool: PackTool,
  args: Record<string, unknown>,
  state: SessionState,
): Promise<ToolResult> {
  if (BACKED_FAMILIES.has(tool.tool_family)) {
    if (!isDbConfigured()) {
      return textResponse({
        status: "not_configured",
        tool: tool.name,
        tool_family: tool.tool_family,
        workspace_id: state.workspace_id,
        message:
          "DATABASE_URL is not set on this pack instance. The hosted pack needs a shared Postgres to back this family.",
      });
    }
    return handleBackedRead(tool, args, state.workspace_id);
  }

  // Other families: no local store attached on the hosted pack surface.
  return textResponse({
    status: "not_configured",
    tool: tool.name,
    tool_family: tool.tool_family,
    message:
      "No standalone local store is attached to this hosted pack for this family.",
    next_step: `Install the standalone tool for real local data: npm install -g veyra-${tool.tool_family}`,
  });
}

async function handleWrite(
  tool: PackTool,
  args: Record<string, unknown>,
  state: SessionState,
): Promise<ToolResult> {
  const token =
    typeof args.veyra_token === "string" && args.veyra_token.length > 0
      ? (args.veyra_token as string)
      : null;

  if (!token) {
    return errorResponse({
      status: "commit_required",
      error: buildCommitRequired(tool),
    });
  }

  const verification = await verifyToken(token);
  if (!verification.valid) {
    return errorResponse({
      status: "commit_required",
      error: buildCommitRequired(tool, verification.reason),
    });
  }

  if (BACKED_FAMILIES.has(tool.tool_family)) {
    if (!isDbConfigured()) {
      return textResponse({
        status: "persistence_unavailable",
        tool: tool.name,
        tool_family: tool.tool_family,
        workspace_id: state.workspace_id,
        message:
          "Token verified but DATABASE_URL is not configured on this pack instance. No persistence possible.",
        veyra: { verified: true, settled: false },
      });
    }
    return handleBackedWrite(tool, args, state.workspace_id);
  }

  // Simulated write for families without backend.
  return textResponse({
    status: "authorized_simulation",
    tool: tool.name,
    operation: tool.operation ?? tool.name,
    side_effect_class: tool.side_effect_class,
    workspace_id: state.workspace_id,
    message:
      `Token verified. The hosted MCP pack acknowledges the ${tool.name} intent ` +
      `but does not carry a local store or outbound transport for ${tool.tool_family}. ` +
      `For real persistence or external effect install the standalone tool: ` +
      `npm install -g veyra-${tool.tool_family}.`,
    consequence_metadata: {
      risk_class: tool.risk_class,
      outcome_type: tool.outcome_type,
      is_external: tool.is_external ?? false,
      is_reversible: tool.is_reversible ?? false,
    },
    veyra: {
      verified: true,
      billable: false,
    },
  });
}

// ── Server factory (per SSE session) ─────────────────────────────────

type ToolRegisterFn = (
  name: string,
  description: string,
  schema: ZodRawShape,
  handler: (args: Record<string, unknown>) => Promise<ToolResult>,
) => void;

function createSession(): { server: McpServer; state: SessionState } {
  const state: SessionState = { workspace_id: randomUUID() };
  const server = new McpServer({
    name: "veyra-mcp-pack",
    version: "0.2.0",
  });

  // Cast bypasses McpServer.tool's generic overload, which otherwise
  // collapses under the union of many ZodRawShape schemas.
  const registerTool = server.tool.bind(server) as unknown as ToolRegisterFn;

  for (const tool of TOOLS) {
    const description = describe(tool.what, tool.style);
    registerTool(tool.name, description, tool.schema, async (args) => {
      const a = (args ?? {}) as Record<string, unknown>;
      if (tool.tool_family === "workspace")
        return handleWorkspace(tool, a, state);
      if (tool.category === "read") return handleRead(tool, a, state);
      return handleWrite(tool, a, state);
    });
  }

  return { server, state };
}

// ── Public discovery payloads ────────────────────────────────────────

function publicToolDescriptors(): PublicToolDescriptor[] {
  return TOOLS.map((t) => ({
    name: t.name,
    description: describe(t.what, t.style),
    tool_family: t.tool_family,
    mode: t.mode,
    category: t.category,
    side_effect_class: t.side_effect_class,
    install_hint:
      t.tool_family === "workspace"
        ? undefined
        : `npm install -g veyra-${t.tool_family}`,
    usage_hint: selectionHint(t.style),
    risk_class: t.risk_class,
    is_external: t.is_external,
    is_reversible: t.is_reversible,
  }));
}

function buildPackManifest() {
  const base = veyraBaseUrl();
  return {
    pack: "veyra-mcp-pack",
    version: "0.2.0",
    protocol: "mcp",
    transport: "sse",
    mcp_endpoint: `${BASE_URL}/sse`,
    discovery: {
      health: `${BASE_URL}/health`,
      tools: `${BASE_URL}/tools`,
      well_known: `${BASE_URL}/.well-known/veyra-pack.json`,
    },
    counts: {
      total: FUNCTIONAL_TOTAL,
      free: FREE_COUNT,
      protected: PROTECTED_COUNT,
      session_tools: SESSION_TOOLS_COUNT,
    },
    tool_families: TOOL_FAMILIES,
    backed_families: Array.from(BACKED_FAMILIES),
    db_configured: isDbConfigured(),
    tools: publicToolDescriptors(),
    veyra: {
      api_base: base,
      authorize_endpoint: `${base}/v1/authorize-action`,
      verify_endpoint: `${base}/v1/verify-token`,
      receipt_endpoint: `${base}/v1/submit-receipt`,
      settle_endpoint: `${base}/v1/settle-action`,
      capability_endpoint: `${base}/v1/capability`,
    },
    docs_url: "https://veyra.to",
    sdk: "npm install @veyrahq/sdk-node",
  };
}

// ── HTTP server (MCP SSE + discovery) ────────────────────────────────

type Session = {
  server: McpServer;
  state: SessionState;
  transport: SSEServerTransport;
};
const sessions = new Map<string, Session>();

function writeJson(
  res: http.ServerResponse,
  status: number,
  body: unknown,
) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body, null, 2));
}

const httpServer = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", BASE_URL);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/sse") {
    const { server, state } = createSession();
    const transport = new SSEServerTransport("/messages", res);
    sessions.set(transport.sessionId, { server, state, transport });
    const cleanup = () => {
      sessions.delete(transport.sessionId);
      server.close().catch(() => {});
    };
    res.on("close", cleanup);
    try {
      await server.connect(transport);
    } catch (err) {
      cleanup();
      console.error("[mcp-pack] sse connect failed", err);
    }
    return;
  }

  if (req.method === "POST" && requestUrl.pathname === "/messages") {
    const sid = requestUrl.searchParams.get("sessionId");
    const session = sid ? sessions.get(sid) : undefined;
    if (!session) {
      writeJson(res, 400, { error: "no_session" });
      return;
    }
    try {
      await session.transport.handlePostMessage(req, res);
    } catch (err) {
      console.error("[mcp-pack] post message failed", err);
      if (!res.headersSent) writeJson(res, 500, { error: "message_failed" });
    }
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    writeJson(res, 200, {
      ok: true,
      pack: "veyra-mcp-pack",
      version: "0.2.0",
      tools: FUNCTIONAL_TOTAL,
      free: FREE_COUNT,
      protected: PROTECTED_COUNT,
      session_tools: SESSION_TOOLS_COUNT,
      db_configured: isDbConfigured(),
      backed_families: Array.from(BACKED_FAMILIES),
    });
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/tools") {
    writeJson(res, 200, publicToolDescriptors());
    return;
  }

  if (
    req.method === "GET" &&
    requestUrl.pathname === "/.well-known/veyra-pack.json"
  ) {
    writeJson(res, 200, buildPackManifest());
    return;
  }

  writeJson(res, 404, { error: "not_found", path: requestUrl.pathname });
});

httpServer.listen(PORT, async () => {
  console.log(
    `[veyra-mcp-pack] ready — ${FUNCTIONAL_TOTAL} functional tools ` +
      `(${FREE_COUNT} free / ${PROTECTED_COUNT} protected) + ` +
      `${SESSION_TOOLS_COUNT} session tools on ${BASE_URL}`,
  );
  console.log(`  mcp:       ${BASE_URL}/sse`);
  console.log(`  health:    ${BASE_URL}/health`);
  console.log(`  tools:     ${BASE_URL}/tools`);
  console.log(`  manifest:  ${BASE_URL}/.well-known/veyra-pack.json`);

  const migrationResult = await migrate();
  if (migrationResult.ok) {
    console.log(
      `[veyra-mcp-pack] migrations applied (${migrationResult.statements} statements)`,
    );
  } else {
    console.log(
      `[veyra-mcp-pack] migrations skipped: ${migrationResult.reason}` +
        (migrationResult.error ? ` — ${migrationResult.error}` : ""),
    );
  }
});

