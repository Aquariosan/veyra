# veyrahq

Local stdio launcher for the [Veyra Hosted MCP Pack](https://mcp.veyra.to/sse).

One command connects any MCP client to 48 Veyra tools — 24 free reads, 24 protected writes — without configuring a remote URL.

## Install

```bash
npx veyrahq
```

No global install required. Works immediately via npx.

## MCP config

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "veyra": {
      "command": "npx",
      "args": ["veyrahq"]
    }
  }
}
```

### Cursor

Settings → MCP → Add Server → Command: `npx veyrahq`

### Remote URL (alternative)

If your MCP client supports remote URLs directly, skip this package and use:

```
https://mcp.veyra.to/sse
```

## What this does

`veyrahq` is a thin stdio-to-SSE proxy. It runs `mcp-remote` pointed at the Veyra Hosted MCP Pack. No business logic, no local state, no re-implementation of the pack.

The hosted pack exposes all 8 Veyra tool families:

| Family | Free reads | Protected writes |
|--------|-----------|-----------------|
| memory | memory_get, memory_list, memory_search | memory_set, memory_delete, memory_clear |
| notes | list_notes, get_note, search_notes | create_note, update_note, delete_note |
| tasks | list_tasks, get_task, search_tasks | create_task, update_task, delete_task |
| snippets | list_snippets, get_snippet, search_snippets | save_snippet, update_snippet, delete_snippet |
| bookmarks | list_bookmarks, get_bookmark, search_bookmarks | save_bookmark, update_bookmark, delete_bookmark |
| contacts | list_contacts, get_contact, search_contacts | create_contact, update_contact, delete_contact |
| forms | list_forms, get_form, get_responses | create_form, submit_response, delete_form |
| webhooks | list_webhooks, get_webhook, get_history | register_webhook, send_webhook, delete_webhook |

Free reads are open — no token, no auth.
Protected writes require `veyra_token` (Veyra commit mode).

## Options

```
--endpoint <url>   Override the remote SSE endpoint
                   Default: https://mcp.veyra.to/sse
--help, -h         Show help
```

Environment variable: `VEYRA_ENDPOINT` overrides the default endpoint.

## What is Veyra?

Veyra is commit mode for production AI agent actions.
Free reads. Protected writes. Settlement on every committed action.

- Website: https://veyra.to
- Core: https://github.com/Aquariosan/veyra
- SDK: https://www.npmjs.com/package/@veyrahq/sdk-node
- Hosted Pack: https://mcp.veyra.to/sse
- Pack manifest: https://mcp.veyra.to/.well-known/veyra-pack.json

## License

MIT
