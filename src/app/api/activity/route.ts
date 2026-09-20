import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (s.user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const url = new URL(req.url);
  const take = Math.min(parseInt(url.searchParams.get("take") || "200", 10), 1000);
  const logs = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take });
  return NextResponse.json({ logs });
}
