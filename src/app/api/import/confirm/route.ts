import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseInvitationBuffer } from "@/lib/excel-parser";

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === "number") {
    // excel serial
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || s.user.role !== "ADMIN") return NextResponse.json({ error: "Only admin can confirm import" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const mode = String(form.get("mode") || "add"); // add | replace
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = parseInvitationBuffer(buf);

  // Sequential writes (no interactive transaction: MongoDB txns require a replica set)
  if (mode === "replace") {
    await prisma.person.deleteMany({});
    await prisma.subSection.deleteMany({});
    await prisma.section.deleteMany({});
  }
  {
    const maxS = await prisma.section.aggregate({ _max: { order: true } });
    let order = (maxS._max.order ?? -1) + 1;
    for (const sec of parsed.sections) {
      const created = await prisma.section.create({ data: { name: sec.name, order: order++ } });
      let subOrder = 0;
      const subMap = new Map<string, string>();
      for (const sub of sec.subs) {
        const c = await prisma.subSection.create({ data: { name: sub.name, sectionId: created.id, order: subOrder++ } });
        subMap.set(sub.name, c.id);
      }
      const mkRows = (list: any[], subId: string | null) =>
        list.map((n) => ({
          sectionId: created.id, subSectionId: subId,
          serialNo: n.serialNo || null, name: n.name, remarks: n.remarks || "",
          invited: !!n.invited, invitedOn: n.invited ? (toDate(n.invitedOn) || new Date()) : null,
          invitedBy: n.invitedBy || "", phone: n.phone || "", guestsCount: n.guestsCount || 1,
          mode: n.mode || "", notes: n.notes || "", createdById: s.user.id
        }));
      const looseRows = mkRows(sec.loose, null);
      if (looseRows.length) await prisma.person.createMany({ data: looseRows });
      for (const sub of sec.subs) {
        const rows = mkRows(sub.names, subMap.get(sub.name)!);
        if (rows.length) await prisma.person.createMany({ data: rows });
      }
    }
    await prisma.importHistory.create({
      data: { userId: s.user.id, fileName: file.name, mode, sections: parsed.counts.sections, subSections: parsed.counts.subSections, names: parsed.counts.names, skipped: parsed.unparsed.length }
    });
    await prisma.activityLog.create({ data: { userId: s.user.id, userEmail: s.user.email, action: "IMPORT", entity: "import", detail: `${file.name} (${mode}) ${parsed.counts.names} names` } });
  }

  return NextResponse.json({ ok: true, ...parsed.counts });
}

export async function GET() {
  const s: any = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const history = await prisma.importHistory.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json({ history });
}
