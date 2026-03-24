import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });
  return NextResponse.json(settings || { id: "default", defaultLaps: 3 });
}

export async function PATCH(request: Request) {
  const { defaultLaps } = await request.json();

  if (typeof defaultLaps !== "number" || ![3, 5].includes(defaultLaps)) {
    return NextResponse.json({ error: "defaultLaps must be 3 or 5" }, { status: 400 });
  }

  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    update: { defaultLaps },
    create: { id: "default", defaultLaps },
  });
  return NextResponse.json(settings);
}
