import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { completed } = await request.json();

  const session = await prisma.raceSession.update({
    where: { id: params.id },
    data: { completed },
    include: { player: true, laps: { orderBy: { lapNumber: "asc" } } },
  });
  return NextResponse.json(session);
}
