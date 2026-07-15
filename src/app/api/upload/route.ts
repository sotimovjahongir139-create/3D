import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireRole } from "@/lib/api";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Fayl talab qilinadi" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Faqat rasm fayllari qabul qilinadi" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fayl hajmi 5MB dan oshmasligi kerak" }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;
  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);
  } catch {
    return NextResponse.json({ error: "Faylni saqlashda xatolik yuz berdi" }, { status: 500 });
  }

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
