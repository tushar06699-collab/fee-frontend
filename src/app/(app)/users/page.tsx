"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/hooks";
export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [f, setF] = useState({ email: "", name: "", password: "", role: "VIEWER" });
  const load = () => fetch("/api/users").then((r) => r.json()).then((j) => setUsers(j.users || []));
  useEffect(() => { load(); }, []);
  const invite = async () => {
    const r = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    if (r.ok) { setF({ email: "", name: "", password: "", role: "VIEWER" }); load(); toast("User invited"); } else toast("Failed");
  };
  const setRole = async (id: string, role: string) => {
    await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role }) }); load();
  };
  const del = async (id: string) => {
    if (!confirm("Remove user?")) return;
    await fetch(`/api/users?id=${id}`, { method: "DELETE" }); load();
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users (Admin)</h1>
      <div className="card p-4 grid sm:grid-cols-4 gap-2">
        <input className="input" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input" placeholder="Temp password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <div className="flex gap-2">
          <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option>ADMIN</option><option>EDITOR</option><option>VIEWER</option>
          </select>
          <button className="btn-primary" onClick={invite}>Invite</button>
        </div>
      </div>
      <div className="card p-4 text-sm">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-2 border-b py-2">
            <span className="flex-1">{u.email} · {u.name} · {u.role}</span>
            <select className="input !w-auto" value={u.role} onChange={(e) => setRole(u.id, e.target.value)} aria-label="Role">
              <option>ADMIN</option><option>EDITOR</option><option>VIEWER</option>
            </select>
            <button className="btn-ghost text-xs" onClick={() => del(u.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
