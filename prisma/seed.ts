import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

function isNeonUrl(url: string) {
  return url.includes("neon.tech");
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL!;
  if (isNeonUrl(url)) {
    // Neon requires WebSocket for Node.js runtime
    const { WebSocket } = require("ws");
    const { neonConfig } = require("@neondatabase/serverless");
    const { PrismaNeon } = require("@prisma/adapter-neon");
    neonConfig.webSocketConstructor = WebSocket;
    const adapter = new PrismaNeon({ connectionString: url });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const prisma = createPrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", defaultLaps: 3 },
  });
  console.log("Seeded default settings (3 laps)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
