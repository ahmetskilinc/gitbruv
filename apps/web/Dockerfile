FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/

RUN bun install

COPY packages ./packages
COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN bun run build

FROM oven/bun:1-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

ENV NODE_ENV=production
EXPOSE 3000
WORKDIR /app/apps/web

CMD ["bun", "run", "apps/web/dist/server/server.js"]
