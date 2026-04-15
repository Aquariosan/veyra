import * as http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { ZodRawShape } from "zod";

import { describe } from "./descriptions.js";
import {
  TOOLS,
  TOOL_FAMILIES,
  type PackTool,
  type PublicToolDescriptor,
} from "./tools.js";
import { buildCommitRequired, veyraBaseUrl, verifyToken } from "./veyra.js";

const PORT = Number(process.env.PORT ?? 4200);
const BASE_URL =
  process.env.BASE_URL ??
  process.env.PUBLIC_BASE_URL ??
  `http://localhost:${PORT}`;

const FREE_COUNT = TOOLS.filter((t) => t.mode === "open").length;
const PROTECTED_COUNT = TOOLS.filter((t) => t.mode === "commit").length;

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

// ── Handlers ─────────────────────────────────────────────────────────

async function handleRead(tool: PackTool): Promise<ToolResult> {
  return textResponse({
    status: "not_configured",
    tool: tool.name,
    tool_family: tool.tool_family,
    message:
      "No standalone local store is attached to this hosted pack. The pack exposes the Veyra tool surface; real data lives in the standalone tool.",
    next_step: `Install the standalone tool for real local data: npm install -g veyra-${tool.tool_family}`,
  });
}

async function handleWrite(
  tool: PackTool,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const token =
    typeof args.veyra_token === "string" && args.veyra_token.length > 0
      ? args.veyra_token
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

  return textResponse({
    status: "authorized_simulation",
    tool: tool.name,
    operation: tool.operation ?? tool.name,
    side_effect_class: tool.side_effect_class,
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

// ── Server factory ───────────────────────────────────────────────────

type ToolRegisterFn = (
  name: string,
  description: string,
  schema: ZodRawShape,
  handler: (args: Record<string, unknown>) => Promise<ToolResult>,
) => void;

function createServer(): McpServer {
  const server = new McpServer({
    name: "veyra-mcp-pack",
    version: "0.1.0",
  });

  // Cast bypasses McpServer.tool's generic overload, which otherwise
  // collapses under the union of 48 ZodRawShape schemas.
  const registerTool = server.tool.bind(server) as unknown as ToolRegisterFn;

  for (const tool of TOOLS) {
    const description = describe(tool.what, tool.style);
    registerTool(
      tool.name,
      description,
      tool.schema,
      async (args) =>
        tool.category === "read"
          ? handleRead(tool)
          : handleWrite(tool, args ?? {}),
    );
  }

  return server;
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
    install_hint: `npm install -g veyra-${t.tool_family}`,
    risk_class: t.risk_class,
    is_external: t.is_external,
    is_reversible: t.is_reversible,
  }));
}

function buildPackManifest() {
  const base = veyraBaseUrl();
  return {
    pack: "veyra-mcp-pack",
    version: "0.1.0",
    protocol: "mcp",
    transport: "sse",
    mcp_endpoint: `${BASE_URL}/sse`,
    discovery: {
      health: `${BASE_URL}/health`,
      tools: `${BASE_URL}/tools`,
      well_known: `${BASE_URL}/.well-known/veyra-pack.json`,
    },
    counts: {
      total: TOOLS.length,
      free: FREE_COUNT,
      protected: PROTECTED_COUNT,
    },
    tool_families: TOOL_FAMILIES,
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

type Session = { server: McpServer; transport: SSEServerTransport };
const sessions = new Map<string, Session>();

function writeJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body, null, 2));
}

const httpServer = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", BASE_URL);

  // CORS preflight (for browser-based MCP clients)
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // MCP SSE endpoint (server → client)
  if (req.method === "GET" && requestUrl.pathname === "/sse") {
    const server = createServer();
    const transport = new SSEServerTransport("/messages", res);
    sessions.set(transport.sessionId, { server, transport });
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

  // MCP client → server POST messages
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

  // Discovery surface
  if (req.method === "GET" && requestUrl.pathname === "/health") {
    writeJson(res, 200, {
      ok: true,
      pack: "veyra-mcp-pack",
      tools: TOOLS.length,
      free: FREE_COUNT,
      protected: PROTECTED_COUNT,
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

httpServer.listen(PORT, () => {
  console.log(
    `[veyra-mcp-pack] ready — ${TOOLS.length} tools ` +
      `(${FREE_COUNT} free / ${PROTECTED_COUNT} protected) on ${BASE_URL}`,
  );
  console.log(`  mcp:       ${BASE_URL}/sse`);
  console.log(`  health:    ${BASE_URL}/health`);
  console.log(`  tools:     ${BASE_URL}/tools`);
  console.log(`  manifest:  ${BASE_URL}/.well-known/veyra-pack.json`);
});
