import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/sse";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { timeMs, timeSecs } = await request.json();

  let newTimeMs: number;
  if (typeof timeSecs === "number" && timeSecs > 0) {
    newTimeMs = Math.round(timeSecs * 1000);
  } else if (typeof timeMs === "number" && timeMs > 0) {
    newTimeMs = timeMs;
  } else {
    return NextResponse.json({ error: "Valid timeMs or timeSecs is required" }, { status: 400 });
  }

  const lap = await prisma.lap.update({
    where: { id: params.id },
    data: { timeMs: newTimeMs },
  });

  notify();
  return NextResponse.json(lap);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.lap.delete({
    where: { id: params.id },
  });
  notify();
  return NextResponse.json({ ok: true });
}
