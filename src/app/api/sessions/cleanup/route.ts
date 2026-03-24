import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/sse";

/**
 * DELETE /api/sessions/cleanup
 * Removes all sessions that have zero laps (orphaned from cancelled races).
 */
export async function DELETE() {
  const result = await prisma.raceSession.deleteMany({
    where: {
      laps: { none: {} },
    },
  });

  notify();
  return NextResponse.json({ deleted: result.count });
}
