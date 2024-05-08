import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("admin", 12);

  const result = await prisma.user.upsert({
    where: { tag: "admin" },
    update: {},
    create: {
      tag: "admin",
      name: "admin",
      email: "admin@example.com",
      password: password,
      role: "admin",
    },
    select: {
      id: true,
      tag: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const data = [];
  for (let i = 0; i < 50; i++) {
    data.push({
      tag: `test${i}`,
      name: `Test-${i}`,
      role: "user",
      password: await hash(`test${i}`, 12),
      email: `test${i}@test.de`,
    });
  }

  const res = await prisma.user.createMany({
    data: data,
  });

  console.log({ result, res });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
