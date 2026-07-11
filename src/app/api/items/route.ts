import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, STAGE_MAP } from "@/lib/api";

const STAGE_ROLE: Record<string, string> = {
  stage_3d: "dept_3d",
  stage_mold: "dept_mold",
  stage_sales: "dept_sales",
};

export async function GET(req: NextRequest) {
  const { user, error } = await requireRole(["admin", "dept_3d", "dept_mold", "dept_sales"]);
  if (error) return error;

  const stageParam = req.nextUrl.searchParams.get("stage");
  const stage = stageParam ? STAGE_MAP[stageParam] : undefined;

  if (!stage) {
    return NextResponse.json({ error: "stage parametri noto'g'ri" }, { status: 400 });
  }

  const requiredRole = STAGE_ROLE[stage];
  if (user!.role !== "admin" && user!.role !== requiredRole) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const items = await prisma.productionItem.findMany({
    where: { currentStage: stage as never },
    include: { model: true, proposals: true },
    orderBy: { stageStart: "asc" },
  });

  return NextResponse.json(items);
}
