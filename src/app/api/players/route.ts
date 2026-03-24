import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { createdAt: "desc" },
    include: { sessions: { include: { laps: true } } },
  });
  return NextResponse.json(players);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Find existing player by name (case-insensitive) or create new
  const existing = await prisma.player.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" } },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const player = await prisma.player.create({
    data: { name: name.trim() },
  });
  return NextResponse.json(player, { status: 201 });
}
