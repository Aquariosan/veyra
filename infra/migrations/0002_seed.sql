-- 0002_seed.sql
-- Local development seed data

INSERT INTO principals (id, tenant_id, name, email)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Dev Principal',
    'dev@veyra.local'
);

INSERT INTO agents (id, tenant_id, name, description)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Dev Agent',
    'Default agent for local development'
);
