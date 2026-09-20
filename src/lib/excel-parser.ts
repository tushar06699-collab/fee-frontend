// Excel parser for "Invitation List" format.
// Row 1 = title, Row 3 = header (Sr. No. | Name | Remarks), data from row 4.
// MAIN HEADING: col A text, A:C merged, dark blue fill. SUB-HEADING: light blue fill.
// Fallback: text only in col A => heading (if next rows are names, treat as sub-heading when a main exists, else main).
// NAME rows: Sr in A (nullable/dup), Name in B, Remarks in C. Extended export columns also supported:
//   Invited (Yes/No), Invited on, Invited by, Phone, Guests, Mode, Notes.

import * as XLSX from "xlsx";

export type ParsedName = {
  serialNo: string;
  name: string;
  remarks: string;
  invited: boolean;
  invitedOn: string | null;
  invitedBy: string;
  phone: string;
  guestsCount: number;
  mode: string;
  notes: string;
};
export type ParsedSub = { name: string; names: ParsedName[] };
export type ParsedSection = { name: string; subs: ParsedSub[]; loose: ParsedName[] };
export type ParseResult = {
  title: string;
  sections: ParsedSection[];
  unparsed: { row: number; reason: string; values: string[] }[];
  counts: { sections: number; subSections: number; names: number };
};

function rgbOf(cell: any): string {
  try {
    const fg = cell?.s?.patternType ? cell?.s?.fgColor : (cell?.s?.fgColor ?? cell?.s?.bgColor);
    const rgb = fg?.rgb ? String(fg.rgb).toUpperCase() : "";
    return rgb; // ARGB e.g. FF1F4E79
  } catch { return ""; }
}
function isDarkBlue(rgb: string) {
  if (!rgb) return false;
  const hex = rgb.length === 8 ? rgb.slice(2) : rgb;
  // dark blue family: navy / 1F4E79 / 002060 / 0D2A54 etc — blue dominant, dark
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  return b > 60 && b > r + 10 && (r + g + b) < 380;
}
function isLightBlue(rgb: string) {
  if (!rgb) return false;
  const hex = rgb.length === 8 ? rgb.slice(2) : rgb;
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  return b > 150 && (r + g) > 280 && (r + g + b) > 480;
}
function inMerge(merges: any[], r: number, c: number) {
  // r,c are 0-based
  return (merges || []).some((m: any) => r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c && (m.e.c - m.s.c >= 1));
}
function isMergedAC(merges: any[], rowIdx0: number) {
  return (merges || []).some((m: any) => m.s.r === rowIdx0 && m.e.r === rowIdx0 && m.s.c === 0 && m.e.c >= 2);
}

function parseBool(v: any): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return ["yes", "y", "1", "true", "tick", "invited", "done", "✓"].includes(s);
}

export function parseInvitationWorkbook(wb: XLSX.WorkBook): ParseResult {
  const sheetName = wb.SheetNames.includes("Invitation List") ? "Invitation List" : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const merges = (ws["!merges"] as any[]) || [];
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:C1");
  const getCell = (r0: number, c0: number) => ws[XLSX.utils.encode_cell({ r: r0, c: c0 })];
  const val = (r0: number, c0: number) => {
    const c = getCell(r0, c0);
    return c?.v === undefined || c?.v === null ? "" : String(c.v).trim();
  };

  const title = val(0, 0);
  // header row: find row containing "name" within first 6 rows
  let headerRow = 2;
  for (let r = 0; r < 6; r++) {
    const rowText = [val(r, 0), val(r, 1), val(r, 2)].join(" ").toLowerCase();
    if (rowText.includes("name")) { headerRow = r; break; }
  }
  // map extended header columns
  const headers: string[] = [];
  for (let c = 0; c <= Math.max(10, range.e.c); c++) headers.push(val(headerRow, c).toLowerCase());
  const colIdx = (names: string[]) => headers.findIndex((h) => names.some((n) => h.includes(n)));
  let cInvited = colIdx(["invited (", "invited yes", "invited?"]);
  if (cInvited < 0) { const i = headers.findIndex((h) => h === "invited"); cInvited = i; }
  const cInvitedOn = colIdx(["invited on"]);
  const cInvitedBy = colIdx(["invited by"]);
  const cPhone = colIdx(["phone", "mobile"]);
  const cGuests = colIdx(["guest"]);
  const cMode = colIdx(["mode"]);
  const cNotes = colIdx(["note"]);

  const sections: ParsedSection[] = [];
  const unparsed: ParseResult["unparsed"] = [];
  let cur: ParsedSection | null = null;
  let curSub: ParsedSub | null = null;

  const ensureSection = (name: string): ParsedSection => {
    const s: ParsedSection = { name, subs: [], loose: [] };
    sections.push(s);
    cur = s;
    curSub = null;
    return s;
  };

  for (let r0 = headerRow + 1; r0 <= range.e.r; r0++) {
    const a = val(r0, 0), b = val(r0, 1), c = val(r0, 2);
    const rowNo = r0 + 1;
    if (!a && !b && !c) continue; // blank row
    const mergedAC = isMergedAC(merges, r0) || inMerge(merges, r0, 0);
    const cellA = getCell(r0, 0);
    const rgb = rgbOf(cellA);

    const textOnlyInA = !!a && !b && !c;

    if (mergedAC || textOnlyInA) {
      // heading candidate — but a name row could theoretically have remarks blank and sr blank with only name in B; that is NOT textOnlyInA (b set). Safe.
      const headingText = a || b || c;
      if (!headingText) { unparsed.push({ row: rowNo, reason: "Empty heading", values: [a, b, c] }); continue; }
      const dark = isDarkBlue(rgb);
      const light = isLightBlue(rgb);
      if (dark) { cur = ensureSection(headingText); continue; }
      if (light) {
        const s = cur ?? ensureSection("GENERAL");
        curSub = { name: headingText, names: [] };
        s.subs.push(curSub);
        continue;
      }
      // No colour info → fallback: if no section yet → main; else treat as sub-heading of current section
      if (!cur) { cur = ensureSection(headingText); continue; }
      // Heuristic: ALL-CAPS short text or text without digits tends to be heading
      curSub = { name: headingText, names: [] };
      (cur as ParsedSection).subs.push(curSub);
      continue;
    }

    // NAME row: needs name in B (or in A when not merged? be lenient)
    let name = b || (mergedAC ? "" : "");
    let serial = a, remarks = c;
    if (!name && !mergedAC && a && (b === "" )) {
      // Ambiguous: A has text and B empty but not merged — could be unmerged heading missed above; we treated textOnlyInA as heading already, so reaching here means B or C had something... Actually this branch unreachable; keep for safety.
    }
    if (!name) {
      // Try: if B empty but C has remarks and A looks like a name with sr? No — treat as unparsed unless A contains name-like text with B empty and not merged... but that was heading. Mark unparsed.
      unparsed.push({ row: rowNo, reason: "Missing name in column B", values: [a, b, c] });
      continue;
    }
    const rec: ParsedName = {
      serialNo: serial,
      name,
      remarks,
      invited: cInvited >= 0 ? parseBool(val(r0, cInvited)) : false,
      invitedOn: cInvitedOn >= 0 && val(r0, cInvitedOn) ? String(getCell(r0, cInvitedOn)?.v ?? val(r0, cInvitedOn)) : null,
      invitedBy: cInvitedBy >= 0 ? val(r0, cInvitedBy) : "",
      phone: cPhone >= 0 ? val(r0, cPhone) : "",
      guestsCount: cGuests >= 0 && val(r0, cGuests) ? (parseInt(val(r0, cGuests), 10) || 1) : 1,
      mode: cMode >= 0 ? val(r0, cMode) : "",
      notes: cNotes >= 0 ? val(r0, cNotes) : ""
    };
    const s = cur ?? ensureSection("GENERAL");
    if (curSub) curSub.names.push(rec);
    else s.loose.push(rec);
  }

  const names = sections.reduce((n, s) => n + s.loose.length + s.subs.reduce((m, x) => m + x.names.length, 0), 0);
  const subSections = sections.reduce((n, s) => n + s.subs.length, 0);
  return { title, sections, unparsed, counts: { sections: sections.length, subSections, names } };
}

export function parseInvitationBuffer(buf: Buffer): ParseResult {
  const wb = XLSX.read(buf, { type: "buffer", cellStyles: true });
  return parseInvitationWorkbook(wb);
}
