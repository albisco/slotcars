import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get all players with their laps
  const players = await prisma.player.findMany({
    include: {
      sessions: {
        include: { laps: true },
      },
    },
  });

  // Calculate best lap per player
  const leaderboard = players
    .map((player) => {
      const allLaps = player.sessions.flatMap((s) => s.laps);
      if (allLaps.length === 0) return null;

      const bestLap = allLaps.reduce((best, lap) =>
        lap.timeMs < best.timeMs ? lap : best
      );

      return {
        playerName: player.name,
        bestLapMs: bestLap.timeMs,
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
