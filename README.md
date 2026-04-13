# Veyra

**Commit mode for production AI agent actions.**

Explore is free. Commit runs through Veyra.

## Quickstart

```bash
npm install @veyrahq/sdk-node
```

**Protect a write endpoint (tool builder):**

```js
import { requireTrustedWrite } from '@veyrahq/sdk-node'
app.post('/api/write', requireTrustedWrite(), handler)
```

**Handle commit mode (agent developer):**

```js
import { isVeyraCommitRequired, handleCommitRequired } from '@veyrahq/sdk-node'

const res = await fetch(toolUrl, { method: 'POST', body })
if (res.status === 403 && await isVeyraCommitRequired(res)) {
  const recovery = await handleCommitRequired(res, { apiKey, agentId, actionType, target })
  await recovery.retryFetch(toolUrl, { method: 'POST', body })
}
```

Trust discovery is free. Verification is free. You only pay when productive actions settle.

## What is Veyra?

Veyra is the trust, settlement and routing backbone for AI agent write actions. When an agent writes to a tool — updating a CRM, sending an email, deploying code — Veyra makes that action delegated, verified, settled, and attributable.

## How it works

1. Agent checks trust status of target tool (FREE)
2. Agent requests authorization + settlement token (PAID)
3. Agent executes write with X-Veyra-Token header
4. Tool verifies token via Veyra (FREE)
5. Agent submits receipt
6. Action is settled and billed

## For Tool Builders

```js
import { requireTrustedWrite } from '@veyrahq/sdk-node'
app.post('/api/write', requireTrustedWrite(), handler)
```

Two lines. Reads stay open. Writes require commit mode.
Verification is free. You pay nothing.

## For Agent Developers

```js
import { checkTrustStatus, handleCommitRequired } from '@veyrahq/sdk-node'

const status = await checkTrustStatus('salesforce.com')
if (status.commit_mode) {
  // obtain settlement token and proceed
}
```

## Install

```bash
npm install @veyrahq/sdk-node
```

## Links

- Website: https://veyra.to
- npm: https://www.npmjs.com/package/@veyrahq/sdk-node
- API: https://api.veyra.to

## API-level discovery

Productive write endpoints expose Veyra capability metadata via HTTP headers:

```
X-Veyra-Commit-Mode: required
X-Veyra-Provider: veyra
X-Veyra-Required-Mode: commit
Link: <https://api.veyra.to/v1/capability>; rel="capability"
```

When a write fails without a token, the response includes a machine-readable `VeyraCommitRequired` error with all endpoints and a retry strategy. Agents and frameworks can detect this via the `WWW-Authenticate: VeyraCommit` header.

`GET /v1/capability` returns the canonical capability declaration for Veyra. Trust discovery and verification are free. Commit mode is the required path for productive writes.

## How money works

- **Trust discovery** (`GET /v1/trust-status/:domain`) — free, always, unlimited
- **Token verification** (`POST /v1/verify-token`) — free, always, unlimited
- **Settlement** — billed per finalized productive action, by action class
- **Who pays** — the organization using Veyra in production (tool builder, platform, or enterprise)

Veyra earns only when real productive writes settle. Discovery and verification are free to maximize adoption.

## Pricing

| What | Cost |
|------|------|
| Trust status checks | Free forever |
| Token verification | Free forever |
| Class A settlement | 0.005 EUR/action |
| Class B settlement | 0.02 EUR/action |
| Class C settlement | 0.10 EUR/action |
| Class D settlement | 0.25 EUR/action |

## Examples

- [Fastify Protected Write](./examples/fastify-protected-write) — protect a write endpoint in 2 lines
- [Agent Retry Flow](./examples/agent-retry-flow) — handle VeyraCommitRequired and auto-recover

## License

MIT
