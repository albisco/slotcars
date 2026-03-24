import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface PlayerRow {
  player_id: string;
  player_name: string;
}

interface SessionLapRow {
  session_id: string;
  laps_allowed: number;
  completed: boolean;
  session_created: Date;
  lap_number: number | null;
  time_ms: number | null;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // Single query: get player + all sessions with laps (only sessions that have laps)
  const rows = await prisma.$queryRaw<(PlayerRow & SessionLapRow)[]>`
    SELECT
      p.id AS player_id,
      p.name AS player_name,
      s.id AS session_id,
      s."lapsAllowed" AS laps_allowed,
      s.completed,
      s."createdAt" AS session_created,
      l."lapNumber" AS lap_number,
      l."timeMs" AS time_ms
    FROM "Player" p
    LEFT JOIN "RaceSession" s ON s."playerId" = p.id
    LEFT JOIN "Lap" l ON l."sessionId" = s.id
    WHERE p.id = ${params.id}
    ORDER BY s."createdAt" DESC, l."lapNumber" ASC
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Assemble response
  const sessionsMap = new Map<string, {
    id: string;
    lapsAllowed: number;
    completed: boolean;
    createdAt: string;
    laps: { lapNumber: number; timeMs: number }[];
  }>();

  for (const row of rows) {
    if (!row.session_id) continue;

    if (!sessionsMap.has(row.session_id)) {
      sessionsMap.set(row.session_id, {
        id: row.session_id,
        lapsAllowed: row.laps_allowed,
        completed: row.completed,
        createdAt: row.session_created.toISOString(),
        laps: [],
      });
    }

    if (row.lap_number !== null && row.time_ms !== null) {
      sessionsMap.get(row.session_id)!.laps.push({
        lapNumber: row.lap_number,
        timeMs: row.time_ms,
      });
    }
  }

  return NextResponse.json({
    id: rows[0].player_id,
    name: rows[0].player_name,
    sessions: Array.from(sessionsMap.values()),
  });
}
