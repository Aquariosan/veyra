# veyra-webhooks

Productive consequence endpoint protected by Veyra commit mode. Simulates outbound webhook sends that require delegation, verification, and settlement.

## Run

```bash
cd apps/veyra-webhooks
npm install
npm run dev
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VEYRA_BASE_URL` | `https://api.veyra.to` | Veyra API for token verification |
| `WEBHOOKS_PORT` | `4100` | Server port |

## Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/webhooks/health` | GET | Open | Health check |
| `/webhooks/send` | POST | Commit mode | Protected consequence endpoint |

## POST /webhooks/send

Requires `X-Veyra-Token` header. Without it, returns 403 VeyraCommitRequired.

```json
{
  "url": "https://hooks.slack.com/...",
  "method": "POST",
  "payload": { "text": "Hello" },
  "risk_class": "B",
  "outcome_type": "notification",
  "is_external": true,
  "is_reversible": false
}
```

Response includes a settlement passport with verification state, risk class, and estimated billing amount.

## Links

- Veyra: https://veyra.to
- SDK: https://www.npmjs.com/package/@veyrahq/sdk-node
