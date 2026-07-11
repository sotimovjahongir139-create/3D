import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api";

export async function GET() {
  const { error } = await requireRole(["admin", "dept_sales"]);
  if (error) return error;

  const proposals = await prisma.proposal.findMany({
    include: { productionItem: { include: { model: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["admin", "dept_sales"]);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body?.productionItemId || !body?.clientName) {
    return NextResponse.json({ error: "Mijoz nomi va model talab qilinadi" }, { status: 400 });
  }

  const proposal = await prisma.proposal.create({
    data: {
      productionItemId: body.productionItemId,
      clientName: body.clientName,
      date: body.date ? new Date(body.date) : new Date(),
      status: body.status || "sent",
    },
  });

  return NextResponse.json(proposal, { status: 201 });
}
