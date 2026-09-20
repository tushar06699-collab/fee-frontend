"use client";
import { useEffect, useState } from "react";
export default function DateWise() {
  const [data, setData] = useState<any>(null);
  const load = async () => { const r = await fetch("/api/datewise"); if (r.ok) setData(await r.json()); };
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, []);
  if (!data) return <div className="skeleton h-40" />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Date-wise</h1>
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Calendar / daily counts</h2>
        <div className="flex flex-wrap gap-2">
          {data.days.map((d: any) => (
            <a key={d.day} href={`#d-${d.day}`} className="border rounded-lg px-3 py-2 text-sm min-w-[44px] min-h-[44px] text-center">
              <div className="font-bold">{new Date(d.day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
              <div className="text-brand-700 font-semibold">{d.count}</div>
            </a>
          ))}
          {data.days.length === 0 && <p className="text-sm text-slate-500">No invitations ticked yet.</p>}
        </div>
      </div>
      {data.days.map((d: any) => (
        <div key={d.day} id={`d-${d.day}`} className="card p-4">
          <h3 className="font-semibold">{new Date(d.day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}: {d.count} people</h3>
          <ul className="text-sm mt-2 grid sm:grid-cols-2 gap-1">
            {d.people.map((p: any) => <li key={p.id} className="border-b py-1">{p.name} <span className="text-slate-400">· {p.section?.name} {p.invitedBy ? `· ${p.invitedBy}` : ""}</span></li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
