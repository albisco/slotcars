import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/sse";

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
  notify();
  return NextResponse.json(session);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.raceSession.delete({
    where: { id: params.id },
  });
  notify();
  return NextResponse.json({ ok: true });
}
