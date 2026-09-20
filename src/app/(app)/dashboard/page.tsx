"use client";
import { usePoll } from "@/components/hooks";
import Link from "next/link";

export default function Dashboard() {
  const { data } = usePoll<any>("/api/stats", 3000);
  if (!data) return <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-24" />)}</div>;
  const max = Math.max(1, ...data.perDay.map((d: any) => d.count));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["Total", data.total],["Invited", data.invited],["Pending", data.pending],[`Done`, data.pct + "%"]].map(([l, v]) => (
          <div key={l} className="card p-4"><div className="text-xs text-slate-500">{l}</div><div className="text-2xl font-bold">{v}</div></div>
        ))}
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Per-section progress</h2>
        <div className="space-y-2">
          {data.perSection.map((s: any) => (
            <Link key={s.id} href={`/sections/${s.id}`} className="block">
              <div className="flex justify-between text-sm"><span>{s.name}</span><span>{s.invited}/{s.total}</span></div>
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded"><div className="h-2 bg-brand-600 rounded" style={{ width: (s.total ? Math.round(s.invited/s.total*100) : 0) + "%" }} /></div>
            </Link>
          ))}
          {data.perSection.length === 0 && <p className="text-sm text-slate-500">No sections yet. <Link className="underline" href="/import">Import Excel</Link></p>}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Invitations per day</h2>
          {data.perDay.length === 0 && <p className="text-sm text-slate-500">Nothing ticked yet.</p>}
          {data.perDay.slice(-14).map((d: any) => (
            <div key={String(d.day)} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0">{new Date(d.day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
              <div className="h-3 bg-brand-500 rounded" style={{ width: Math.round((d.count / max) * 100) + "%", minWidth: 8 }} />
              <span>{d.count}</span>
            </div>
          ))}
        </div>
        <div className="card p-4">
          <h2 className="font-semibold mb-2">Recent activity (live)</h2>
          <ul className="text-sm space-y-1 max-h-72 overflow-auto">
            {data.recent.map((r: any) => (
              <li key={r.id} className="border-b border-slate-100 dark:border-slate-800 py-1">{r.userEmail} {r.action} {r.entity} — {r.detail} <span className="text-slate-400">{new Date(r.createdAt).toLocaleString("en-IN")}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
