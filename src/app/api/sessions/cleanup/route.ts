import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({ deleted: result.count });
}
