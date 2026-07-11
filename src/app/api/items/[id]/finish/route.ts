import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api";
import { nextStage } from "@/lib/labels";

const STAGE_ROLE: Record<string, string> = {
  stage_3d: "dept_3d",
  stage_mold: "dept_mold",
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireRole(["admin", "dept_3d", "dept_mold"]);
  if (error) return error;

  const item = await prisma.productionItem.findUnique({ where: { id: params.id } });
  if (!item) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  const requiredRole = STAGE_ROLE[item.currentStage];
  if (!requiredRole || (user!.role !== "admin" && user!.role !== requiredRole)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const next = nextStage(item.currentStage);
  if (!next) {
    return NextResponse.json({ error: "Keyingi bosqich yo'q" }, { status: 400 });
  }

  const now = new Date();

  const [, updated] = await prisma.$transaction([
    prisma.stageLog.create({
      data: {
        productionItemId: item.id,
        stage: item.currentStage,
        startDate: item.stageStart,
        endDate: now,
        finishedById: user!.id,
      },
    }),
    prisma.productionItem.update({
      where: { id: item.id },
      data: {
        currentStage: next as never,
        stageStart: now,
        deadline: null,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
