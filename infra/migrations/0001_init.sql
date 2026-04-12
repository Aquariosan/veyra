-- 0001_init.sql
-- Veyra Core v1 schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Principals: humans or orgs that delegate authority to agents
CREATE TABLE principals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_principals_tenant ON principals (tenant_id);

-- Agents: AI agents that act on behalf of principals
CREATE TABLE agents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    metadata    JSONB DEFAULT '{}',
    enabled     BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agents_tenant ON agents (tenant_id);

-- Delegations: authority granted from principal to agent
CREATE TABLE delegations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    principal_id    UUID NOT NULL REFERENCES principals(id),
    agent_id        UUID NOT NULL REFERENCES agents(id),
    scope           JSONB NOT NULL DEFAULT '{}',
    action_class    TEXT NOT NULL CHECK (action_class IN ('A', 'B', 'C', 'D')),
    risk_level      TEXT NOT NULL CHECK (risk_level IN ('low', 'business_critical', 'high', 'delegated')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_delegations_tenant ON delegations (tenant_id);
CREATE INDEX idx_delegations_agent ON delegations (agent_id);
CREATE INDEX idx_delegations_principal ON delegations (principal_id);

-- Execution tokens: issued after authorize-action + reserve_quota
CREATE TABLE execution_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    delegation_id   UUID NOT NULL REFERENCES delegations(id),
    agent_id        UUID NOT NULL REFERENCES agents(id),
    action_class    TEXT NOT NULL CHECK (action_class IN ('A', 'B', 'C', 'D')),
    action_type     TEXT NOT NULL,
    token_hash      TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'verified', 'consumed', 'expired', 'revoked')),
    quota_reserved  BOOLEAN NOT NULL DEFAULT false,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    verified_at     TIMESTAMPTZ,
    consumed_at     TIMESTAMPTZ
);

CREATE INDEX idx_execution_tokens_tenant ON execution_tokens (tenant_id);
CREATE INDEX idx_execution_tokens_agent ON execution_tokens (agent_id);
CREATE INDEX idx_execution_tokens_status ON execution_tokens (status);

-- Receipts: submitted after action execution
CREATE TABLE receipts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    token_id        UUID NOT NULL REFERENCES execution_tokens(id),
    agent_id        UUID NOT NULL REFERENCES agents(id),
    action_type     TEXT NOT NULL,
    action_class    TEXT NOT NULL CHECK (action_class IN ('A', 'B', 'C', 'D')),
    protocol        TEXT NOT NULL CHECK (protocol IN ('mcp', 'http')),
    result          JSONB DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_receipts_tenant ON receipts (tenant_id);
CREATE INDEX idx_receipts_token ON receipts (token_id);

-- Settlement events: finalization of accepted receipts
CREATE TABLE settlement_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    receipt_id      UUID NOT NULL REFERENCES receipts(id),
    action_class    TEXT NOT NULL CHECK (action_class IN ('A', 'B', 'C', 'D')),
    amount_eur      NUMERIC(12, 6) NOT NULL,
    status          TEXT NOT NULL DEFAULT 'settled' CHECK (status IN ('settled', 'disputed', 'reversed')),
    settled_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_settlement_events_tenant ON settlement_events (tenant_id);
CREATE INDEX idx_settlement_events_receipt ON settlement_events (receipt_id);

-- Trust signals: trust data for agents and delegations
CREATE TABLE trust_signals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    agent_id        UUID NOT NULL REFERENCES agents(id),
    signal_type     TEXT NOT NULL,
    value           JSONB NOT NULL DEFAULT '{}',
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trust_signals_tenant ON trust_signals (tenant_id);
CREATE INDEX idx_trust_signals_agent ON trust_signals (agent_id);

-- Billing usage daily: aggregated billing per tenant per day
CREATE TABLE billing_usage_daily (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    usage_date      DATE NOT NULL,
    action_class    TEXT NOT NULL CHECK (action_class IN ('A', 'B', 'C', 'D')),
    action_count    INTEGER NOT NULL DEFAULT 0,
    total_eur       NUMERIC(12, 6) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, usage_date, action_class)
);

CREATE INDEX idx_billing_usage_daily_tenant ON billing_usage_daily (tenant_id);
