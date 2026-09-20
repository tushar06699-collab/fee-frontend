import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s: any = await getServerSession(authOptions);
  if (!s || s.user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const [users, sections, subSections, people, settings] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } }),
    prisma.section.findMany(), prisma.subSection.findMany(),
    prisma.person.findMany({ take: 20000 }), prisma.setting.findMany()
  ]);
  return NextResponse.json({ users, sections, subSections, people, settings, exportedAt: new Date().toISOString() });
}

export async function POST(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || s.user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const j = await req.json();
  if (j.mode === "replace") {
    await prisma.person.deleteMany({}); await prisma.subSection.deleteMany({}); await prisma.section.deleteMany({});
  }
  if (j.sections?.length) {
    for (const sec of j.sections) {
      await prisma.section.upsert({ where: { id: sec.id }, update: { name: sec.name, order: sec.order }, create: { id: sec.id, name: sec.name, order: sec.order ?? 0 } });
    }
  }
  if (j.subSections?.length) {
    for (const sub of j.subSections) {
      await prisma.subSection.upsert({ where: { id: sub.id }, update: { name: sub.name, sectionId: sub.sectionId, order: sub.order }, create: { id: sub.id, name: sub.name, sectionId: sub.sectionId, order: sub.order ?? 0 } });
    }
  }
  if (j.people?.length) {
    for (const p of j.people) {
      const { section, subSection, createdBy, ...rest } = p;
      const data = { ...rest, invitedOn: rest.invitedOn ? new Date(rest.invitedOn) : null, createdAt: rest.createdAt ? new Date(rest.createdAt) : undefined, updatedAt: rest.updatedAt ? new Date(rest.updatedAt) : undefined };
      await prisma.person.upsert({ where: { id: p.id }, update: { ...data, id: undefined } as any, create: { ...data } as any });
    }
  }
  return NextResponse.json({ ok: true });
}
