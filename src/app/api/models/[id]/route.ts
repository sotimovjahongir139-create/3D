import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  const model = await prisma.productionModel.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!model) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  const itemIds = model.items.map((i) => i.id);

  await prisma.$transaction([
    prisma.proposal.deleteMany({ where: { productionItemId: { in: itemIds } } }),
    prisma.stageLog.deleteMany({ where: { productionItemId: { in: itemIds } } }),
    prisma.productionItem.deleteMany({ where: { modelId: model.id } }),
    prisma.productionModel.delete({ where: { id: model.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
