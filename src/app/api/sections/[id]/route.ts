import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const s: any = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = params.id;
  const section = await prisma.section.findUnique({ where: { id }, include: { subSections: { orderBy: { order: "asc" } } } });
  if (!section) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "all";
  const where: any = { sectionId: id, isDeleted: false };
  if (status === "invited") where.invited = true;
  if (status === "pending") where.invited = false;
  const all = await prisma.person.findMany({ where, orderBy: [{ subSectionId: "asc" }, { createdAt: "asc" }], take: 2000 });
  const ql = q.trim().toLowerCase();
  const people = ql ? all.filter((p) => (p.name || "").toLowerCase().includes(ql) || (p.remarks || "").toLowerCase().includes(ql)) : all;
  return NextResponse.json({ section, people });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s: any = await getServerSession(authOptions);
  if (!s || !["ADMIN", "EDITOR"].includes(s.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const sec = await prisma.section.update({ where: { id: params.id }, data: { name: body.name, order: body.order } });
  return NextResponse.json(sec);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const s: any = await getServerSession(authOptions);
  if (!s || s.user.role !== "ADMIN") return NextResponse.json({ error: "Only admin can delete sections" }, { status: 403 });
  const url = new URL(req.url);
  const moveTo = url.searchParams.get("moveTo");
  // Sequential writes (MongoDB transactions need a replica set; cascades handled in app code)
  if (moveTo) {
    await prisma.person.updateMany({ where: { sectionId: params.id }, data: { sectionId: moveTo, subSectionId: null } });
  } else {
    await prisma.person.updateMany({ where: { sectionId: params.id }, data: { isDeleted: true } });
  }
  await prisma.subSection.deleteMany({ where: { sectionId: params.id } });
  await prisma.section.delete({ where: { id: params.id } });
  await prisma.activityLog.create({ data: { userId: s.user.id, userEmail: s.user.email, action: "DELETE", entity: "section", entityId: params.id, detail: moveTo ? `moved to ${moveTo}` : "deleted" } });
  return NextResponse.json({ ok: true });
}
