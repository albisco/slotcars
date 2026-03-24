import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RawRow {
  player_id: string;
  player_name: string;
  session_id: string;
  laps_allowed: number;
  completed: boolean;
  session_created: Date;
  lap_id: string;
  lap_number: number;
  time_ms: number;
}

export async function GET() {
  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      p.id AS player_id,
      p.name AS player_name,
      s.id AS session_id,
      s."lapsAllowed" AS laps_allowed,
      s.completed,
      s."createdAt" AS session_created,
      l.id AS lap_id,
      l."lapNumber" AS lap_number,
      l."timeMs" AS time_ms
    FROM "Player" p
    JOIN "RaceSession" s ON s."playerId" = p.id
    JOIN "Lap" l ON l."sessionId" = s.id
    ORDER BY p.name ASC, s."createdAt" DESC, l."lapNumber" ASC
  `;

  // Build player map with sessions and laps
  const playersMap = new Map<string, {
    playerId: string;
    playerName: string;
    bestLapMs: number;
    bestAvgMs: number;
    sessionCount: number;
    sessions: Map<string, {
      id: string;
      lapsAllowed: number;
      completed: boolean;
      createdAt: string;
      laps: { id: string; lapNumber: number; timeMs: number }[];
    }>;
  }>();

  for (const row of rows) {
    if (!playersMap.has(row.player_id)) {
      playersMap.set(row.player_id, {
        playerId: row.player_id,
        playerName: row.player_name,
        bestLapMs: Infinity,
        bestAvgMs: 0,
        sessionCount: 0,
        sessions: new Map(),
      });
    }
    const player = playersMap.get(row.player_id)!;

    if (!player.sessions.has(row.session_id)) {
      player.sessions.set(row.session_id, {
        id: row.session_id,
        lapsAllowed: row.laps_allowed,
        completed: row.completed,
        createdAt: row.session_created.toISOString(),
        laps: [],
      });
    }

    player.sessions.get(row.session_id)!.laps.push({
      id: row.lap_id,
      lapNumber: row.lap_number,
      timeMs: row.time_ms,
    });

    // Track best lap
    if (row.time_ms < player.bestLapMs) {
      player.bestLapMs = row.time_ms;
    }
  }

  // Calculate best avg and session counts, build final array
  const leaderboard = Array.from(playersMap.values())
    .map((player) => {
      const sessions = Array.from(player.sessions.values());
      const completedSessions = sessions.filter((s) => s.completed && s.laps.length > 0);

      let bestAvgMs = 0;
      if (completedSessions.length > 0) {
        bestAvgMs = Math.round(
          Math.min(
            ...completedSessions.map(
              (s) => s.laps.reduce((sum, l) => sum + l.timeMs, 0) / s.laps.length
            )
          )
        );
      }

      return {
        playerId: player.playerId,
        playerName: player.playerName,
        bestLapMs: player.bestLapMs,
        bestAvgMs,
        sessionCount: sessions.length,
        sessions,
      };
    })
    .sort((a, b) => a.bestLapMs - b.bestLapMs)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return NextResponse.json(leaderboard);
}
