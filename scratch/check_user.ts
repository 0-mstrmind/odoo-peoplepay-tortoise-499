import dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, passwordHash: true },
  });
  for (const u of users) {
    console.log(u.email, u.role, u.passwordHash ? "HAS_HASH" : "NO_HASH");
  }
  await prisma.$disconnect();
}
main();
