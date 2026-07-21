import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
// @ts-expect-error heic-convert ships no type declarations
import heicConvert from "heic-convert";
import { requireRole } from "@/lib/api";

// Accepted regardless of source device. HEIC/HEIF (iPhone's default photo
// format) can't be rendered by <img>/next/image in any browser but Safari,
// so it's decoded here and every upload - HEIC or not - is normalized to a
// single predictable JPEG output: auto-oriented from EXIF (mobile photos are
// often stored sideways/upside-down with an EXIF rotation flag that isn't
// baked into the pixels) and capped to a sane max dimension.
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);
const HEIC_EXT_RE = /\.(heic|heif)$/i;
const MAX_SIZE = 20 * 1024 * 1024; // mobile camera originals run larger than desktop exports
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 85;

function isHeic(file: File): boolean {
  if (file.type === "image/heic" || file.type === "image/heif") return true;
  // Some mobile browsers send an empty or generic MIME type for HEIC files -
  // fall back to the filename extension in that case.
  if (!file.type || file.type === "application/octet-stream") {
    return HEIC_EXT_RE.test(file.name);
  }
  return false;
}

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

  console.log(`[upload] received file: name=${file.name} type=${file.type || "(bo'sh)"} size=${file.size}`);

  const heic = isHeic(file);
  if (!heic && !ALLOWED_TYPES.has(file.type)) {
    console.error(`[upload] rejected: unsupported mime type "${file.type}" (name=${file.name})`);
    return NextResponse.json({ error: "Faqat rasm fayllari qabul qilinadi" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    console.error(`[upload] rejected: file too large (${file.size} bytes, max ${MAX_SIZE})`);
    return NextResponse.json({ error: "Fayl hajmi 20MB dan oshmasligi kerak" }, { status: 400 });
  }

  let inputBuffer: Buffer<ArrayBufferLike> = Buffer.from(await file.arrayBuffer());

  if (heic) {
    try {
      console.log("[upload] HEIC/HEIF detected, decoding...");
      const converted = await heicConvert({ buffer: inputBuffer, format: "JPEG", quality: 0.92 });
      inputBuffer = Buffer.from(converted);
    } catch (err) {
      console.error("[upload] HEIC decode failed:", err);
      return NextResponse.json({ error: "HEIC faylni o'qib bo'lmadi" }, { status: 400 });
    }
  }

  let outputBuffer: Buffer;
  try {
    outputBuffer = await sharp(inputBuffer)
      .rotate() // auto-orient from EXIF, then strip the orientation tag
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
  } catch (err) {
    console.error("[upload] image normalization failed:", err);
    return NextResponse.json({ error: "Rasmni qayta ishlashda xatolik yuz berdi" }, { status: 400 });
  }

  const filename = `${randomUUID()}.jpg`;
  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  try {
    await writeFile(filepath, outputBuffer);
    console.log(`[upload] saved ${outputBuffer.length} bytes to ${filepath}`);
  } catch (err) {
    console.error(`[upload] failed to write file to ${filepath}:`, err);
    return NextResponse.json({ error: "Faylni saqlashda xatolik yuz berdi" }, { status: 500 });
  }

  console.log(`[upload] success, returning url=/uploads/${filename}`);
  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
