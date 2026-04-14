# Veyra Webhooks — E2E Consequence Flow

Full end-to-end flow: blocked write → authorize → execute with token → receipt → settle → billing.

## Prerequisites

1. Veyra API on localhost:3000 (`pnpm dev` in repo root)
2. veyra-webhooks on localhost:4100 (`cd apps/veyra-webhooks && npm run dev`)
3. Delegation + seed data in DB

## Run

```bash
node client.mjs
```

## Flow

1. Check public stats (before)
2. POST /webhooks/send without token → 403 VeyraCommitRequired
3. Authorize action via Veyra → get execution token
4. POST /webhooks/send with X-Veyra-Token → 201 committed
5. Submit receipt to Veyra
6. Settle action → billing incremented
7. Check stats + billing (after)
