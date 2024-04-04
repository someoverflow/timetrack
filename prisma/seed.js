import { Prisma, PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("admin", 12);

  const admin = await prisma.user.upsert({
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
  console.log({ admin });
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
