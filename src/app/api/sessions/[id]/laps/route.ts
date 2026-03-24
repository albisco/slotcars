import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { lapNumber, timeMs } = await request.json();

  if (typeof lapNumber !== "number" || lapNumber < 1) {
    return NextResponse.json({ error: "Valid lapNumber is required" }, { status: 400 });
  }
  if (typeof timeMs !== "number" || timeMs <= 0) {
    return NextResponse.json({ error: "Valid timeMs is required" }, { status: 400 });
  }

  // Check session exists and lap count
  const session = await prisma.raceSession.findUnique({
    where: { id: params.id },
    include: { laps: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.completed) {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }
  if (lapNumber > session.lapsAllowed) {
    return NextResponse.json({ error: "Exceeds allowed laps" }, { status: 400 });
  }

  const lap = await prisma.lap.create({
    data: {
      sessionId: params.id,
      lapNumber,
      timeMs,
    },
  });

  return NextResponse.json(lap, { status: 201 });
}
