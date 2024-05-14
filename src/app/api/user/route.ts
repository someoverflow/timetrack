import prisma from "@/lib/prisma";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import { BAD_REQUEST, NOT_ADMIN, NO_AUTH } from "@/lib/server-utils";
import { auth } from "@/lib/auth";
import { randomUUID } from "node:crypto";

// TODO: Add project to user
// TODO: invalidate session when changing something

// Create
export const PUT = auth(async (request) => {
	const session = request.auth;
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	if (session.user.role !== "ADMIN")
		return NextResponse.json(NOT_ADMIN, {
			status: NOT_ADMIN.status,
			statusText: NOT_ADMIN.result,
		});

	let result: APIResult = {
		success: true,
		status: 200,
		result: undefined,
	};

	const json = await request.json();

	if (
		json.email == null ||
		json.password == null ||
		json.username == null ||
		json.name == null
	) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			json.username == null ? "Tag Missing" : undefined,
			json.name == null ? "Name Missing" : undefined,
			json.password == null ? "Password Missing" : undefined,
			json.email == null ? "Mail Missing" : undefined,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	if (json.role == null) json.role = "USER";
	if (!(json.role === "USER" || json.role === "ADMIN")) json.role = "USER";

	result.result = await prisma.user.create({
		data: {
			username: json.username,
			name: json.name,
			email: json.email,
			password: await hash(json.password, 12),
			role: json.role,
		},
		select: {
			username: true,
			name: true,
			email: true,
			role: true,
		},
	});

	return NextResponse.json(result, { status: result.status });
});

// Update
export const POST = auth(async (request) => {
	const session = request.auth;
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	if (session.user.role !== "ADMIN")
		return NextResponse.json(NOT_ADMIN, {
			status: NOT_ADMIN.status,
			statusText: NOT_ADMIN.result,
		});

	const json = await request.json();

	let result: APIResult = {
		success: true,
		status: 200,
		result: undefined,
	};

	if (
		json.id == null ||
		json.username == null ||
		json.mail == null ||
		json.role == null ||
		json.name == null
	) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			"ID, Tag, Name, Mail or Role should be given",
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const updateData: Partial<{
		username: string;
		name: string | undefined;
		email: string | undefined;
		role: "ADMIN" | "USER";
		password: string | undefined;
	}> = {
		username: json.tag,
		name: json.name,
		email: json.mail,
		role: json.role === "ADMIN" || json.role === "USER" ? json.role : "USER",
	};

	if (json.password) {
		if (json.password.trim().length === 0) {
			result = JSON.parse(JSON.stringify(BAD_REQUEST));

			result.result = [result.result, "Password is empty"];

			return NextResponse.json(result, {
				status: BAD_REQUEST.status,
				statusText: BAD_REQUEST.result,
			});
		}
		updateData.password = await hash(json.password, 12);
	}

	const user = await prisma.user.findUnique({
		where: { id: json.id },
	});
	if (!user) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "User not found"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}
	if (user.username === "admin") {
		if (updateData.username !== "admin" || updateData.role !== "ADMIN") {
			result = JSON.parse(JSON.stringify(BAD_REQUEST));

			result.result = [result.result, "Tag of admin cannot be changed"];

			return NextResponse.json(result, {
				status: BAD_REQUEST.status,
				statusText: BAD_REQUEST.result,
			});
		}
	}

	result.result = await prisma.user.update({
		where: {
			id: json.id,
		},
		data: {
			validJwtId: randomUUID(),
			...updateData,
		},
		select: {
			id: true,
			username: true,
			email: true,
			role: true,
			updatedAt: true,
			createdAt: true,
		},
	});

	return NextResponse.json(result, { status: result.status });
});

// Delete
export const DELETE = auth(async (request) => {
	const session = request.auth;
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	if (session.user.role !== "ADMIN")
		return NextResponse.json(NOT_ADMIN, {
			status: NOT_ADMIN.status,
			statusText: NOT_ADMIN.result,
		});

	let result: APIResult = {
		success: true,
		status: 200,
		result: undefined,
	};

	const json = await request.json();

	if (json.id == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "User ID Missing"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	if (json.id === 1) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "The admin account cannot be deleted"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const userToDelete = await prisma.user.findUnique({ where: { id: json.id } });
	if (!userToDelete) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "User not found"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}
	if (userToDelete?.username === "admin") {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "The admin account cannot be deleted"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	// TODO: Delete Todo or change creator to assigned
	const [userResult] = await prisma.$transaction([
		prisma.user.delete({
			where: {
				id: userToDelete.id,
			},
		}),
	]);

	result.result = [userResult];

	return NextResponse.json(result, { status: result.status });
});
