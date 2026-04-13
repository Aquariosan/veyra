# @veyrahq/sdk-node

> Commit Mode for AI Agent Actions.
> Free verification. Free trust checks. No registration needed.

## The Problem

AI agents execute actions on your tool.
Without Veyra, you don't know if the action was authorized,
budgeted, or delegated. It's just... an API call.

## The Solution: Trusted Production Mode

With Veyra, every productive write is:

- **Delegated** (someone authorized this agent)
- **Budgeted** (the action is within spend limits)
- **Verified** (the token is cryptographically signed)
- **Settled** (the action is attributed and billed)

## Quick Start - Pre-Flight Check (1 line)

```js
import { checkTrustStatus } from '@veyrahq/sdk-node'

const status = await checkTrustStatus('salesforce.com')
// -> { production_mode: "trusted", commit_mode: true }
```

## Quick Start - Verify Token (1 line)

```js
import { verifyVeyraToken } from '@veyrahq/sdk-node'

const result = await verifyVeyraToken(token)
if (!result.valid) throw new Error('Unauthorized agent action')
```

## Enforce Commit Mode (2 lines)

```js
import { requireTrustedWrite } from '@veyra/adapter-http'

app.use(requireTrustedWrite())
```

## Full Client

```js
import { VeyraClient } from '@veyrahq/sdk-node'

const veyra = new VeyraClient({ apiKey: 'tr_...' })

// Public - no key needed
const trust = await veyra.checkTrustStatus('salesforce.com')
const verify = await veyra.verifyToken(token)

// Authenticated
const auth = await veyra.authorizeAction(agentId, 'create_contact', 'crm')
const receipt = await veyra.submitReceipt(token, 'http', { ok: true })
```

## One-call commit automation

Use `commitAwareFetch()` instead of `fetch()` when writing to endpoints
that may require Veyra commit mode. It works exactly like `fetch()`, but
if the target returns VeyraCommitRequired, it automatically authorizes
the action and retries with a settlement token.

```js
import { commitAwareFetch } from '@veyrahq/sdk-node'

const res = await commitAwareFetch('https://tool.com/api/write', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Jane' }),
}, { apiKey: 'tr_...', agentId: '...', actionType: 'create_contact', target: 'crm' })
```

## MCP Server Card

Declare your tool as Trusted Production Mode:

```json
{
  "security": {
    "productionMode": "trusted",
    "trustedWriteRequired": true,
    "commitModeProvider": "veyra",
    "verifyEndpoint": "https://api.veyra.dev/v1/verify-token"
  }
}
```

When an AI reads this Server Card, it knows:
"To write to this tool, I need a Veyra token."
The AI tells the developer. The developer integrates Veyra.
You didn't sell anything. The AI sold it for you.

## Pricing

- Trust status checks: **FREE. Always. Unlimited.**
- Token verification: **FREE. Always. Unlimited.**
- Settlement tokens: Issued by Veyra to authorized agents.

## Billing model

- Discovery (`checkTrustStatus`, `fetchCapability`): free, unlimited
- Verification (`verifyVeyraToken`): free, unlimited, non-billable
- Settlement: billed per finalized productive action
- Classes: A (0.005 EUR), B (0.02 EUR), C (0.10 EUR), D (0.25 EUR)
- Usage export: `GET /v1/billing/usage` with API key

## Requirements

- Node.js 18+ (native fetch)
- Zero runtime dependencies
