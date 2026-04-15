# Veyra MCP Pack

All 8 Veyra tool families in one Remote MCP server.
24 free read tools. 24 protected write tools.
One URL. One decision surface. One settlement rail.

## Recommended default

Use the hosted pack when you want the fastest MCP integration path across all Veyra tool families. Use standalone tools when you specifically want one local dedicated tool on its own.

```json
{
  "mcpServers": {
    "veyra": {
      "url": "https://mcp.veyra.to/sse"
    }
  }
}
```

- SSE: https://mcp.veyra.to/sse
- Manifest: https://mcp.veyra.to/.well-known/veyra-pack.json
- Health: https://mcp.veyra.to/health
- Tools: https://mcp.veyra.to/tools

## Why this pack exists

Every production agent needs two things: a way to read context cheaply, and a
way to commit to consequential actions safely. The Veyra MCP Pack exposes the
entire Veyra tool surface — memory, notes, tasks, snippets, bookmarks,
contacts, forms, webhooks — behind a single Remote MCP URL.

- **Free reads.** All read tools are open. No token. No auth. No side effects.
- **Protected writes.** Every state-changing or externally-consequential tool
  requires a `veyra_token`. Without it, the tool returns a canonical
  `VeyraCommitRequired` response that tells the client exactly how to recover.
- **Veyra underneath.** Tokens are verified against
  `https://api.veyra.to/v1/verify-token`. Authorization happens through Veyra's
  commit-mode flow; settlement happens through Veyra's ledger.

This pack is a decision surface, not a replacement for the standalone Veyra
tools. For real local persistence install the standalone tools directly.

## Connect

### OpenAI / Codex / ChatGPT Apps

```
MCP Server URL: https://mcp.veyra.to/sse
```

### Claude Desktop

```json
{
  "mcpServers": {
    "veyra": {
      "url": "https://mcp.veyra.to/sse"
    }
  }
}
```

### Cursor

Settings → MCP → Add Server → URL: `https://mcp.veyra.to/sse`

## Tool groups

### Free reads (24)

- **memory** — `memory_get`, `memory_list`, `memory_search`
- **notes** — `list_notes`, `get_note`, `search_notes`
- **tasks** — `list_tasks`, `get_task`, `search_tasks`
- **snippets** — `list_snippets`, `get_snippet`, `search_snippets`
- **bookmarks** — `list_bookmarks`, `get_bookmark`, `search_bookmarks`
- **contacts** — `list_contacts`, `get_contact`, `search_contacts`
- **forms** — `list_forms`, `get_form`, `get_responses`
- **webhooks** — `list_webhooks`, `get_webhook`, `get_history`

### Protected writes (24)

- **memory** — `memory_set`, `memory_delete`, `memory_clear`
- **notes** — `create_note`, `update_note`, `delete_note`
- **tasks** — `create_task`, `update_task`, `delete_task`
- **snippets** — `save_snippet`, `update_snippet`, `delete_snippet`
- **bookmarks** — `save_bookmark`, `update_bookmark`, `delete_bookmark`
- **contacts** — `create_contact`, `update_contact`, `delete_contact`
- **forms** — `create_form`, `submit_response`, `delete_form`
- **webhooks** — `register_webhook`, `send_webhook`, `delete_webhook`

## Side-effect semantics

- **Reads are open.** No token, no auth, no side effects. Safe to call at will.
- **State changes require commit mode.** Any tool that mutates records
  requires a verified `veyra_token`.
- **External consequences require commit mode.** Any tool that triggers an
  outbound HTTP call requires a verified `veyra_token`.
- **`VeyraCommitRequired` tells the client exactly how to recover.** The
  response carries the authorize, verify, receipt and settle endpoints, plus
  the retry strategy, so an agent or framework can complete the flow without
  extra documentation lookups.

Each write tool also carries consequence metadata (`risk_class`,
`outcome_type`, `is_external`, `is_reversible`, `side_effect_class`) so models
can reason about what a call will do before making it.

### Canonical `VeyraCommitRequired`

```json
{
  "error": "VeyraCommitRequired",
  "message": "Write operations require Veyra commit mode.",
  "currentMode": "open",
  "requiredMode": "commit",
  "transitionStrategy": "authorize_then_retry_with_x_veyra_token",
  "provider": "veyra",
  "authorize_endpoint": "https://api.veyra.to/v1/authorize-action",
  "verify_endpoint": "https://api.veyra.to/v1/verify-token",
  "receipt_endpoint": "https://api.veyra.to/v1/submit-receipt",
  "settle_endpoint": "https://api.veyra.to/v1/settle-action",
  "docs_url": "https://veyra.to",
  "install": "npm install @veyrahq/sdk-node",
  "retry_strategy": "authorize_then_retry_with_x_veyra_token"
}
```

## Discovery surface

In addition to the MCP transport, the pack exposes:

- `GET /health` — liveness and tool counts.
- `GET /tools` — full tool list with descriptions, mode, category,
  `side_effect_class` and install hints.
- `GET /.well-known/veyra-pack.json` — machine-readable pack manifest with
  MCP endpoint, tool inventory, Veyra endpoints, SDK install line and docs.

## Honest behavior

This hosted pack is the standardized surface, not a standalone database. When
a read is called, it returns a structured `not_configured` response pointing
to the standalone tool. When a write is called with a valid token, it returns
a structured `authorized_simulation` response and explicitly states that no
persistence or outbound call took place. No fake data. No silent success.

## What is Veyra?

Veyra is commit mode for production AI agent actions.
Free reads. Protected writes. Settlement on every committed action.

https://veyra.to

## Links

- Core: https://github.com/Aquariosan/veyra
- SDK: https://www.npmjs.com/package/@veyrahq/sdk-node

## Run locally

```bash
pnpm --filter @veyra/mcp-pack install
pnpm --filter @veyra/mcp-pack build
PORT=4200 BASE_URL=http://localhost:4200 \
  pnpm --filter @veyra/mcp-pack start
```

Environment:

- `PORT` — HTTP port, default `4200`.
- `BASE_URL` — public URL used in discovery responses.
- `VEYRA_BASE_URL` — Veyra API base, default `https://api.veyra.to`.
