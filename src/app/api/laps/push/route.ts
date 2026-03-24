import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * External hardware endpoint.
 * POST { playerName, lapNumber, timeMs, lapsAllowed? }
 * Auto-creates player and session if needed.
 */
export async function POST(request: Request) {
  const { playerName, lapNumber, timeMs, lapsAllowed } = await request.json();

  if (!playerName || typeof playerName !== "string") {
    return NextResponse.json({ error: "playerName is required" }, { status: 400 });
  }
  if (typeof lapNumber !== "number" || lapNumber < 1) {
    return NextResponse.json({ error: "Valid lapNumber is required" }, { status: 400 });
  }
  if (typeof timeMs !== "number" || timeMs <= 0) {
    return NextResponse.json({ error: "Valid timeMs is required" }, { status: 400 });
  }

  // Find or create player
  let player = await prisma.player.findFirst({
    where: { name: { equals: playerName.trim(), mode: "insensitive" } },
  });
  if (!player) {
    player = await prisma.player.create({
      data: { name: playerName.trim() },
    });
  }

  // Find active (incomplete) session for this player, or create one
  let session = await prisma.raceSession.findFirst({
    where: { playerId: player.id, completed: false },
    orderBy: { createdAt: "desc" },
    include: { laps: true },
  });

  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const defaultLaps = lapsAllowed || settings?.defaultLaps || 3;

  if (!session) {
    session = await prisma.raceSession.create({
      data: { playerId: player.id, lapsAllowed: defaultLaps },
      include: { laps: true },
    });
  }

  // Record the lap
  const lap = await prisma.lap.create({
    data: {
      sessionId: session.id,
      lapNumber,
      timeMs,
    },
  });

  // Auto-complete session if all laps recorded
  if (session.laps.length + 1 >= session.lapsAllowed) {
    await prisma.raceSession.update({
      where: { id: session.id },
      data: { completed: true },
    });
  }

  return NextResponse.json({
    player: { id: player.id, name: player.name },
    sessionId: session.id,
    lap,
  }, { status: 201 });
}
