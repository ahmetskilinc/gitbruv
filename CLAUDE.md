# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Bun workspaces + Turborepo. Package manager is **bun** (`bun.lock`).

- `apps/web` — Next.js 16 App Router (Turbopack), React 19, Tailwind v4, shadcn/ui (style `base-nova`, Base UI primitives — compose with `render`, not `asChild`; icons: Remixicon). Client-side react-query for all data via `@gitbruv/hooks`; `middleware.ts` + `app/api/git-proxy` proxy the git Smart HTTP protocol to the API. `NEXT_PUBLIC_API_URL` is inlined at build time (dev values live in `apps/web/.env.local`). Port 3000.
- `apps/api` — Hono on Bun runtime. better-auth, Drizzle, isomorphic-git, S3, Redis, Resend. Port 3001.
- `apps/mobile` — Expo (Expo Router, NativeWind, EAS). Port 8081.
- `apps/oauth-test` — disposable scratch app for testing the OAuth provider. Ignore it; never model conventions on it.
- `packages/db` — Drizzle schema + drizzle-kit scripts. `packages/lib`, `packages/hooks` — shared utils/hooks with subpath exports. `packages/eslint-config` — shared flat config.

Architecture: bare Git repos are stored in S3. Each Git operation syncs S3 → temp dir, runs isomorphic-git, syncs back on push. Git Smart HTTP is served at `/api/git/*`.

## Commands

There is no plain `dev`/`build`/`test` at the root — scripts are turbo-filtered:

- `bun run dev:web` — web + api. `bun run dev:mobile` — mobile + api.
- `bun run build:web` — web + api.
- `bun run lint` — runs `turbo lint --force` (the `--force` is required; the lint task has no cache config).
- DB scripts only exist in `packages/db` (no root aliases): `cd packages/db && bun run db:generate | db:migrate | db:push | db:studio`.

There is no test framework installed.

## Setup gotchas

- `bun install` requires `NPM_CONFIG_HUGEICONS_KEY` in the environment (`.npmrc` uses it for the `@hugeicons-pro` registry). Only `apps/mobile` still uses hugeicons, but the workspace install resolves it regardless.
- Single shared `.env` at the repo root for the whole monorepo (see `.env.example`).
- Known mismatch: `.env.example` and README say `S3_BUCKET_NAME`, but `apps/api/src/config.ts` reads `S3_BUCKET`.
- Ignore local `origin/mvp` / `origin/HEAD` refs — the `mvp` branch was deleted on the remote. `main` is the active branch; open PRs against `main` (CI only runs on PRs into `main`).

## Database

Schema workflow is **`db:generate` + `db:migrate`** with committed migration files (`packages/db/migrations/`). Do not use `db:push` for schema changes. Note: no migrations are committed yet — the first generate will create the baseline.

## Code style

- Prettier config (`.prettierrc`) is the source of truth: 100 print width, 2-space indent, semicolons, **single quotes**. (Its sort-imports/tailwindcss plugins aren't installed yet and there's no format script — match the config, not necessarily surrounding files.)
- Use `import type` for type-only imports (`consistent-type-imports` is an error).
- Prefix intentionally unused vars with `_`.
- `no-console` is a warning everywhere except `apps/api`, where it's allowed.
- `apps/web` path alias: `@/*`.
- Commit style: Conventional Commits (`feat:`, `fix:`, `ci:`).

## Docker

- `apps/api`'s bundle `--external` flag list is duplicated in `apps/api/Dockerfile` and `apps/api/package.json`'s `build` script — keep both in sync.
- `apps/web/Dockerfile` copies every workspace's `package.json` for resolution — adding a new workspace requires updating both Dockerfiles.
