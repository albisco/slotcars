import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface LeaderboardRow {
  player_id: string;
  player_name: string;
  best_lap_ms: bigint;
  best_avg_ms: number | null;
  session_count: bigint;
}

export async function GET() {
  const rows = await prisma.$queryRaw<LeaderboardRow[]>`
    SELECT
      p.id AS player_id,
      p.name AS player_name,
      MIN(l."timeMs") AS best_lap_ms,
      (
        SELECT ROUND(AVG(l2."timeMs"))
        FROM "RaceSession" s2
        JOIN "Lap" l2 ON l2."sessionId" = s2.id
        WHERE s2."playerId" = p.id AND s2.completed = true
        GROUP BY s2.id
        ORDER BY AVG(l2."timeMs") ASC
        LIMIT 1
      ) AS best_avg_ms,
      COUNT(DISTINCT s.id) AS session_count
    FROM "Player" p
    JOIN "RaceSession" s ON s."playerId" = p.id
    JOIN "Lap" l ON l."sessionId" = s.id
    GROUP BY p.id, p.name
    ORDER BY best_lap_ms ASC
  `;

  const leaderboard = rows.map((row, index) => ({
    rank: index + 1,
    playerId: row.player_id,
    playerName: row.player_name,
    bestLapMs: Number(row.best_lap_ms),
    bestAvgMs: row.best_avg_ms ? Math.round(Number(row.best_avg_ms)) : 0,
    sessionCount: Number(row.session_count),
  }));

  return NextResponse.json(leaderboard);
}
