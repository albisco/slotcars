# St Patricks Slot Cars

Race timing dashboard for the St Patricks school fete. A single-page kiosk-style app where an operator enters player names and lap times, with a live leaderboard ranking players by their best single lap.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Prisma 6** with **PostgreSQL** (Neon serverless)
- **Tailwind CSS 3**

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database

### Setup

```bash
npm install
```

Create a `.env` file:

```
DATABASE_URL="postgresql://..."
```

Push the schema and seed the database:

```bash
npx prisma db push
npx prisma db seed
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

### Race Flow

1. Enter a player name and select number of laps (3 or 5)
2. Enter each lap time in milliseconds
3. After the final lap, a summary shows the best lap highlighted
4. Click "Next Player" to start the next race

### Leaderboard

Ranks all players by their best single lap time. Auto-refreshes every 5 seconds.

### External Hardware API

An external timing system can push lap results directly:

```bash
curl -X POST http://localhost:3000/api/laps/push \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Alice", "lapNumber": 1, "timeMs": 4523}'
```

This auto-creates the player and session if they don't exist.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/players` | List / create player |
| GET/POST | `/api/sessions` | List / create race session |
| PATCH | `/api/sessions/[id]` | Mark session completed |
| POST | `/api/sessions/[id]/laps` | Record a lap time |
| GET | `/api/leaderboard` | Best lap per player, sorted |
| GET/PATCH | `/api/settings` | Get/update default laps |
| POST | `/api/laps/push` | External hardware push endpoint |

## Data Model

- **Player** — name (case-insensitive, auto-deduped)
- **RaceSession** — belongs to Player, configurable lap count (3 or 5)
- **Lap** — lap number + time in milliseconds
- **Settings** — default number of laps

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npx prisma db push` | Push schema to database |
| `npx prisma db seed` | Seed default settings |

## Development

- Never push directly to `main` — use feature branches and pull requests
- Vercel deploys a preview per branch with its own Neon DB branch
