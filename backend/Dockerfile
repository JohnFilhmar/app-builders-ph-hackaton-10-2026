# Tara backend: model catalog, model file mirror, leaderboard and landing page.
# Build from the repo root, because the leaderboard imports the app's own game rules from tara/src:
#   docker compose -f backend/docker-compose.prod.yml up -d --build
# node:22-alpine 22.23.3, pinned by digest; bump the tag and digest together.
ARG NODE_IMAGE=node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402

FROM ${NODE_IMAGE} AS deps
WORKDIR /deps
# zod is the only runtime package: tara/src/types/gameEvents.ts validates uploaded ledgers with it
RUN npm init -y >/dev/null && npm install --omit=dev --no-audit --no-fund zod@4.6.5

FROM ${NODE_IMAGE}
ENV NODE_ENV=production PORT=8787
WORKDIR /app
COPY --from=deps /deps/node_modules ./node_modules
COPY tara/src ./tara/src
COPY ai-feasibility/src/lib/catalog/catalog.json ./ai-feasibility/src/lib/catalog/catalog.json
COPY backend ./backend
RUN mkdir -p backend/data backend/models && chown -R node:node backend/data backend/models
USER node
WORKDIR /app/backend
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:8787/health || exit 1
CMD ["node", "--experimental-strip-types", "--no-warnings", "--import", "./app_paths.mjs", "server.ts"]
