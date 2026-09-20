"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/hooks";
export default function Settings() {
  const [s, setS] = useState<any>({ eventName: "", eventDate: "", language: "en" });
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((j) => setS({ eventName: j.eventName || "", eventDate: j.eventDate || "", language: j.language || "en" }));
    setTheme(localStorage.getItem("theme") || "light");
  }, []);
  const save = async () => {
    const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    toast(r.ok ? "Saved" : "Admin only");
  };
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="card p-4 space-y-3 max-w-lg">
        <label className="label">Event name<input className="input" value={s.eventName} onChange={(e) => setS({ ...s, eventName: e.target.value })} /></label>
        <label className="label">Event date<input type="date" className="input" value={s.eventDate} onChange={(e) => setS({ ...s, eventDate: e.target.value })} /></label>
        <label className="label">Language (English / Hinglish labels)
          <select className="input" value={s.language} onChange={(e) => setS({ ...s, language: e.target.value })}>
            <option value="en">English</option><option value="hinglish">Hinglish</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={save}>Save (admin)</button>
          <button className="btn-ghost" onClick={toggleTheme}>Theme: {theme} (toggle)</button>
        </div>
      </div>
    </div>
  );
}
