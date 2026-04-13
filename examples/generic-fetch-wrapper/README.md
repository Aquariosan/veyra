# One-call commit automation

`commitAwareFetch()` works like `fetch()`, but transparently
handles Veyra commit mode. If the target returns 403
VeyraCommitRequired, it automatically authorizes and retries.

## Run

```bash
# Terminal 1: Veyra API
cd ../.. && pnpm dev

# Terminal 2: Tool server
node ../fastify-protected-write/server.mjs

# Terminal 3: Agent client
node client.mjs
```

## What happens

1. `commitAwareFetch()` calls `fetch()` normally
2. Tool returns 403 VeyraCommitRequired
3. Function reads the error, calls Veyra authorize-action
4. Function retries with `X-Veyra-Token` header
5. Tool accepts the write
6. You get the final response — one call, no manual recovery
