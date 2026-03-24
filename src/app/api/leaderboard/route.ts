import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const players = await prisma.player.findMany({
    include: {
      sessions: {
        include: { laps: true },
      },
    },
  });

  const leaderboard = players
    .map((player) => {
      const allLaps = player.sessions.flatMap((s) => s.laps);
      if (allLaps.length === 0) return null;

      const bestLap = allLaps.reduce((best, lap) =>
        lap.timeMs < best.timeMs ? lap : best
      );

      // Best average: lowest avg lap time across completed sessions
      const completedSessions = player.sessions.filter(
        (s) => s.completed && s.laps.length > 0
      );
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
        playerId: player.id,
        playerName: player.name,
        bestLapMs: bestLap.timeMs,
        bestAvgMs,
        sessionCount: player.sessions.length,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.bestLapMs - b.bestLapMs)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return NextResponse.json(leaderboard);
}
