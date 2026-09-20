"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

// roles: which roles see each link. Editors get a slim menu:
// Dashboard, Sections, Reports, Backup (no Date-wise, Import, Trash, Settings).
const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠", roles: ["ADMIN", "EDITOR", "VIEWER"] },
  { href: "/sections", label: "Sections", icon: "📂", roles: ["ADMIN", "EDITOR", "VIEWER"] },
  { href: "/datewise", label: "Date-wise", icon: "📅", roles: ["ADMIN", "VIEWER"] },
  { href: "/reports", label: "Reports", icon: "📊", roles: ["ADMIN", "EDITOR", "VIEWER"] },
  { href: "/import", label: "Import", icon: "📥", roles: ["ADMIN", "VIEWER"] },
  { href: "/trash", label: "Trash", icon: "🗑️", roles: ["ADMIN", "VIEWER"] },
  { href: "/backup", label: "Backup", icon: "💾", roles: ["ADMIN", "EDITOR", "VIEWER"] },
];

const ADMIN_NAV = [
  { href: "/activity", label: "Activity", icon: "🧾", roles: ["ADMIN"] },
  { href: "/users", label: "Users", icon: "👥", roles: ["ADMIN"] },
  { href: "/settings", label: "Settings", icon: "⚙️", roles: ["ADMIN", "VIEWER"] },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { data } = useSession();
  const role = (data?.user as any)?.role;
  const [open, setOpen] = useState(false);
  const router = useRouter();
  // While the session loads (role unknown), show only the links common to every
  // role, so admin-only items never flash on screen for editors/viewers.
  const links = [...NAV, ...ADMIN_NAV].filter((l) =>
    role ? (l.roles as string[]).includes(role) : (l.roles as string[]).length === 3
  );
  return (
    <div className="min-h-screen md:flex">
      <header className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-brand-700 text-white px-4 py-3">
        <span className="font-bold">Invitation Manager</span>
        <button aria-label="Menu" className="text-2xl p-2 min-w-[44px] min-h-[44px]" onClick={() => setOpen(!open)}>☰</button>
      </header>
      <aside className={`${open ? "block" : "hidden"} md:block w-full md:w-60 shrink-0 bg-brand-900 text-white md:min-h-screen`}>
        <div className="p-4 hidden md:block font-bold text-lg">Invitation Manager</div>
        <nav className="p-2 space-y-1" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] ${path.startsWith(l.href) ? "bg-white/20" : "hover:bg-white/10"}`}>
              <span aria-hidden>{l.icon}</span>{l.label}
            </Link>
          ))}
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] hover:bg-white/10">↩ Logout</button>
        </nav>
        <div className="p-4 text-xs text-white/70">{(data?.user as any)?.email} · {(data?.user as any)?.role}</div>
      </aside>
      <main className="flex-1 p-3 sm:p-6 max-w-6xl w-full mx-auto pb-24 md:pb-6">{children}</main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white dark:bg-slate-900 border-t flex justify-around py-1 no-print" aria-label="Mobile">
        {links.slice(0, 5).map((l) => (
          <Link key={l.href} href={l.href} className="flex flex-col items-center text-[11px] p-2 min-w-[60px] min-h-[44px]">
            <span className="text-xl">{l.icon}</span>{l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
