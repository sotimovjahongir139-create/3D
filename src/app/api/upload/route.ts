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

  const formData = await req.formData().catch((err) => {
    console.error("[upload] formData parse failed:", err);
    return null;
  });
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    console.error("[upload] no file in request body");
    return NextResponse.json({ error: "Fayl talab qilinadi" }, { status: 400 });
  }

  console.log(`[upload] received file: name=${file.name} type=${file.type} size=${file.size}`);

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    console.error(`[upload] rejected: unsupported mime type "${file.type}" (name=${file.name})`);
    return NextResponse.json({ error: "Faqat rasm fayllari qabul qilinadi" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    console.error(`[upload] rejected: file too large (${file.size} bytes, max ${MAX_SIZE})`);
    return NextResponse.json({ error: "Fayl hajmi 5MB dan oshmasligi kerak" }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;
  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);
    console.log(`[upload] saved ${buffer.length} bytes to ${filepath}`);
  } catch (err) {
    console.error(`[upload] failed to write file to ${filepath}:`, err);
    return NextResponse.json({ error: "Faylni saqlashda xatolik yuz berdi" }, { status: 500 });
  }

  console.log(`[upload] success, returning url=/uploads/${filename}`);
  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
