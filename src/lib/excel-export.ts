import * as XLSX from "xlsx";

export function buildExportWorkbook(rows: any[], title: string) {
  // rows: { section, subSection, serialNo, name, remarks, invited, invitedOn, invitedBy, phone, guestsCount, mode, notes }
  const aoa: any[][] = [];
  aoa.push([title || "Invitation List"]);
  aoa.push([]);
  aoa.push(["Sr. No.", "Name", "Remarks", "Invited (Yes/No)", "Invited on", "Invited by", "Phone", "Guests", "Mode", "Notes"]);
  let lastSection = "";
  let lastSub = "";
  for (const r of rows) {
    if (r.section !== lastSection) { aoa.push([r.section]); lastSection = r.section; lastSub = ""; }
    if (r.subSection && r.subSection !== lastSub) { aoa.push([r.subSection]); lastSub = r.subSection; }
    aoa.push([r.serialNo ?? "", r.name ?? "", r.remarks ?? "", r.invited ? "Yes" : "No", r.invitedOn ?? "", r.invitedBy ?? "", r.phone ?? "", r.guestsCount ?? 1, r.mode ?? "", r.notes ?? ""]);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 10 }, { wch: 34 }, { wch: 30 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 24 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Invitation List");
  return wb;
}
