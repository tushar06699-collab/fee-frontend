import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function log(userId: string | undefined, email: string, action: string, entity: string, entityId = "", detail = "") {
  try { await prisma.activityLog.create({ data: { userId, userEmail: email, action, entity, entityId, detail } }); } catch {}
}

export async function GET() {
  const s: any = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sections = await prisma.section.findMany({ orderBy: { order: "asc" }, include: { subSections: { orderBy: { order: "asc" } } } });
  // MongoDB has no groupBy — aggregate in JS (same { sectionId, invited, _count } shape)
  const all = await prisma.person.findMany({ where: { isDeleted: false }, select: { sectionId: true, invited: true } });
  const agg = new Map<string, { t: number; i: number }>();
  for (const p of all) {
    const e = agg.get(p.sectionId) || { t: 0, i: 0 };
    e.t++; if (p.invited) e.i++;
    agg.set(p.sectionId, e);
  }
  const counts = Array.from(agg.entries()).flatMap(([sectionId, v]) => [
    { sectionId, invited: true, _count: v.i },
    { sectionId, invited: false, _count: v.t - v.i }
  ]);
  return NextResponse.json({ sections, counts });
}

export async function POST(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || !["ADMIN", "EDITOR"].includes(s.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name } = await req.json();
  if (!name || String(name).trim().length < 1) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const max = await prisma.section.aggregate({ _max: { order: true } });
  const sec = await prisma.section.create({ data: { name: String(name).trim(), order: (max._max.order ?? 0) + 1 } });
  await log(s.user.id, s.user.email, "ADD", "section", sec.id, sec.name);
  return NextResponse.json(sec);
}
