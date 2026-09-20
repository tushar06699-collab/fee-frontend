import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const s: any = await getServerSession(authOptions);
  if (!s || s.user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || s.user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { email, name, password, role } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });
  if (!["ADMIN", "EDITOR", "VIEWER"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  const passwordHash = await bcrypt.hash(String(password), 10);
  const u = await prisma.user.create({ data: { email: String(email).toLowerCase().trim(), name: name || "", passwordHash, role } });
  return NextResponse.json({ id: u.id, email: u.email, name: u.name, role: u.role });
}

export async function PATCH(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || s.user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { id, role, password, name } = await req.json();
  const data: any = {};
  if (role) data.role = role;
  if (name !== undefined) data.name = name;
  if (password) data.passwordHash = await bcrypt.hash(String(password), 10);
  const u = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ id: u.id, email: u.email, role: u.role });
}

export async function DELETE(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || s.user.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (id === s.user.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  // MongoDB has no SetNull cascades — clear references in app code first
  await prisma.person.updateMany({ where: { createdById: id }, data: { createdById: null } });
  await prisma.activityLog.updateMany({ where: { userId: id }, data: { userId: null } });
  await prisma.importHistory.updateMany({ where: { userId: id }, data: { userId: null } });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
