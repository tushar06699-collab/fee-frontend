"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/hooks";
export default function Trash() {
  const [list, setList] = useState<any>(null);
  const load = () => fetch("/api/people?status=trash&pageSize=200").then((r) => r.json()).then(setList);
  useEffect(() => { load(); }, []);
  const restore = async (ids: string[]) => {
    await fetch("/api/people/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, action: "restore" }) });
    load(); toast("Restored");
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Trash</h1>
      <div className="card p-4">
        {(list?.people || []).map((p: any) => (
          <div key={p.id} className="flex justify-between items-center border-b py-2 text-sm">
            <span>{p.name} <span className="text-slate-400">· {p.section?.name}</span></span>
            <button className="btn-ghost text-xs" onClick={() => restore([p.id])}>Restore</button>
          </div>
        ))}
        {list && list.total === 0 && <p className="text-sm text-slate-500">Trash is empty.</p>}
        {list && list.total > 0 && <button className="btn-ghost mt-3 text-xs" onClick={() => restore(list.people.map((p: any) => p.id))}>Restore all</button>}
      </div>
    </div>
  );
}
