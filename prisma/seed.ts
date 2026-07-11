import { PrismaClient, Role, Stage, ProposalStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("parol123", 10);

  const users: { name: string; login: string; role: Role }[] = [
    { name: "Admin", login: "admin", role: Role.admin },
    { name: "3D operator", login: "3d", role: Role.dept_3d },
    { name: "Qolip operator", login: "mold", role: Role.dept_mold },
    { name: "Sotuv menejeri", login: "sales", role: Role.dept_sales },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { login: u.login },
      update: {},
      create: { ...u, password },
    });
  }

  const now = new Date();
  const inDays = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const model1 = await prisma.productionModel.create({
    data: { name: "Krossovka Model A", category: "Poyabzal" },
  });
  const model2 = await prisma.productionModel.create({
    data: { name: "Botinka Model B", category: "Poyabzal" },
  });
  const model3 = await prisma.productionModel.create({
    data: { name: "Sandal Model C", category: "Poyabzal" },
  });

  await prisma.productionItem.create({
    data: {
      modelId: model1.id,
      currentStage: Stage.stage_3d,
      stageStart: now,
      deadline: inDays(3),
    },
  });

  await prisma.productionItem.create({
    data: {
      modelId: model2.id,
      currentStage: Stage.stage_3d,
      stageStart: now,
      deadline: inDays(-1),
    },
  });

  const moldItem = await prisma.productionItem.create({
    data: {
      modelId: model3.id,
      currentStage: Stage.stage_mold,
      stageStart: now,
      deadline: inDays(5),
    },
  });
  await prisma.stageLog.create({
    data: {
      productionItemId: moldItem.id,
      stage: Stage.stage_3d,
      startDate: inDays(-4),
      endDate: now,
      finishedById: (await prisma.user.findUniqueOrThrow({ where: { login: "3d" } })).id,
    },
  });

  const salesItem = await prisma.productionItem.create({
    data: {
      modelId: model1.id,
      currentStage: Stage.stage_sales,
      stageStart: now,
      sampleSent: true,
    },
  });
  await prisma.proposal.create({
    data: {
      productionItemId: salesItem.id,
      clientName: "Uzbekfootwear MChJ",
      date: now,
      status: ProposalStatus.sent,
    },
  });

  console.log("Seed muvaffaqiyatli yakunlandi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
