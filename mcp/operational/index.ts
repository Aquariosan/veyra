import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL =
  process.env.VEYRA_BASE_URL ?? "https://api.veyra.to";
const API_KEY = process.env.VEYRA_API_KEY ?? "";

async function api(
  path: string,
  opts?: { method?: string; body?: unknown; auth?: boolean },
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts?.auth && API_KEY) headers["X-API-Key"] = API_KEY;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts?.method ?? "GET",
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  return res.json();
}

const server = new McpServer({
  name: "veyra-operational",
  version: "0.1.0",
});

// ── Tools ──

server.tool(
  "get_capability",
  "Get Veyra capability declaration and all endpoints",
  {},
  async () => ({
    content: [
      { type: "text", text: JSON.stringify(await api("/v1/capability"), null, 2) },
    ],
  }),
);

server.tool(
  "check_trust_status",
  "Check if a domain requires Veyra commit mode (free, public)",
  { domain: z.string().describe("Domain to check, e.g. salesforce.com") },
  async ({ domain }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await api(`/v1/trust-status/${encodeURIComponent(domain)}`),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "authorize_action",
  "Authorize an agent action and obtain a settlement token",
  {
    agent_id: z.string().describe("Agent UUID"),
    action_type: z.string().describe("Action type, e.g. create_contact"),
    target: z.string().describe("Target system, e.g. crm"),
  },
  async ({ agent_id, action_type, target }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await api("/v1/authorize-action", {
            method: "POST",
            auth: true,
            body: { agent_id, action_type, target },
          }),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "verify_token",
  "Verify a Veyra execution token (free, public, non-billable)",
  { token: z.string().describe("Execution token (JWT)") },
  async ({ token }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await api("/v1/verify-token", {
            method: "POST",
            body: { token },
          }),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "submit_receipt",
  "Submit a receipt after executing an action",
  {
    token: z.string().describe("Execution token"),
    protocol: z.string().describe("Protocol: http or mcp"),
    result: z.string().optional().describe("JSON result string"),
  },
  async ({ token, protocol, result }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          await api("/v1/submit-receipt", {
            method: "POST",
            auth: true,
            body: {
              token,
              protocol,
              result: result ? JSON.parse(result) : {},
            },
          }),
          null,
          2,
        ),
      },
    ],
  }),
);

server.tool(
  "get_usage",
  "Get billing usage for the authenticated tenant",
  {
    from: z.string().optional().describe("Start date YYYY-MM-DD"),
    to: z.string().optional().describe("End date YYYY-MM-DD"),
  },
  async ({ from, to }) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            await api(`/v1/billing/usage${qs ? `?${qs}` : ""}`, {
              auth: true,
            }),
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ── Start ──
const transport = new StdioServerTransport();
await server.connect(transport);
