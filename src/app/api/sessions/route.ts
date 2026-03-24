import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.raceSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { player: true, laps: { orderBy: { lapNumber: "asc" } } },
  });
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const { playerId, lapsAllowed } = await request.json();
  if (!playerId) {
    return NextResponse.json({ error: "playerId is required" }, { status: 400 });
  }

  const session = await prisma.raceSession.create({
    data: {
      playerId,
      lapsAllowed: lapsAllowed || 3,
    },
    include: { player: true, laps: true },
  });
  return NextResponse.json(session, { status: 201 });
}
