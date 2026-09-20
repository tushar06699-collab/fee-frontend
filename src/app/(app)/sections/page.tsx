"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@/components/hooks";

export default function SectionsPage() {
  const [data, setData] = useState<any>(null);
  const [name, setName] = useState("");
  const load = async () => { const r = await fetch("/api/sections"); if (r.ok) setData(await r.json()); };
  useEffect(() => { load(); const id = setInterval(load, 3000); return () => clearInterval(id); }, []);
  const add = async () => {
    if (!name.trim()) return;
    const r = await fetch("/api/sections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (r.ok) { setName(""); load(); toast("Section added"); } else toast("Failed (editor/admin only)");
  };
  const del = async (id: string) => {
    const moveTo = prompt("Delete section. Enter another section ID to move names there, or leave blank to trash them:");
    if (moveTo === null) return;
    if (!confirm("Confirm delete section?")) return;
    const r = await fetch(`/api/sections/${id}${moveTo ? `?moveTo=${moveTo}` : ""}`, { method: "DELETE" });
    if (r.ok) { load(); toast("Deleted"); } else toast("Only admin can delete");
  };
  const rename = async (id: string, old: string) => {
    const v = prompt("Rename section", old);
    if (!v) return;
    await fetch(`/api/sections/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: v }) });
    load();
  };
  const byId = (id: string) => data?.counts?.filter((c: any) => c.sectionId === id) || [];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sections</h1>
      <div className="card p-4 flex gap-2">
        <input className="input" placeholder="New section name" value={name} onChange={(e) => setName(e.target.value)} aria-label="New section" />
        <button className="btn-primary shrink-0" onClick={add}>Add</button>
      </div>
      {!data && <div className="skeleton h-32" />}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(data?.sections || []).map((s: any) => {
          const c = byId(s.id);
          const inv = c.find((x: any) => x.invited)?._count || 0;
          const tot = c.reduce((n: number, x: any) => n + x._count, 0);
          return (
            <div key={s.id} className="card p-4">
              <Link href={`/sections/${s.id}`} className="font-semibold text-lg text-brand-700 hover:underline">{s.name}</Link>
              <p className="text-sm text-slate-500">{inv}/{tot} invited · {s.subSections.length} sub-sections</p>
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded mt-2"><div className="h-2 bg-brand-600 rounded" style={{ width: (tot ? Math.round(inv/tot*100) : 0) + "%" }} /></div>
              <div className="flex gap-2 mt-3 no-print">
                <button className="btn-ghost text-xs" onClick={() => rename(s.id, s.name)}>Rename</button>
                <button className="btn-ghost text-xs text-red-600" onClick={() => del(s.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
      {data && data.sections.length === 0 && <div className="card p-8 text-center text-slate-500">No sections. Import your Excel to begin.</div>}
    </div>
  );
}
