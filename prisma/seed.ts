import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { WebSocket } from "ws";
import { neonConfig } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

neonConfig.webSocketConstructor = WebSocket;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

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
