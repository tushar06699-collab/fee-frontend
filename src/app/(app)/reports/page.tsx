"use client";
import { useEffect, useState } from "react";
export default function Reports() {
  const [stats, setStats] = useState<any>(null);
  const [status, setStatus] = useState("pending");
  const [list, setList] = useState<any>(null);
  useEffect(() => { fetch("/api/stats").then((r) => r.json()).then(setStats); }, []);
  useEffect(() => { fetch(`/api/people?status=${status}&pageSize=500`).then((r) => r.json()).then(setList); }, [status]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="card p-4 flex flex-wrap gap-2 no-print">
        <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Report type">
          <option value="pending">Pending list</option><option value="invited">Invited list</option><option value="verify">Needs verification</option>
        </select>
        <a className="btn-ghost" href="/api/export/excel">Export Excel</a>
        <button className="btn-ghost" onClick={() => window.print()}>Print / PDF</button>
      </div>
      {stats && (
        <div className="card p-4">
          <h2 className="font-semibold">Section-wise summary</h2>
          <table className="table w-full"><thead><tr><th>Section</th><th>Total</th><th>Invited</th><th>Pending</th></tr></thead>
            <tbody>{stats.perSection.map((s: any) => <tr key={s.id}><td>{s.name}</td><td>{s.total}</td><td>{s.invited}</td><td>{s.pending}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <div className="card p-4">
        <h2 className="font-semibold capitalize">{status} ({list?.total ?? "…"})</h2>
        <ul className="text-sm divide-y">{(list?.people || []).map((p: any) => <li key={p.id} className="py-1.5">{p.name} <span className="text-slate-400">· {p.section?.name}{p.subSection ? " / " + p.subSection.name : ""} · {p.remarks}</span></li>)}</ul>
      </div>
    </div>
  );
}
