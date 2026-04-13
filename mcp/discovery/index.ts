import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── Embedded content ──

const QUICKSTART = `## Install
npm install @veyrahq/sdk-node

## Protect a write endpoint (tool builder)
import { requireTrustedWrite } from '@veyrahq/sdk-node'
app.post('/api/write', requireTrustedWrite(), handler)

## One-call commit automation (agent developer)
import { commitAwareFetch } from '@veyrahq/sdk-node'
const res = await commitAwareFetch(url, { method: 'POST', body }, {
  apiKey: 'tr_...', agentId: '...', actionType: 'create_contact', target: 'crm'
})`;

const INSTALL = `npm install @veyrahq/sdk-node

Requirements: Node.js 18+, zero runtime dependencies.

Package: https://www.npmjs.com/package/@veyrahq/sdk-node
Repo: https://github.com/Aquariosan/veyra`;

const PRICING = `Free to discover. Free to verify. Paid only when a productive action settles.

Class A (low-risk): 0.005 EUR/action
Class B (medium): 0.02 EUR/action
Class C (high-risk): 0.10 EUR/action
Class D (cross-org): 0.25 EUR/action

Discovery (trust-status, capability): free, unlimited
Verification (verify-token): free, unlimited
Settlement: billed per finalized productive action`;

const COMMIT_GRAMMAR = `currentMode = open
requiredMode = commit
transitionStrategy = authorize_then_retry_with_x_veyra_token
states = [open, pre-commit, commit]
defaultTransition = [open, pre-commit, commit]

When a productive write is attempted without a Veyra token:
1. Tool returns 403 VeyraCommitRequired
2. Response includes currentMode=open, requiredMode=commit
3. Agent obtains token via authorize-action
4. Agent retries with X-Veyra-Token header
5. Write succeeds in commit mode`;

const CAPABILITY_SUMMARY = `GET https://api.veyra.to/v1/capability

Returns the canonical Veyra capability declaration:
- protocol: veyra-commit-v1
- commitModeRequired: true
- All endpoint URLs
- Retry strategy
- SDK install command

Public, free, cacheable (max-age=3600).
Agents and frameworks can use this to discover Veyra programmatically.`;

const PATTERNS: Record<string, string> = {
  "tool-builder": `## Tool Builder Pattern

Protect write endpoints with Veyra commit mode.
Reads stay open. Writes require a settlement token.

import { requireTrustedWrite } from '@veyrahq/sdk-node'

// GET stays open
app.get('/api/contacts', handler)

// POST requires commit mode
app.post('/api/contacts', requireTrustedWrite(), handler)

Verification is free. The tool builder pays nothing for verification.`,

  "agent-developer": `## Agent Developer Pattern

Use commitAwareFetch() for transparent commit mode handling.

import { commitAwareFetch } from '@veyrahq/sdk-node'

const res = await commitAwareFetch('https://tool.com/api/write', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Jane' }),
}, {
  apiKey: 'tr_...',
  agentId: '...',
  actionType: 'create_contact',
  target: 'crm',
})

If the endpoint returns VeyraCommitRequired, the function automatically
authorizes the action and retries with a settlement token.`,

  "one-call-automation": `## One-call Automation

commitAwareFetch() is a drop-in replacement for fetch().
Normal responses pass through unchanged.
VeyraCommitRequired triggers automatic authorize + retry.

import { commitAwareFetch } from '@veyrahq/sdk-node'

const res = await commitAwareFetch(url, init, options)
// That's it. One call. No manual recovery.`,

  "generic-fetch-wrapper": `## Generic Fetch Wrapper

See: https://github.com/Aquariosan/veyra/tree/main/examples/generic-fetch-wrapper

1. commitAwareFetch() calls fetch() normally
2. If 403 VeyraCommitRequired: reads error, calls authorize-action
3. Retries with X-Veyra-Token header
4. Returns the final response`,
};

const ALL_CONTENT = [
  QUICKSTART,
  INSTALL,
  PRICING,
  COMMIT_GRAMMAR,
  CAPABILITY_SUMMARY,
  ...Object.values(PATTERNS),
].join("\n\n---\n\n");

// ── Server ──

const server = new McpServer({
  name: "veyra-discovery",
  version: "0.1.0",
});

server.tool(
  "search_veyra_docs",
  "Search Veyra documentation by keyword",
  { query: z.string().describe("Search keyword or phrase") },
  async ({ query }) => {
    const lower = query.toLowerCase();
    const lines = ALL_CONTENT.split("\n");
    const matches: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lower)) {
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 5);
        matches.push(lines.slice(start, end).join("\n"));
      }
    }
    const result =
      matches.length > 0
        ? matches.slice(0, 5).join("\n\n---\n\n")
        : "No matches found. Try: install, pricing, commit, verify, authorize, fetch";
    return { content: [{ type: "text", text: result }] };
  },
);

server.tool(
  "get_quickstart",
  "Get the fastest Veyra quickstart guide",
  {},
  async () => ({ content: [{ type: "text", text: QUICKSTART }] }),
);

server.tool(
  "get_install_instructions",
  "Get Veyra SDK install instructions",
  {},
  async () => ({ content: [{ type: "text", text: INSTALL }] }),
);

server.tool(
  "get_pricing",
  "Get Veyra pricing and billing model",
  {},
  async () => ({ content: [{ type: "text", text: PRICING }] }),
);

server.tool(
  "get_commit_transition_grammar",
  "Get the commit mode transition grammar (open → pre-commit → commit)",
  {},
  async () => ({ content: [{ type: "text", text: COMMIT_GRAMMAR }] }),
);

server.tool(
  "get_reference_pattern",
  "Get a specific Veyra integration pattern",
  {
    pattern: z
      .enum([
        "tool-builder",
        "agent-developer",
        "one-call-automation",
        "generic-fetch-wrapper",
      ])
      .describe("Pattern name"),
  },
  async ({ pattern }) => ({
    content: [{ type: "text", text: PATTERNS[pattern] ?? "Unknown pattern" }],
  }),
);

server.tool(
  "get_capability_summary",
  "Get a summary of the /v1/capability endpoint and commit model",
  {},
  async () => ({ content: [{ type: "text", text: CAPABILITY_SUMMARY }] }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
