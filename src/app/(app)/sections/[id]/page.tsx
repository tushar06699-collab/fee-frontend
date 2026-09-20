"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "@/components/hooks";

type P = any;

export default function SectionDetail() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sel, setSel] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<any>({ name: "", remarks: "", subSectionId: "", phone: "", guestsCount: 1 });
  const [edit, setEdit] = useState<any>(null);

  const load = async () => {
    const r = await fetch(`/api/sections/${id}?q=${encodeURIComponent(q)}&status=${status}`);
    if (r.ok) setData(await r.json());
  };
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [id, q, status]);

  const toggle = async (p: P) => {
    const r = await fetch(`/api/people/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invited: !p.invited }) });
    if (r.ok) { load(); toast(p.invited ? "Unticked (undo: tick again)" : "Invited ✓ " + new Date().toLocaleString()); }
  };
  const bulk = async (action: string) => {
    if (!sel.length) return toast("Select names first");
    let targetSectionId = "", targetSubSectionId = "";
    if (action === "move") { targetSectionId = prompt("Target section ID? (see Sections page URL)") || ""; if (!targetSectionId) return; }
    const r = await fetch("/api/people/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: sel, action, targetSectionId, targetSubSectionId }) });
    if (r.ok) { setSel([]); load(); toast("Done"); } else toast("Failed");
  };
  const saveNew = async () => {
    const r = await fetch("/api/people", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, sectionId: id, subSectionId: form.subSectionId || null }) });
    if (r.ok) { setShowAdd(false); setForm({ name: "", remarks: "", subSectionId: "", phone: "", guestsCount: 1 }); load(); toast("Added"); } else toast("Failed");
  };
  const saveEdit = async () => {
    const r = await fetch(`/api/people/${edit.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) });
    if (r.ok) { setEdit(null); load(); toast("Saved"); }
  };
  const addSub = async () => {
    const v = prompt("New sub-section name");
    if (!v) return;
    await fetch("/api/subsections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: v, sectionId: id }) });
    load();
  };

  const groups: Record<string, P[]> = { "": [] };
  for (const p of data?.people || []) {
    const k = p.subSectionId || "";
    (groups[k] ||= []).push(p);
  }
  const subName = (sid: string) => data?.section?.subSections?.find((s: any) => s.id === sid)?.name || "General";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{data?.section?.name || "…"}</h1>
      <div className="card p-3 flex flex-col sm:flex-row gap-2 no-print">
        <input className="input" placeholder="Search names (Hindi/English)…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <select className="input sm:w-40" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter">
          <option value="all">All</option><option value="pending">Pending</option><option value="invited">Invited</option>
        </select>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Name</button>
        <button className="btn-ghost" onClick={addSub}>+ Sub-section</button>
      </div>
      {sel.length > 0 && (
        <div className="card p-3 flex flex-wrap gap-2 items-center no-print">
          <span className="text-sm font-semibold">{sel.length} selected</span>
          <button className="btn-primary text-xs" onClick={() => bulk("tick")}>Tick</button>
          <button className="btn-ghost text-xs" onClick={() => bulk("untick")}>Untick</button>
          <button className="btn-ghost text-xs" onClick={() => bulk("move")}>Move</button>
          <button className="btn-ghost text-xs text-red-600" onClick={() => bulk("delete")}>Delete</button>
          <button className="text-xs underline" onClick={() => setSel([])}>Clear</button>
        </div>
      )}
      {!data && <div className="skeleton h-40" />}
      {Object.entries(groups).map(([sid, list]) => (
        <details key={sid} open className="card">
          <summary className="p-3 font-semibold cursor-pointer min-h-[44px]">{subName(sid)} ({list.length})</summary>
          <div className="overflow-x-auto">
            <table className="table w-full min-w-[640px]">
              <thead><tr><th><span className="sr-only">Select</span></th><th>✓</th><th>Sr</th><th>Name</th><th>Remarks</th><th>Invited on</th><th>By</th><th></th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className={p.invited ? "bg-green-50 dark:bg-green-950/30" : ""}>
                    <td><input type="checkbox" className="checkbox" aria-label={`Select ${p.name}`} checked={sel.includes(p.id)} onChange={(e) => setSel(e.target.checked ? [...sel, p.id] : sel.filter((x) => x !== p.id))} /></td>
                    <td><input type="checkbox" className="checkbox" aria-label={`Invited ${p.name}`} checked={p.invited} onChange={() => toggle(p)} /></td>
                    <td className="text-slate-500">{p.serialNo || ""}</td>
                    <td className="font-medium">{p.name}</td>
                    <td className="text-slate-500">{p.remarks || ""}</td>
                    <td className="text-xs">{p.invitedOn ? new Date(p.invitedOn).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="text-xs">{p.invitedBy || ""}</td>
                    <td className="whitespace-nowrap no-print">
                      <button className="text-xs underline mr-2" onClick={() => setEdit({ ...p, invitedOn: p.invitedOn ? new Date(p.invitedOn).toISOString().slice(0, 16) : "" })}>Edit</button>
                      <button className="text-xs underline text-red-600" onClick={async () => { if (confirm("Delete " + p.name + "?")) { await fetch(`/api/people/${p.id}`, { method: "DELETE" }); load(); } }}>Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Cards for phones */}
          <div className="md:hidden p-2 space-y-2">
            {list.map((p) => (
              <div key={p.id + "-c"} className="border rounded-lg p-3 flex items-center gap-3">
                <input type="checkbox" className="checkbox" checked={p.invited} onChange={() => toggle(p)} aria-label={`Invited ${p.name}`} />
                <div className="flex-1"><div className="font-medium">{p.name}</div><div className="text-xs text-slate-500">{p.remarks} · {p.invitedOn ? new Date(p.invitedOn).toLocaleDateString("en-IN") : "Pending"}</div></div>
              </div>
            ))}
          </div>
        </details>
      ))}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30" role="dialog" aria-label="Add name">
          <div className="card p-4 w-full max-w-md space-y-2">
            <h2 className="font-bold">Add name</h2>
            <input className="input" placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            <div className="flex gap-2">
              <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="input" type="number" min={1} placeholder="Guests" value={form.guestsCount} onChange={(e) => setForm({ ...form, guestsCount: e.target.value })} />
            </div>
            <select className="input" value={form.subSectionId} onChange={(e) => setForm({ ...form, subSectionId: e.target.value })}>
              <option value="">No sub-section</option>
              {(data?.section?.subSections || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex gap-2"><button className="btn-primary flex-1" onClick={saveNew}>Save</button><button className="btn-ghost flex-1" onClick={() => setShowAdd(false)}>Cancel</button></div>
          </div>
        </div>
      )}
      {edit && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30" role="dialog" aria-label="Edit name">
          <div className="card p-4 w-full max-w-md space-y-2 max-h-[90vh] overflow-auto">
            <h2 className="font-bold">Edit</h2>
            <label className="label">Name<input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label className="label">Remarks<input className="input" value={edit.remarks || ""} onChange={(e) => setEdit({ ...edit, remarks: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="label">Invited by<input className="input" value={edit.invitedBy || ""} onChange={(e) => setEdit({ ...edit, invitedBy: e.target.value })} /></label>
              <label className="label">Mode (In person/Phone/WhatsApp/Card)<input className="input" value={edit.mode || ""} onChange={(e) => setEdit({ ...edit, mode: e.target.value })} /></label>
            </div>
            <label className="label">Invited on<input type="datetime-local" className="input" value={edit.invitedOn || ""} onChange={(e) => setEdit({ ...edit, invitedOn: e.target.value })} /></label>
            <label className="label">Notes<input className="input" value={edit.notes || ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></label>
            <div className="flex gap-2"><button className="btn-primary flex-1" onClick={saveEdit}>Save</button><button className="btn-ghost flex-1" onClick={() => setEdit(null)}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
