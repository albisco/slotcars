# St Patricks Slot Cars

Race timing dashboard for the St Patricks school fete. A kiosk-style app where an operator enters player names and lap times, with a live leaderboard ranking players by best single lap or best average.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Prisma 6** with **PostgreSQL** (Neon serverless)
- **Tailwind CSS 3**

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL — either [Neon](https://neon.tech) (serverless) or a local instance

### Setup with Neon

```bash
npm install
```

Create a `.env` file with your Neon connection string:

```
DATABASE_URL="postgresql://...@...neon.tech/..."
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

### Running Locally (without Neon)

For running at the fete without internet, use a local PostgreSQL instance:

1. Start PostgreSQL via Docker:

```bash
docker run --name slotcars-db -e POSTGRES_PASSWORD=slotcars -e POSTGRES_DB=slotcars -p 5432:5432 -d postgres:16
```

2. Create `.env` with the local connection string:

```
DATABASE_URL="postgresql://postgres:slotcars@localhost:5432/slotcars"
```

3. Push schema and seed:

```bash
npx prisma db push
npx prisma db seed
```

4. Start the dev server:

```bash
npm run dev
```

The app auto-detects whether the `DATABASE_URL` points to Neon or a local Postgres instance and uses the appropriate driver.

## How It Works

### Race Flow

1. Enter a player name and select number of laps (3 or 5)
2. Enter each lap time in seconds (e.g. `5.423`)
3. After the final lap, a summary shows the best lap highlighted
4. Click "Next Player" to start the next race

### Leaderboard

Ranks all players by best single lap time or best average session time (click column headers to toggle sort). Auto-refreshes every 10 seconds. Gold, silver, and bronze badges for top 3. Click a player name to see their full race history.

### Stats Bar

Shows three headline stats above the dashboard: Fastest Lap, Best Average, and Total Races.

### Admin Page

Navigate to `/admin` to manage race data (not linked from the public dashboard):
- Edit or delete individual lap times
- Delete entire race sessions
- Cleanup orphaned empty sessions

### External Hardware API

An external timing system can push lap results directly. Accepts either `timeSecs` (seconds) or `timeMs` (milliseconds):

```bash
curl -X POST http://localhost:3000/api/laps/push \
  -H "Content-Type: application/json" \
  -d '{"playerName": "Alice", "lapNumber": 1, "timeSecs": 4.523}'
```

This auto-creates the player and session if they don't exist.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/players` | List / create player |
| GET | `/api/players/[id]` | Player with sessions + laps |
| GET/POST | `/api/sessions` | List / create race session |
| PATCH/DELETE | `/api/sessions/[id]` | Update / delete session |
| POST | `/api/sessions/[id]/laps` | Record a lap time |
| DELETE | `/api/sessions/cleanup` | Purge empty sessions |
| PATCH/DELETE | `/api/laps/[id]` | Edit / delete a lap |
| GET | `/api/leaderboard` | All players + sessions + laps |
| GET/PATCH | `/api/settings` | Get/update default laps |
| POST | `/api/laps/push` | External hardware push endpoint |
| GET | `/api/events` | SSE stream for real-time updates |

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
