import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, STAGE_MAP } from "@/lib/api";

// Admin-only direct stage-setter, distinct from the sequential department
// finish() flow: lets admin move a model to ANY of the 5 stages (not just
// the next one in the pipeline), e.g. to correct a mistake or walk a model
// through the full pipeline for testing. Logs the outgoing stage the same
// way finish() does, so Gantt history stays consistent regardless of which
// path a transition came through.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireRole(["admin"]);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const stage = body?.stage ? STAGE_MAP[body.stage] : undefined;
  if (!stage) {
    return NextResponse.json({ error: "Bosqich noto'g'ri" }, { status: 400 });
  }

  const item = await prisma.productionItem.findUnique({ where: { id: params.id } });
  if (!item) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  if (stage === item.currentStage) {
    return NextResponse.json(item);
  }

  const now = new Date();

  const [, updated] = await prisma.$transaction([
    prisma.stageLog.create({
      data: {
        productionItemId: item.id,
        stage: item.currentStage,
        startDate: item.stageStart ?? item.createdAt,
        endDate: now,
        finishedById: user!.id,
      },
    }),
    prisma.productionItem.update({
      where: { id: item.id },
      data: {
        currentStage: stage as never,
        stageStart: now,
        deadline: null,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
