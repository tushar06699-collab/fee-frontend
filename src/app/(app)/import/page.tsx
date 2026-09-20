"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/hooks";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [mode, setMode] = useState("add");
  const [history, setHistory] = useState<any[]>([]);
  const loadH = () => fetch("/api/import/confirm").then((r) => r.json()).then((j) => setHistory(j.history || []));
  useEffect(() => { loadH(); }, []);
  const doPreview = async () => {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/import/preview", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) toast(j.error || "Parse failed");
    else setPreview(j);
  };
  const confirm = async () => {
    if (!file) return;
    if (!confirmAction()) return;
    const fd = new FormData(); fd.append("file", file); fd.append("mode", mode);
    const r = await fetch("/api/import/confirm", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) toast(j.error || "Import failed (admin only for confirm)");
    else { toast(`Imported ${j.names} names`); setPreview(null); loadH(); }
  };
  const confirmAction = () => window.confirm(mode === "replace" ? "REPLACE ALL DATA? This deletes existing data." : "Add to existing data?");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Import Excel</h1>
      <div className="card p-4 space-y-3">
        <p className="text-sm text-slate-500">Sheet “Invitation List”. Row 1 title, row 3 header Sr. No. | Name | Remarks, data from row 4. Headings detected by merged cells + blue fill, fallback text-only in column A.</p>
        <input type="file" accept=".xlsx" className="input" onChange={(e) => setFile(e.target.files?.[0] || null)} aria-label="Excel file" />
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={doPreview}>Preview</button>
          <select className="input max-w-[220px]" value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Mode">
            <option value="add">Add to existing data</option><option value="replace">Replace all data</option>
          </select>
          <button className="btn-primary" disabled={!preview} onClick={confirm}>Confirm import</button>
        </div>
      </div>
      {preview && (
        <div className="card p-4">
          <h2 className="font-semibold">Preview: {preview.counts.sections} sections, {preview.counts.subSections} sub-sections, {preview.counts.names} names</h2>
          <ul className="text-sm mt-2 max-h-64 overflow-auto">
            {preview.sections.map((s: any, i: number) => (
              <li key={i} className="py-1 border-b"><b>{s.name}</b> — {s.subs.length} subs, {s.loose.length} loose
                <ul className="ml-4 text-slate-500">{s.subs.map((x: any, j: number) => <li key={j}>{x.name} ({x.names.length})</li>)}</ul>
              </li>
            ))}
          </ul>
          {preview.unparsed.length > 0 && (
            <div className="mt-2 text-sm text-amber-700">Could not understand {preview.unparsed.length} rows:
              <ul>{preview.unparsed.slice(0, 20).map((u: any, i: number) => <li key={i}>Row {u.row}: {u.reason} [{u.values.join(" | ")}]</li>)}</ul>
            </div>
          )}
        </div>
      )}
      <div className="card p-4">
        <h2 className="font-semibold">Import history</h2>
        <ul className="text-sm">{history.map((h: any) => <li key={h.id} className="border-b py-1">{new Date(h.createdAt).toLocaleString("en-IN")} · {h.fileName} · {h.mode} · {h.names} names</li>)}</ul>
      </div>
    </div>
  );
}
