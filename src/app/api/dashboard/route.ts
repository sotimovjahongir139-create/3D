import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api";

const ROLE_STAGE: Record<string, string> = {
  dept_3d: "stage_3d",
  dept_mold: "stage_mold",
  dept_sales: "stage_sales",
};

export async function GET() {
  const { user, error } = await requireRole(["admin", "dept_3d", "dept_mold", "dept_sales"]);
  if (error) return error;

  const scopedStage = ROLE_STAGE[user!.role];
  const stageWhere = scopedStage ? { currentStage: scopedStage as never } : {};

  const [stage3d, stageMold, stageSales, overdueItems, upcomingItems, activeItems] = await Promise.all([
    prisma.productionItem.count({ where: { currentStage: "stage_3d" } }),
    prisma.productionItem.count({ where: { currentStage: "stage_mold" } }),
    prisma.productionItem.count({ where: { currentStage: "stage_sales" } }),
    prisma.productionItem.findMany({
      where: {
        ...stageWhere,
        deadline: { lt: new Date() },
        currentStage: { not: "stage_sales" },
      },
      include: { model: true },
      orderBy: { deadline: "asc" },
      take: 20,
    }),
    prisma.productionItem.findMany({
      where: {
        ...stageWhere,
        deadline: { gte: new Date() },
        currentStage: { not: "stage_sales" },
      },
      include: { model: true },
      orderBy: { deadline: "asc" },
      take: 10,
    }),
    prisma.productionItem.findMany({
      where: {
        ...stageWhere,
        currentStage: { not: "stage_sales" },
      },
      include: { model: true },
      orderBy: { stageStart: "asc" },
      take: 200,
    }),
  ]);

  const totalItems = await prisma.productionItem.count(stageWhere.currentStage ? { where: stageWhere } : undefined);

  return NextResponse.json({
    countsByStage: user!.role === "admin"
      ? { stage_3d: stage3d, stage_mold: stageMold, stage_sales: stageSales }
      : { [scopedStage]: { stage_3d: stage3d, stage_mold: stageMold, stage_sales: stageSales }[scopedStage] },
    totalItems,
    overdueCount: overdueItems.length,
    overdueItems,
    upcomingDeadlines: upcomingItems,
    activeItems,
  });
}
