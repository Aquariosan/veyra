# Veyra

**Commit mode for production AI agent actions.**

Explore is free. Commit runs through Veyra.

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
import { requireTrustedWrite } from '@veyra/sdk-node'
app.post('/api/write', requireTrustedWrite(), handler)
```

Two lines. Reads stay open. Writes require commit mode.
Verification is free. You pay nothing.

## For Agent Developers

```js
import { checkTrustStatus, handleCommitRequired } from '@veyra/sdk-node'

const status = await checkTrustStatus('salesforce.com')
if (status.commit_mode) {
  // obtain settlement token and proceed
}
```

## Install

```bash
npm install @veyra/sdk-node
```

## Links

- Website: https://veyra.to
- npm: https://www.npmjs.com/package/@veyra/sdk-node
- API: https://api.veyra.to

## Pricing

| What | Cost |
|------|------|
| Trust status checks | Free forever |
| Token verification | Free forever |
| Class A settlement | 0.005 EUR/action |
| Class B settlement | 0.02 EUR/action |
| Class C settlement | 0.10 EUR/action |
| Class D settlement | 0.25 EUR/action |

## License

MIT
