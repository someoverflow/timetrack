const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

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
