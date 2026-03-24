# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Slot car race timing dashboard for the St Patricks school fete. Kiosk-style app — no auth. An operator enters player names and lap times; a leaderboard shows best single lap and best average per player. Designed to eventually receive lap times from an external hardware timing project via API.

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
- Neon DB in `aws-ap-southeast-2` (Sydney), Neon branches auto-created per Vercel preview deployment

## Data Model

- **Player** — name (case-insensitive lookup, auto-deduped on create)
- **RaceSession** — belongs to Player, has configurable `lapsAllowed` (3 or 5), `completed` flag
- **Lap** — belongs to RaceSession, has `lapNumber` + `timeMs` (milliseconds), unique per session+lapNumber
- **Settings** — singleton row (`id: "default"`), stores `defaultLaps`

## Architecture

### No Auth
Kiosk-style app — no users, no roles, no middleware. All API routes are open. Admin page is at `/admin` (not linked from dashboard, organiser-only by obscurity).

### Shared Leaderboard Data
A single raw SQL query in `/api/leaderboard` returns all players with their sessions and laps. The `useLeaderboard` hook (`src/lib/use-leaderboard.ts`) provides a shared client-side cache polled every 10 seconds — all components (leaderboard table, stats bar, player detail dialog) read from this single cache. No duplicate fetches.

### Leaderboard
Sortable by best single lap or best average session time. Gold/silver/bronze rank badges. Click player name to see full race history in a read-only dialog.

### Stats Bar
Three cards above the dashboard: Fastest Lap, Best Average, Total Races. Reads from the shared leaderboard cache.

### Race Flow
1. Operator enters player name + selects laps (3 or 5) → creates Player (if new) + RaceSession
2. Operator enters each lap time in seconds (e.g. `5.423`) → converted to ms, POST to `/api/sessions/[id]/laps`
3. After final lap, session marked `completed` → summary shown with best lap highlighted
4. "Next Player" resets the form. "Cancel Race" deletes the session from DB.

### Admin Page (`/admin`)
Not linked from dashboard — organiser navigates directly. Allows:
- Expand any player to see all sessions and laps
- Edit lap times (pencil icon, enter seconds)
- Delete individual laps or entire sessions
- Cleanup orphaned empty sessions

### External Hardware API
`POST /api/laps/push` accepts `{ playerName, lapNumber, timeMs | timeSecs, lapsAllowed? }` — auto-creates player and session. Designed for an external timing system to push results directly.

### API Routes
```
GET/POST    /api/players              — list / create player
GET         /api/players/[id]         — player with all sessions + laps
GET/POST    /api/sessions             — list / create session
PATCH/DEL   /api/sessions/[id]        — update / delete session
POST        /api/sessions/[id]/laps   — record a lap
DELETE      /api/sessions/cleanup     — purge sessions with no laps
PATCH/DEL   /api/laps/[id]            — edit / delete a lap
GET         /api/leaderboard          — all players + sessions + laps (single raw SQL query)
GET/PATCH   /api/settings             — get/update default laps
POST        /api/laps/push            — external hardware push endpoint
```

### Key Lib Files
- `src/lib/prisma.ts` — Prisma singleton with Neon adapter
- `src/lib/use-leaderboard.ts` — shared leaderboard cache + polling hook + `refreshLeaderboard()`
- `src/lib/format.ts` — `formatTime(ms)` helper (ms → "1.234s" or "1:05.432")
- `src/lib/utils.ts` — `cn()` class merge utility

## UI Structure

- **Dashboard** (`/`) — stats bar + two-panel layout (leaderboard + race control)
- **Settings** (`/settings`) — configure default laps
- **Admin** (`/admin`) — CRUD for race data (not linked from dashboard)

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
- Performance-critical queries use raw SQL via `prisma.$queryRaw` instead of Prisma's nested includes
- `@/*` path alias maps to `./src/*`
