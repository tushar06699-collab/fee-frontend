import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s: any = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [total, invited, sections] = await Promise.all([
    prisma.person.count({ where: { isDeleted: false } }),
    prisma.person.count({ where: { isDeleted: false, invited: true } }),
    prisma.section.findMany({ orderBy: { order: "asc" } })
  ]);
  const perSection: any[] = [];
  for (const sec of sections) {
    const [tot, inv] = await Promise.all([
      prisma.person.count({ where: { sectionId: sec.id, isDeleted: false } }),
      prisma.person.count({ where: { sectionId: sec.id, isDeleted: false, invited: true } })
    ]);
    perSection.push({ id: sec.id, name: sec.name, total: tot, invited: inv, pending: tot - inv });
  }
  // MongoDB has no $queryRaw GROUP BY — aggregate in JS
  const invitedPeople = await prisma.person.findMany({ where: { isDeleted: false, invited: true, invitedOn: { not: null } }, select: { invitedOn: true } });
  const dayMap = new Map<string, number>();
  for (const p of invitedPeople) {
    const d = new Date(p.invitedOn!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayMap.set(key, (dayMap.get(key) || 0) + 1);
  }
  const perDay = Array.from(dayMap.entries()).sort().map(([day, count]) => ({ day, count }));
  const recent = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 });
  return NextResponse.json({ total, invited, pending: total - invited, pct: total ? Math.round((invited / total) * 100) : 0, perSection, perDay, recent });
}
