FROM node:20-alpine AS base
RUN npm install -g pnpm@9.15.4
WORKDIR /app

# ── Install dependencies ──
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/sdk-node/package.json packages/sdk-node/
COPY packages/adapter-http/package.json packages/adapter-http/
COPY packages/shared/package.json* packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# ── Copy source ──
COPY tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/ packages/

# ── Build ──
RUN pnpm --filter @veyra/api build

# ── Production ──
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm@9.15.4

COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=base /app/apps/api/package.json apps/api/
COPY --from=base /app/apps/api/dist apps/api/dist/
COPY --from=base /app/node_modules node_modules/
COPY --from=base /app/apps/api/node_modules* apps/api/node_modules/

ENV NODE_ENV=production
EXPOSE ${PORT:-3000}

CMD ["node", "apps/api/dist/server.js"]
