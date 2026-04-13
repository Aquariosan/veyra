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

## Requirements

- Node.js 18+ (native fetch)
- Zero runtime dependencies
