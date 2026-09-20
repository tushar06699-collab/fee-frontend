import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public health check — use after deploying to verify DB wiring:
// visit https://<your-app>.vercel.app/api/health → { ok: true, users: >= 1 }
export async function GET() {
  try {
    const users = await prisma.user.count();
    return NextResponse.json({ ok: true, db: "connected", users, time: new Date().toISOString() });
  } catch (e: any) {
    const msg = String(e?.message || e).replace(/:\/\/[^@\s]*@/g, "://***@").slice(0, 200);
    return NextResponse.json(
      { ok: false, db: "error", error: msg, hint: "Check DATABASE_URL (Atlas user, password, IP access list, and /database-name in the URL)" },
      { status: 500 }
    );
  }
}
