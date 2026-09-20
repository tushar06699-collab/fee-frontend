"use client";
import { useEffect, useState } from "react";

export function usePoll<T>(url: string, ms = 3000): { data: T | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (r.ok) { const j = await r.json(); if (!stop) setData(j); }
      } catch {}
    }
    load();
    const id = setInterval(load, ms);
    return () => { stop = true; clearInterval(id); };
  }, [url, ms, tick]);
  return { data, refresh: () => setTick((t) => t + 1) };
}

export function toast(msg: string) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.className = "fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg z-50";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
