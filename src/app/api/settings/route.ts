import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s: any = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.setting.findMany();
  const obj: any = {};
  rows.forEach((r) => (obj[r.key] = r.value));
  return NextResponse.json(obj);
}

export async function POST(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || s.user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });
  }
  return NextResponse.json({ ok: true });
}
