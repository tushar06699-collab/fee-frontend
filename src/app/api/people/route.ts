import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "all"; // all|pending|invited|verify|trash
  const sectionId = url.searchParams.get("sectionId") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const invitedBy = url.searchParams.get("invitedBy") || "";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "100", 10), 500);
  // MongoDB has no case-insensitive filters — native filters in DB, text matching in JS
  const where: any = {};
  if (status === "trash") where.isDeleted = true; else where.isDeleted = false;
  if (status === "invited") where.invited = true;
  if (status === "pending") where.invited = false;
  if (sectionId) where.sectionId = sectionId;
  if (from || to) {
    where.invitedOn = {};
    if (from) where.invitedOn.gte = new Date(from);
    if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); where.invitedOn.lte = t; }
  }
  const all = await prisma.person.findMany({ where, include: { section: true, subSection: true }, orderBy: { updatedAt: "desc" }, take: 20000 });
  const ql = q.trim().toLowerCase();
  const bl = invitedBy.trim().toLowerCase();
  const filtered = all.filter((p) => {
    if (ql && !((p.name || "").toLowerCase().includes(ql) || (p.remarks || "").toLowerCase().includes(ql) || (p.phone || "").includes(q.trim()))) return false;
    if (status === "verify" && !(p.remarks || "").toLowerCase().includes("verify spelling")) return false;
    if (bl && !(p.invitedBy || "").toLowerCase().includes(bl)) return false;
    return true;
  });
  const total = filtered.length;
  const people = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
  return NextResponse.json({ total, page, pageSize, people });
}

export async function POST(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || !["ADMIN", "EDITOR"].includes(s.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.name || !b.sectionId) return NextResponse.json({ error: "name and sectionId required" }, { status: 400 });
  const p = await prisma.person.create({
    data: {
      name: String(b.name).trim(), sectionId: b.sectionId, subSectionId: b.subSectionId || null,
      serialNo: b.serialNo ? String(b.serialNo) : null, remarks: b.remarks || "", phone: b.phone || "",
      guestsCount: parseInt(b.guestsCount || "1", 10) || 1, invitedBy: b.invitedBy || "", mode: b.mode || "", notes: b.notes || "",
      invited: !!b.invited, invitedOn: b.invited ? (b.invitedOn ? new Date(b.invitedOn) : new Date()) : null,
      createdById: s.user.id
    }
  });
  await prisma.activityLog.create({ data: { userId: s.user.id, userEmail: s.user.email, action: "ADD", entity: "person", entityId: p.id, detail: p.name } });
  return NextResponse.json(p);
}
