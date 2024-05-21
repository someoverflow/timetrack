const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: "changeme" },
    update: {},
    create: {
      username: "admin",
      name: "Admin Account",
      email: "admin@example.com",
      password: await hash("admin", 12),
      role: "ADMIN",
    },
    select: {
      id: true,
      username: true,
      name: true,
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
