import { Prisma, PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await hash("admin123", 12);

  var data: Prisma.userCreateManyInput | Prisma.userCreateManyInput[] = [];
  for (var i = 1; i < 100; i++) {
    data[i - 1] = {
      username: "test" + i,
      name: "Test User " + i,
      role: "user",
      password: password,
      email: "test-user" + i + "@example.com",
    };
  }

  const test = await prisma.user.createMany({
    data: data,
  });
  console.log(test);
  /**
  const admin = await prisma.user.upsert({
    where: { username: "admin", email: "admin@example.com" },
    update: {},
    create: {
      name: "admin",
      email: "admin@example.com",
      username: "admin",
      password: password,
      role: "admin",
    },
  });
  console.log({ admin });
   */
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
