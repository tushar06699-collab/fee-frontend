// Client-side PDF generator: all INVITED (done/green) names, one section per page.
// Embeds Noto Sans Devanagari (Regular + Bold) so Hindi names render correctly.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

async function fontB64(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error("font fetch failed");
  const bytes = new Uint8Array(await r.arrayBuffer());
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)) as any);
  }
  return btoa(s);
}

type Person = {
  id: string; serialNo?: string | null; name: string; remarks?: string | null;
  invitedOn?: string | null; invitedBy?: string | null;
  sectionId: string; section?: { id: string; name: string } | null;
  subSection?: { id: string; name: string } | null;
};

export async function downloadInvitedPdf(onStep?: (msg: string) => void) {
  const step = (m: string) => onStep && onStep(m);
  step("Loading data…");
  const [secRes, setRes] = await Promise.all([
    fetch("/api/sections", { cache: "no-store" }),
    fetch("/api/settings", { cache: "no-store" })
  ]);
  if (!secRes.ok) throw new Error("Could not load sections");
  const { sections } = await secRes.json();
  const settings = setRes.ok ? await setRes.json() : {};
  const eventName = settings.eventName || "Invitation List";
  const orderOf = new Map<string, number>();
  (sections || []).forEach((s: any, i: number) => orderOf.set(s.id, s.order ?? i));

  const all: Person[] = [];
  let page = 1, total = Infinity;
  while (all.length < total) {
    const r = await fetch(`/api/people?status=invited&page=${page}&pageSize=500`, { cache: "no-store" });
    if (!r.ok) throw new Error("Could not load invited list");
    const j = await r.json();
    total = j.total;
    all.push(...(j.people || []));
    if (!(j.people || []).length) break;
    page++;
    if (page > 100) break; // safety
  }
  if (!all.length) throw new Error("EMPTY");

  step("Loading fonts…");
  const [reg, bold] = await Promise.all([
    fontB64("/fonts/NotoSansDevanagari-Regular.ttf"),
    fontB64("/fonts/NotoSansDevanagari-Bold.ttf")
  ]);

  step("Building PDF…");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.addFileToVFS("NotoDev.ttf", reg);
  doc.addFileToVFS("NotoDev-Bold.ttf", bold);
  doc.addFont("NotoDev.ttf", "notodev", "normal");
  doc.addFont("NotoDev-Bold.ttf", "notodev", "bold");
  doc.setFont("notodev");

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const pageW = doc.internal.pageSize.getWidth();

  const footer = () => {
    const n = (doc as any).internal.getNumberOfPages();
    doc.setFont("notodev", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${eventName} — Invited List`, 14, 292);
    doc.text(`Page ${n}`, pageW - 14, 292, { align: "right" });
  };

  // Page 1: title + summary
  doc.setFont("notodev", "bold");
  doc.setFontSize(20);
  doc.setTextColor(22, 101, 52);
  doc.text("Invited List  (Done)", 14, 22);
  doc.setFont("notodev", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text(`${eventName}  •  Generated ${today}  •  Total invited: ${all.length}`, 14, 30);

  const bySection = new Map<string, { name: string; people: Person[] }>();
  for (const p of all) {
    const sid = p.sectionId || "__none";
    const nm = p.section?.name || "GENERAL";
    if (!bySection.has(sid)) bySection.set(sid, { name: nm, people: [] });
    bySection.get(sid)!.people.push(p);
  }
  const ordered = Array.from(bySection.entries()).sort(
    (a, b) => (orderOf.get(a[0]) ?? 9999) - (orderOf.get(b[0]) ?? 9999)
  );

  autoTable(doc, {
    startY: 36,
    head: [["Section", "Invited"]],
    body: ordered.map(([_, g]) => [g.name, String(g.people.length)]),
    styles: { font: "notodev", fontSize: 10 },
    headStyles: { fillColor: [22, 101, 52] },
    didDrawPage: footer
  });

  // One page per section
  for (const [_, g] of ordered) {
    doc.addPage();
    doc.setFont("notodev", "bold");
    doc.setFontSize(16);
    doc.setTextColor(22, 101, 52);
    doc.text(g.name, 14, 20);
    doc.setFont("notodev", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`${g.people.length} invited`, 14, 26);

    const rows = [...g.people]
      .sort((a, b) => (a.subSection?.name || "").localeCompare(b.subSection?.name || "") || a.name.localeCompare(b.name, "hi"))
      .map((p) => [
        p.serialNo || "",
        p.name,
        p.subSection?.name || "",
        p.remarks || "",
        p.invitedOn ? new Date(p.invitedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "",
        p.invitedBy || ""
      ]);

    let firstPage = true;
    autoTable(doc, {
      startY: 30,
      margin: { top: 16 },
      head: [["Sr", "Name", "Group", "Remarks", "Invited On", "Invited By"]],
      body: rows,
      styles: { font: "notodev", fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 52 }, 2: { cellWidth: 28 } },
      didDrawPage: () => {
        footer();
        if (!firstPage) {
          // Continued table on a new page — small section label in the top margin
          doc.setFont("notodev", "bold");
          doc.setFontSize(9);
          doc.setTextColor(22, 101, 52);
          doc.text(`${g.name} (contd.)`, 14, 11);
        }
        firstPage = false;
      }
    });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`invited-list-${stamp}.pdf`);
  step("Done");
}
