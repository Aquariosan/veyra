# Veyra Masterplan

## One-line definition
Veyra is the hosted trust, delegation, verification and settlement layer for production AI agent actions.

## Core objective
Veyra must be perceived and integrated as the natural or necessary default path for production agent execution.

## Why this wins
Agents use what their provider, framework, tool-host, gateway, enterprise policy or runtime allows or requires.
Therefore Veyra must sit on the default path.

## Adoption doctrine
- Gateway-first
- Authorization-native
- Tool acceptance for critical writes
- Enterprise production policy lock-in
- Hosted verification
- Later: trust graph and trust-weighted routing

## MVP modules
- Delegation Authority
- authorize-action
- reserve_quota
- issue_execution_token
- verify-token
- submit-receipt
- settle_action
- Settlement Ledger
- Billing Meter
- MCP Proxy
- HTTP Adapter
- Basic dashboard

## Core execution chain
Delegation -> authorize-action -> reserve_quota -> issue_execution_token -> verify-token -> execute -> submit-receipt -> settle_action

## Billing principle
Veyra bills finalized production actions.
Verification checks are not billed as action units in v1.

## Action classes
- A = low-risk
- B = business-critical
- C = high-risk
- D = delegated / cross-org

## Protocol scope
V1 supports:
- MCP
- HTTP

Later versions may support:
- A2A
- broader cross-protocol delegation and routing

## First demos
- GitHub
- CRM
- Email

## Pricing
- Sandbox: free or cheap, non-production
- Production Core: from 2500 EUR/month
- Business Control: from 7500 EUR/month
- Enterprise: from 30000 EUR/year plus usage

Action classes:
- A = 0.005 EUR
- B = 0.02 EUR
- C = 0.10 EUR
- D = 0.25 EUR

## Non-negotiable rule
Do not shrink Veyra into a receipt tool, MCP security wrapper or generic governance toolkit.

## Phase 3: On the Horizon
- /.well-known/veyra.json discovery standard
- Machine-readable retry protocol
- Agent framework default error handlers for VeyraCommitRequired
- Broader host/agent integration
- MCP Enterprise Working Group SEP for settlement tokens

## Distribution priority
The bottleneck is no longer core functionality.
It is visibility, installability, and first external adoption.
Next steps: GitHub public, npm publish, landing page, first tool partner.

## Commit Retry Protocol
Every rejected productive write must return a machine-readable
VeyraCommitRequired response with all endpoints and retry strategy.
This turns every rejection into automatic Veyra traffic.

## Capability Discovery
Veyra must be recognizable not only through website and SDK, but directly through:
- API metadata (X-Veyra-Commit-Mode headers on every protected route)
- Public capability endpoint (/v1/capability)
- Runtime errors (VeyraCommitRequired with WWW-Authenticate)
- Capability declarations (VeyraCapabilityMetadata type)
- Framework integrations (handleCommitRequired, readDiscoveryHeaders)
- Host/gateway enforcement (requireTrustedWrite middleware)

Long-term goal: Veyra as required commit capability for productive agent writes.