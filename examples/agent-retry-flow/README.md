# Agent Retry Flow

How an AI agent handles a VeyraCommitRequired rejection
and automatically recovers by obtaining a settlement token.

## Prerequisites

1. Veyra API running on localhost:3000 (`pnpm dev` in repo root)
2. Tool server running on localhost:4000 (`node ../fastify-protected-write/server.mjs`)
3. Delegation created for the test agent

## Run

```bash
node agent.mjs
```

## What happens

1. Agent tries POST to tool → gets 403 VeyraCommitRequired
2. Agent reads the error: `currentMode: "open"`, `requiredMode: "commit"`
3. Agent calls Veyra authorize-action → gets execution token
4. Agent retries with `X-Veyra-Token` header → write succeeds
