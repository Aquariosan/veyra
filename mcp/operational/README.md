# Veyra Operational MCP Server

MCP server for executing Veyra operations: authorize actions, verify tokens, submit receipts, check billing.

## Install & Build

```bash
cd mcp/operational
npm install
npm run build
```

## Start

```bash
VEYRA_API_KEY=tr_test_key_2026 npm start
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VEYRA_BASE_URL` | `https://api.veyra.to` | Veyra API base URL |
| `VEYRA_API_KEY` | — | API key for authenticated operations |

## Tools

| Tool | Auth | Description |
|------|------|-------------|
| `get_capability` | No | Get Veyra capability declaration |
| `check_trust_status` | No | Check if a domain requires commit mode |
| `authorize_action` | Yes | Authorize an action and get a settlement token |
| `verify_token` | No | Verify an execution token (free) |
| `submit_receipt` | Yes | Submit a receipt after execution |
| `get_usage` | Yes | Get billing usage for tenant |

## MCP Config (Claude Desktop)

```json
{
  "mcpServers": {
    "veyra": {
      "command": "node",
      "args": ["path/to/mcp/operational/dist/index.js"],
      "env": {
        "VEYRA_API_KEY": "tr_...",
        "VEYRA_BASE_URL": "https://api.veyra.to"
      }
    }
  }
}
```

## Links

- Website: https://veyra.to
- npm: https://www.npmjs.com/package/@veyrahq/sdk-node
- Repo: https://github.com/Aquariosan/veyra
