"use client";
import { useEffect, useState } from "react";
export default function Activity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => { fetch("/api/activity").then(async (r) => { const j = await r.json(); if (!r.ok) setErr(j.error); else setLogs(j.logs); }); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Activity log (Admin)</h1>
      {err && <div className="card p-4 text-red-600 text-sm">{err}</div>}
      <div className="card p-4 text-sm space-y-1">
        {logs.map((l) => <div key={l.id} className="border-b py-1">{new Date(l.createdAt).toLocaleString("en-IN")} · {l.userEmail} · {l.action} {l.entity} · {l.detail}</div>)}
        {logs.length === 0 && !err && <p className="text-slate-500">No activity yet.</p>}
      </div>
    </div>
  );
}
