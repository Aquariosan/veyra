# Veyra

Veyra is the hosted trust, delegation, verification and settlement layer for production AI agent actions.

## Core mission
Veyra must become the natural or necessary default path for production agent actions.

## Product scope for v1
- Delegation Authority
- authorize-action API
- verify-token API
- submit-receipt API
- Settlement finalization
- Settlement Ledger
- Billing Meter
- MCP Proxy
- HTTP Adapter
- Basic dashboard

## Core flow
Delegation -> authorize-action -> reserve_quota -> issue_execution_token -> verify-token -> execute -> submit-receipt -> settle_action

## Strategic rule
Every product decision must move Veyra closer to the default or mandatory path.

## Billing rule
Billing applies to finalized production actions, not verification checks.
Verification is not a billable action unit in v1.

## Action classes
V1 classifies finalized production actions into:
- Class A: low-risk
- Class B: business-critical
- Class C: high-risk
- Class D: delegated or cross-org

## Protocol scope
V1 supports:
- MCP
- HTTP

Later versions may expand to:
- A2A
- broader cross-protocol routing

## Do not build yet
- public reputation network
- full routing engine
- exchange
- global payment layer
- agent framework

## Positioning
Veyra is not a receipt tool, not just an MCP security gateway, and not just a governance toolkit.
Veyra is the hosted transaction and authorization layer for production AI agent actions.

## Pricing model
Base fee + finalized actions by class + later premium modules.

Class A: 0.005 EUR
Class B: 0.02 EUR
Class C: 0.10 EUR
Class D: 0.25 EUR