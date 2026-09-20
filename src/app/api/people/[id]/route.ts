import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s: any = await getServerSession(authOptions);
  if (!s || !["ADMIN", "EDITOR"].includes(s.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const prev = await prisma.person.findUnique({ where: { id: params.id } });
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Tick semantics: invited true => set invitedOn now if not provided; false => clear
  let invitedOn = prev.invitedOn;
  if (b.invited === true && !prev.invited) invitedOn = b.invitedOn ? new Date(b.invitedOn) : new Date();
  if (b.invited === true && b.invitedOn) invitedOn = new Date(b.invitedOn);
  if (b.invited === false) invitedOn = null;
  if (b.invitedOn !== undefined && b.invitedOn !== null && b.invitedOn !== "") invitedOn = new Date(b.invitedOn);
  const data: any = {};
  for (const k of ["name", "remarks", "phone", "invitedBy", "mode", "notes", "sectionId", "subSectionId", "serialNo"]) {
    if (b[k] !== undefined) data[k] = b[k];
  }
  if (b.guestsCount !== undefined) data.guestsCount = parseInt(b.guestsCount, 10) || 1;
  if (b.invited !== undefined) { data.invited = !!b.invited; data.invitedOn = invitedOn; }
  else if (b.invitedOn !== undefined) data.invitedOn = invitedOn;
  if (b.restore) { data.isDeleted = false; }
  const p = await prisma.person.update({ where: { id: params.id }, data });
  const action = prev.invited !== p.invited ? (p.invited ? "TICK" : "UNTICK") : "EDIT";
  await prisma.activityLog.create({ data: { userId: s.user.id, userEmail: s.user.email, action, entity: "person", entityId: p.id, detail: `${prev.name} -> ${p.name}${p.invited && p.invitedOn ? " @ " + p.invitedOn.toISOString() : ""}` } });
  return NextResponse.json(p);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const s: any = await getServerSession(authOptions);
  if (!s || !["ADMIN", "EDITOR"].includes(s.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const hard = url.searchParams.get("hard") === "1";
  if (hard && s.user.role !== "ADMIN") return NextResponse.json({ error: "Only admin can permanently delete" }, { status: 403 });
  if (hard) await prisma.person.delete({ where: { id: params.id } });
  else await prisma.person.update({ where: { id: params.id }, data: { isDeleted: true } });
  await prisma.activityLog.create({ data: { userId: s.user.id, userEmail: s.user.email, action: "DELETE", entity: "person", entityId: params.id, detail: hard ? "hard" : "soft" } });
  return NextResponse.json({ ok: true });
}
