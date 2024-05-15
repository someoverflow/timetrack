import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NO_AUTH, BAD_REQUEST, NOT_ADMIN } from "@/lib/server-utils";
import { NextResponse } from "next/server";

// Create a chip
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

	let result: APIResult = {
		success: true,
		status: 201,
		result: undefined,
	};

	const json = await request.json().catch((e) => {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "JSON Body could not be parsed"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	});
	if (json instanceof NextResponse) return json;

	if (json.id == null || json.userId == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			json.id == null ? "ID Missing" : undefined,
			json.userId == null ? "User ID Missing" : undefined,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	if ((json.id as string).trim().length === 0) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "ID is empty"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const check = await prisma.chip.findUnique({
		where: {
			id: json.id,
		},
		select: {
			id: true,
			userId: true,
			user: true,
		},
	});

	if (check) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			`Chip ID is already in use by ${
				check.userId === json.userId ? "this user" : check.user.username
			}`,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const res = await prisma.chip
		.create({
			data: {
				id: json.id,
				userId: json.userId,
			},
		})
		.catch(() => {
			return null;
		});

	if (!res) {
		result.success = false;
		result.status = 500;
		return NextResponse.json(result, { status: result.status });
	}

	result.result = res;

	return NextResponse.json(result, { status: result.status });
});

// Update a chip
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

	const json = await request.json().catch((e) => {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "JSON Body could not be parsed"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	});
	if (json instanceof NextResponse) return json;

	if (json.id == null || json.userId == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			json.id == null ? "ID Missing" : undefined,
			json.userId == null ? "User ID Missing" : undefined,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	result.result = await prisma.chip
		.update({
			where: {
				id: json.id,
			},
			data: {
				userId: json.userId,
			},
		})
		.catch((e) => {
			result.success = false;
			result.status = 500;
			return e.meta.cause;
		});

	return NextResponse.json(result, { status: result.status });
});

// Delete a chip
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

	const json = await request.json().catch((e) => {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "JSON Body could not be parsed"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	});
	if (json instanceof NextResponse) return json;

	if (json.id == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "ID Missing"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const check = await prisma.chip.findUnique({
		where: {
			id: json.id,
		},
	});

	if (!check) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "Chip ID not found"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const res = await prisma.chip
		.delete({
			where: {
				id: json.id,
			},
		})
		.catch(() => {
			return null;
		});

	if (!res) {
		result.success = false;
		result.status = 500;
		return NextResponse.json(result, { status: result.status });
	}

	result.result = res;

	return NextResponse.json(result, { status: result.status });
});
