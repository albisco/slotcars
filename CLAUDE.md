# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Slot car race timing dashboard for the St Patricks school fete. Single-page kiosk-style app — no auth. An operator enters player names and lap times; a leaderboard shows best single lap per player. Designed to eventually receive lap times from an external hardware timing project via API.

## Tech Stack

- **Next.js 14** (App Router, TypeScript), **Prisma 6** ORM, **PostgreSQL** (Neon serverless, Sydney region)
- **Tailwind CSS 3** with hand-rolled shadcn-style UI components (same patterns as sister project `teammanager`)
- **Neon adapter:** `@prisma/adapter-neon` for HTTP-based queries (no TCP cold starts)
- **Toasts:** `sonner`, **Icons:** `lucide-react`

## Commands

- `npm run dev` — start dev server on port 3000
- `npm run build` — runs `prisma generate && next build`
- `npm test` — run vitest unit tests
- `npm run test:watch` — vitest in watch mode
- `npx prisma db push` — push schema to database
- `npx prisma generate` — regenerate Prisma client after schema changes
- `npx prisma db seed` — seed default settings (3 laps)

## Database

- `.env` has `DATABASE_URL` (Neon pooler endpoint) — **never commit this file**
- Use `npx prisma db push` for schema changes (not `migrate dev` — doesn't work in non-interactive terminals)
- Neon DB in `aws-ap-southeast-2` (Sydney)

## Data Model

- **Player** — name (case-insensitive lookup, auto-deduped on create)
- **RaceSession** — belongs to Player, has configurable `lapsAllowed` (3 or 5), `completed` flag
- **Lap** — belongs to RaceSession, has `lapNumber` + `timeMs` (milliseconds), unique per session+lapNumber
- **Settings** — singleton row (`id: "default"`), stores `defaultLaps`

## Architecture

### No Auth
This is a kiosk-style app — no users, no roles, no middleware. All API routes are open.

### Leaderboard
Ranked by best single lap time per player (lowest `timeMs` across all their laps). Polls `/api/leaderboard` every 5 seconds on the client.

### Race Flow
1. Operator enters player name + selects laps (3 or 5) → creates Player (if new) + RaceSession
2. Operator enters each lap time in milliseconds → POST to `/api/sessions/[id]/laps`
3. After final lap, session marked `completed` → summary shown with best lap highlighted
4. "Next Player" resets the form

### External Hardware API
`POST /api/laps/push` accepts `{ playerName, lapNumber, timeMs, lapsAllowed? }` — auto-creates player and session. Designed for an external timing system to push results directly.

### API Routes
```
GET/POST   /api/players              — list / create player
GET/POST   /api/sessions             — list / create session
PATCH      /api/sessions/[id]        — mark completed
POST       /api/sessions/[id]/laps   — record a lap
GET        /api/leaderboard          — best lap per player, sorted
GET/PATCH  /api/settings             — get/update default laps
POST       /api/laps/push            — external hardware push endpoint
```

### Key Lib Files
- `src/lib/prisma.ts` — Prisma singleton with Neon adapter
- `src/lib/format.ts` — `formatTime(ms)` helper (ms → "1.234s" or "1:05.432")
- `src/lib/utils.ts` — `cn()` class merge utility

## UI Structure

Single-page dashboard (`/`) with two-panel layout (side by side on desktop, stacked on mobile):
- **Left:** Leaderboard table (auto-refreshing)
- **Right:** Race control (new race form → lap entry → session summary)
- **Settings page** (`/settings`) — configure default laps

## Dev Workflow

- **Never push directly to `main`.** Always use feature branches and pull requests.
- `git checkout -b feat/my-feature` → `npm test` → `git push -u origin feat/my-feature && gh pr create`
- Vercel deploys a preview per branch with its own Neon DB branch

## Conventions

- UI components in `src/components/ui/` — Tailwind v3, no radix dependencies, using CVA for variants
- API routes return `NextResponse.json()`, validate input at the top of each handler
- Times stored in DB as integer milliseconds; UI accepts seconds (e.g. `5.423`), converted to ms on submit
- Hardware push API (`/api/laps/push`) accepts either `timeMs` (int ms) or `timeSecs` (decimal seconds)
- Player name matching is case-insensitive (Prisma `mode: "insensitive"`)
- `@/*` path alias maps to `./src/*`
