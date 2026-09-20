import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const s: any = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const people = await prisma.person.findMany({ where: { isDeleted: false, invited: true, invitedOn: { not: null } }, include: { section: true }, orderBy: { invitedOn: "desc" }, take: 5000 });
  const groups: Record<string, any[]> = {};
  for (const p of people) {
    const d = new Date(p.invitedOn!);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    (groups[key] ||= []).push(p);
  }
  const days = Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([day, list]) => ({ day, count: list.length, people: list }));
  return NextResponse.json({ days });
}
