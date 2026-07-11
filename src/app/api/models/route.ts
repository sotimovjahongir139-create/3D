import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, STAGE_MAP } from "@/lib/api";

export async function GET() {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  const models = await prisma.productionModel.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(models);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Model nomi talab qilinadi" }, { status: 400 });
  }

  const stage = STAGE_MAP[body.stage] ?? "stage_3d";

  const model = await prisma.productionModel.create({
    data: {
      name: body.name,
      category: body.category || null,
      imageUrl: body.imageUrl || null,
      items: {
        create: {
          currentStage: stage as never,
          stageStart: body.stageStart ? new Date(body.stageStart) : new Date(),
          deadline: body.deadline ? new Date(body.deadline) : null,
        },
      },
    },
    include: { items: true },
  });

  return NextResponse.json(model, { status: 201 });
}
