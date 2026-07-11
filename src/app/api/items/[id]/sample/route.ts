import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["admin", "dept_sales"]);
  if (error) return error;

  const item = await prisma.productionItem.findUnique({ where: { id: params.id } });
  if (!item) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }
  if (item.currentStage !== "stage_sales") {
    return NextResponse.json({ error: "Element sotuv bosqichida emas" }, { status: 400 });
  }

  const updated = await prisma.productionItem.update({
    where: { id: item.id },
    data: { sampleSent: true },
  });

  return NextResponse.json(updated);
}
