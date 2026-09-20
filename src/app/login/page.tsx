"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setErr("Invalid email or password");
    else router.push("/dashboard");
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-brand-700">Invitation Manager</h1>
        <p className="text-sm text-slate-500 mt-1">Wedding function invitation lists</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
          <div><label className="label" htmlFor="password">Password</label>
            <input id="password" className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
          {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Signing in…" : "Login"}</button>
          <p className="text-xs text-slate-500">Forgot password? Ask your admin to reset it from Users page. First login: <code>admin@example.com / Admin@123</code> (change after seed).</p>
        </form>
      </div>
    </main>
  );
}
