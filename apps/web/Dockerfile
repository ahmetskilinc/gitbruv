FROM oven/bun:1 AS builder

WORKDIR /app

ARG API_URL
ARG NEXT_PUBLIC_API_URL

ENV API_URL=$API_URL
# Inlined into the client bundle at build time — must be set HERE, not at runtime.
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/
COPY apps/oauth-test/package.json ./apps/oauth-test/
COPY packages/lib/package.json ./packages/lib/
COPY packages/hooks/package.json ./packages/hooks/
COPY packages/db/package.json ./packages/db/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# The Hugeicons registry token is mounted as a build secret (exposed only as an
# env var for this single step) so it never persists in an image layer or the
# exported build cache. .npmrc reads it via $NPM_CONFIG_HUGEICONS_KEY.
# (apps/web no longer uses hugeicons, but the workspace install still resolves
# apps/mobile, which does.)
RUN --mount=type=secret,id=hugeicons,env=NPM_CONFIG_HUGEICONS_KEY bun install --ignore-scripts

COPY packages ./packages
COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN bun run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# `output: "standalone"` with outputFileTracingRoot at the repo root produces
# a pruned monorepo layout: server + traced node_modules under .next/standalone.
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
