import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	const password = await hash("changeme", 12);

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

	/*
	const data = [];
	for (let i = 0; i < 25; i++) {
		let status: "TODO" | "IN_PROGRESS" | "DONE" = "TODO";
		if (i % 3 === 0) status = "IN_PROGRESS";
		if (i % 3 === 1) status = "DONE";
		data.push({
			task: `Test Task ${i}`,
			creatorId: "cKaKfdrKJwxy",
			status: status,
		});
	}

	const res = await prisma.todo.createMany({
		data: data,
	});
	console.log({ res });
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
