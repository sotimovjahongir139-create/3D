import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serves image bytes stored in Postgres by /api/upload. Intentionally public
// (no auth check) - this replaces what used to be a static file under
// public/uploads, which was also served with no auth check, so this keeps
// the exact same access model, just backed by the database instead of a
// per-instance local disk.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const image = await prisma.uploadedImage.findUnique({ where: { id: params.id } });
  if (!image) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
