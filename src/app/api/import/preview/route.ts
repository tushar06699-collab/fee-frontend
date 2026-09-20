import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseInvitationBuffer } from "@/lib/excel-parser";

export async function POST(req: Request) {
  const s: any = await getServerSession(authOptions);
  if (!s || !["ADMIN", "EDITOR"].includes(s.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const parsed = parseInvitationBuffer(buf);
    return NextResponse.json({ fileName: file.name, ...parsed });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not parse Excel: " + e.message }, { status: 400 });
  }
}
