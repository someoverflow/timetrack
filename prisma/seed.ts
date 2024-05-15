import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
	const password = await hash("admin", 12);

	const result = await prisma.user.upsert({
		where: { username: "admin" },
		update: {},
		create: {
			username: "admin",
			name: "Admin Account",
			email: "admin@example.com",
			password: password,
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

	/* Invalidate jwt
	const result = await prisma.user.update({
		where: {
			username: "admin",
		},
		data: {
			validJwtId: randomUUID(),
		},
	});
  */

	/*
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
  console.log({ res }) 
  */

	console.log({ result });
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
