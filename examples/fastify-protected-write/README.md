# Fastify Protected Write

Protect productive write endpoints with Veyra commit mode.
Reads stay open. Writes require a settlement token.

## Run

```bash
npm install fastify
node server.mjs
```

## Test

```bash
# Read — open, no token needed
curl http://localhost:4000/api/contacts

# Write without token — 403 VeyraCommitRequired
curl -X POST http://localhost:4000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane"}'

# Write with token — 201 Created
curl -X POST http://localhost:4000/api/contacts \
  -H "Content-Type: application/json" \
  -H "X-Veyra-Token: <your-execution-token>" \
  -d '{"name": "Jane"}'
```
