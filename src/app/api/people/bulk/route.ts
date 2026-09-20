import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || !["ADMIN", "EDITOR"].includes(s.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { ids, action, targetSectionId, targetSubSectionId } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "ids required" }, { status: 400 });
  const now = new Date();
  if (action === "tick") await prisma.person.updateMany({ where: { id: { in: ids } }, data: { invited: true, invitedOn: now } });
  else if (action === "untick") await prisma.person.updateMany({ where: { id: { in: ids } }, data: { invited: false, invitedOn: null } });
  else if (action === "delete") await prisma.person.updateMany({ where: { id: { in: ids } }, data: { isDeleted: true } });
  else if (action === "restore") await prisma.person.updateMany({ where: { id: { in: ids } }, data: { isDeleted: false } });
  else if (action === "move" && targetSectionId) await prisma.person.updateMany({ where: { id: { in: ids } }, data: { sectionId: targetSectionId, subSectionId: targetSubSectionId || null } });
  else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  await prisma.activityLog.create({ data: { userId: s.user.id, userEmail: s.user.email, action: "BULK_" + String(action).toUpperCase(), entity: "person", entityId: ids.length + " ids", detail: targetSectionId || "" } });
  return NextResponse.json({ ok: true, count: ids.length });
}
