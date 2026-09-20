// Seed: creates first admin from env. Run: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123";
  const name = process.env.ADMIN_NAME || "Admin";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name, passwordHash, role: "ADMIN" } });
  await prisma.setting.upsert({ where: { key: "eventName" }, update: {}, create: { key: "eventName", value: "Wedding Function" } });
  await prisma.setting.upsert({ where: { key: "eventDate" }, update: {}, create: { key: "eventDate", value: "" } });
  await prisma.setting.upsert({ where: { key: "language" }, update: {}, create: { key: "language", value: "en" } });
  console.log(`Seeded admin: ${email}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
