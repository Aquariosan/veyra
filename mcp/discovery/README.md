# Veyra Discovery MCP Server

Read-only MCP server for discovering Veyra documentation, patterns, pricing, and integration guides. No API key needed. No network calls. All content is embedded.

## Install & Build

```bash
cd mcp/discovery
npm install
npm run build
```

## Start

```bash
npm start
```

## Tools

| Tool | Description |
|------|-------------|
| `search_veyra_docs` | Search documentation by keyword |
| `get_quickstart` | Fastest integration guide |
| `get_install_instructions` | Install + first steps |
| `get_pricing` | Pricing and billing model |
| `get_commit_transition_grammar` | Commit mode state machine |
| `get_reference_pattern` | Integration pattern (tool-builder, agent-developer, one-call-automation, generic-fetch-wrapper) |
| `get_capability_summary` | Summary of /v1/capability |

## MCP Config (Claude Desktop)

```json
{
  "mcpServers": {
    "veyra-discovery": {
      "command": "node",
      "args": ["path/to/mcp/discovery/dist/index.js"]
    }
  }
}
```

No API key needed. This is a read-only discovery server.

## Links

- Website: https://veyra.to
- npm: https://www.npmjs.com/package/@veyrahq/sdk-node
- Repo: https://github.com/Aquariosan/veyra
