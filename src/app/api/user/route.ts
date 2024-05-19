import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import {
	BAD_REQUEST,
	NOT_ADMIN,
	NOT_ADMIN_RESPONSE,
	NO_AUTH,
	NO_AUTH_RESPONSE,
	badRequestResponse,
	defaultResult,
	parseJsonBody,
} from "@/lib/server-utils";
import { auth } from "@/lib/auth";
import { randomUUID } from "node:crypto";
import {
	nanoIdValidation,
	userCreateApiValidation,
	userUpdateApiValidation,
} from "@/lib/zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Create
export const PUT = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;
	if (session.user.role !== "ADMIN") return NOT_ADMIN_RESPONSE;

	// Prepare data
	const result = defaultResult("created", 201);

	// Check JSON
	const json = await parseJsonBody(request);
	if (json instanceof NextResponse) return json;

	// Validate request
	const validationResult = userCreateApiValidation.safeParse({
		name: json.name,
		username: json.username,
		password: json.password,
		email: json.email,
		role: json.role,
	});
	if (!validationResult.success) {
		const validationError = validationResult.error;
		return badRequestResponse(validationError.issues, "validation");
	}
	const data = validationResult.data;

	const role =
		data.role === "ADMIN" || data.role === "USER" ? data.role : "USER";

	// Create the chip
	try {
		const databaseResult = await prisma.user.create({
			data: {
				username: data.username,
				name: data.name,
				email: data.email,
				password: await hash(data.password, 12),
				role: role,
			},
			select: {
				username: true,
				name: true,
				email: true,
				role: true,
			},
		});
		result.result = databaseResult;
		return NextResponse.json(result, { status: result.status });
	} catch (e) {
		if (e instanceof PrismaClientKnownRequestError) {
			switch (
				e.code
				// TODO: Add cases
			) {
			}

			result.result = `Server issue occurred ${e.code}`;
		} else result.result = "Server issue occurred";

		result.success = false;
		result.status = 500;
		result.type = "unknown";
		console.warn(e);
		return NextResponse.json(result, { status: result.status });
	}
});

// Update
export const POST = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;
	if (session.user.role !== "ADMIN") return NOT_ADMIN_RESPONSE;

	// Prepare data
	const result = defaultResult("updated");

	// Check JSON
	const json = await parseJsonBody(request);
	if (json instanceof NextResponse) return json;

	// Validate request
	const validationResult = userUpdateApiValidation.safeParse({
		id: json.id,
		name: json.name,
		username: json.username,
		password: json.password,
		email: json.email,
		role: json.role,
	});
	if (!validationResult.success) {
		const validationError = validationResult.error;
		return badRequestResponse(validationError.issues, "validation");
	}
	const data = validationResult.data;

	// Check the user
	const databaseUser = await prisma.user
		.findUnique({
			where: { id: json.id },
		})
		.catch(() => null);
	if (!databaseUser) {
		return badRequestResponse(
			{
				id: data.id,
				message: "User does not exist.",
			},
			"not-found",
		);
	}
	// Check for changes of admin
	if (databaseUser.username === "admin") {
		if (data.username !== "admin" || data.role !== "ADMIN")
			return badRequestResponse(
				"Tag of admin cannot be changed",
				"error-message",
			);
	}

	// Prepare data
	const updateData: Partial<{
		validJwtId: string;

		username: string;
		name: string | undefined;
		email: string | undefined;
		role: "ADMIN" | "USER";
		password: string | undefined;
	}> = {
		validJwtId: randomUUID(), // Invalidate session
		username: json.tag,
		name: data.name,
		email: data.email,
		role: data.role === "ADMIN" || data.role === "USER" ? data.role : undefined,
		password: data.password ? await hash(data.password, 12) : undefined,
	};

	// Update the user
	try {
		const databaseResult = await prisma.user.update({
			where: {
				id: data.id,
			},
			data: updateData,
			select: {
				id: true,
				username: true,
				email: true,
				role: true,
				updatedAt: true,
				createdAt: true,
			},
		});

		result.result = databaseResult;
		return NextResponse.json(result, { status: result.status });
	} catch (e) {
		result.success = false;
		result.status = 500;
		result.type = "unknown";
		result.result = `Server issue occurred ${
			e instanceof PrismaClientKnownRequestError ? e.code : ""
		}`;
		console.warn(e);
		return NextResponse.json(result, { status: result.status });
	}
});

// Delete
export const DELETE = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;
	if (session.user.role !== "ADMIN") return NOT_ADMIN_RESPONSE;

	// Prepare data
	const result = defaultResult("deleted");

	// Check JSON
	const json = await parseJsonBody(request);
	if (json instanceof NextResponse) return json;

	// Validate request
	const validationResult = nanoIdValidation.safeParse(json.id);
	if (!validationResult.success) {
		const validationError = validationResult.error;
		return badRequestResponse(validationError.issues, "validation");
	}
	const id = validationResult.data;

	const databaseUser = await prisma.user
		.findUnique({
			where: { id: id },
			select: {
				username: true,
				createdTodos: {
					select: {
						id: true,
						assignees: {
							select: { id: true },
						},
					},
				},
			},
		})
		.catch(() => null);
	if (!databaseUser) {
		return badRequestResponse(
			{
				id: id,
				message: "User does not exist.",
			},
			"not-found",
		);
	}
	if (databaseUser.username === "admin")
		return badRequestResponse(
			"Admin account cannot be deleted.",
			"error-message",
		);

	// Delete the chip
	try {
		// TODO: Delete Todo or change creator to assigned

		const databaseResult = await prisma.user.delete({
			where: {
				id: id,
			},
		});

		result.result = databaseResult;
		return NextResponse.json(result, { status: result.status });
	} catch (e) {
		result.success = false;
		result.status = 500;
		result.type = "unknown";
		result.result = `Server issue occurred ${
			e instanceof PrismaClientKnownRequestError ? e.code : ""
		}`;
		console.warn(e);
		return NextResponse.json(result, { status: result.status });
	}
});
