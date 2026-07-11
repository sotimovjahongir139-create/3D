import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body?.deadline) {
    return NextResponse.json({ error: "deadline talab qilinadi" }, { status: 400 });
  }

  const item = await prisma.productionItem.update({
    where: { id: params.id },
    data: { deadline: new Date(body.deadline) },
  });

  return NextResponse.json(item);
}
