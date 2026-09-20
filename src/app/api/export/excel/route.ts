import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildExportWorkbook } from "@/lib/excel-export";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const people = await prisma.person.findMany({ where: { isDeleted: false }, include: { section: true, subSection: true }, take: 10000 });
  // MongoDB can't order by relation — sort in JS (section order, then created)
  const orderOf = new Map<string, number>();
  const secs = await prisma.section.findMany({ select: { id: true, order: true } });
  secs.forEach((x) => orderOf.set(x.id, x.order));
  people.sort((a, b) => (orderOf.get(a.sectionId) ?? 0) - (orderOf.get(b.sectionId) ?? 0) || +new Date(a.createdAt) - +new Date(b.createdAt));
  const setting = await prisma.setting.findUnique({ where: { key: "eventName" } });
  const rows = people.map((p) => ({
    section: p.section?.name || "", subSection: (p as any).subSection?.name || "",
    serialNo: p.serialNo || "", name: p.name, remarks: p.remarks || "",
    invited: p.invited, invitedOn: p.invitedOn ? p.invitedOn.toISOString().slice(0, 16).replace("T", " ") : "",
    invitedBy: p.invitedBy || "", phone: p.phone || "", guestsCount: p.guestsCount, mode: p.mode || "", notes: p.notes || ""
  }));
  const wb = buildExportWorkbook(rows, setting?.value || "Invitation List");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="invitation-list.xlsx"` } });
}
