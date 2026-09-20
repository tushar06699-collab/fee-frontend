"use client";
import { useState } from "react";
import { toast } from "@/components/hooks";
export default function Backup() {
  const dl = () => { window.location.href = "/api/backup"; };
  const [file, setFile] = useState<File | null>(null);
  const restore = async (mode: string) => {
    if (!file) return toast("Choose a JSON file first");
    const j = JSON.parse(await file.text());
    const r = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...j, mode }) });
    toast(r.ok ? "Restored" : "Restore failed");
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Backup</h1>
      <div className="card p-4 space-y-2">
        <button className="btn-primary" onClick={dl}>Download JSON backup</button>
        <div className="flex gap-2 pt-2">
          <input type="file" accept=".json" className="input" onChange={(e) => setFile(e.target.files?.[0] || null)} aria-label="Backup file" />
          <button className="btn-ghost" onClick={() => restore("add")}>Restore (add)</button>
          <button className="btn-ghost" onClick={() => { if (confirm("Replace ALL data from backup?")) restore("replace"); }}>Restore (replace)</button>
        </div>
      </div>
    </div>
  );
}
