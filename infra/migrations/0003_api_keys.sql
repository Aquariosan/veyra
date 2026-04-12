-- 0003_api_keys.sql
-- API-Key auth + contract normalization

-- ═══════════════════════════════════
-- API-Key column on principals
-- ═══════════════════════════════════

ALTER TABLE principals ADD COLUMN IF NOT EXISTS api_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_principals_api_key
  ON principals (api_key) WHERE api_key IS NOT NULL;

UPDATE principals
  SET api_key = 'tr_test_key_2026'
  WHERE id = '11111111-1111-1111-1111-111111111111'
    AND (api_key IS NULL OR api_key != 'tr_test_key_2026');

-- ═══════════════════════════════════
-- Contract normalization: risk_level
-- DROP constraint first, then update, then re-add
-- ═══════════════════════════════════

ALTER TABLE delegations DROP CONSTRAINT IF EXISTS delegations_risk_level_check;
UPDATE delegations SET risk_level = 'critical' WHERE risk_level = 'delegated';
ALTER TABLE delegations ADD CONSTRAINT delegations_risk_level_check
  CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));

-- ═══════════════════════════════════
-- Contract normalization: settlement status
-- DROP constraint first, then update, then re-add
-- ═══════════════════════════════════

ALTER TABLE settlement_events DROP CONSTRAINT IF EXISTS settlement_events_status_check;
UPDATE settlement_events SET status = 'finalized' WHERE status = 'settled';
UPDATE settlement_events SET status = 'voided' WHERE status = 'reversed';
ALTER TABLE settlement_events ADD CONSTRAINT settlement_events_status_check
  CHECK (status IN ('finalized', 'disputed', 'voided'));
ALTER TABLE settlement_events ALTER COLUMN status SET DEFAULT 'finalized';
