import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const sectionId = url.searchParams.get("sectionId");
  const where: any = { isDeleted: false };
  if (sectionId) where.sectionId = sectionId;
  const subs = await prisma.subSection.findMany({ where: sectionId ? { sectionId } : {}, orderBy: { order: "asc" } });
  return NextResponse.json({ subs });
}

export async function POST(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || !["ADMIN", "EDITOR"].includes(s.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, sectionId } = await req.json();
  if (!name || !sectionId) return NextResponse.json({ error: "name and sectionId required" }, { status: 400 });
  const max = await prisma.subSection.aggregate({ where: { sectionId }, _max: { order: true } });
  const sub = await prisma.subSection.create({ data: { name: String(name).trim(), sectionId, order: (max._max.order ?? 0) + 1 } });
  return NextResponse.json(sub);
}

export async function PATCH(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || !["ADMIN", "EDITOR"].includes(s.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, name } = await req.json();
  const sub = await prisma.subSection.update({ where: { id }, data: { name } });
  return NextResponse.json(sub);
}

export async function DELETE(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || !["ADMIN", "EDITOR"].includes(s.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.person.updateMany({ where: { subSectionId: id }, data: { subSectionId: null } });
  await prisma.subSection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
