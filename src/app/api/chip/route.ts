import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { chipApiValidation, chipIdValidation } from "@/lib/zod";
import {
	parseJsonBody,
	NO_AUTH_RESPONSE,
	NOT_ADMIN_RESPONSE,
	badRequestResponse,
	defaultResult,
} from "@/lib/server-utils";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Create a chip
export const POST = auth(async (request) => {
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
	const validationResult = chipApiValidation.safeParse({
		id: json.id,
		userId: json.userId,
	});
	if (!validationResult.success) {
		const validationError = validationResult.error;
		return badRequestResponse(validationError.issues, "validation");
	}
	const data = validationResult.data;

	// Check for duplicated chip
	const check = await prisma.chip.findUnique({
		where: {
			id: data.id,
		},
		select: {
			id: true,
			user: true,
		},
	});

	if (check) {
		return badRequestResponse(
			{
				duplicateId: check.user.id,
				message: `Chip ID is already in use by ${
					check.user.id === json.userId ? "this user" : check.user.username
				}`,
			},
			"duplicate-found",
		);
	}

	// Create the chip
	try {
		const databaseResult = await prisma.chip.create({
			data: {
				id: data.id,
				userId: data.userId,
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

// Change the user of a chip
export const PUT = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;
	if (session.user.role !== "ADMIN") return NOT_ADMIN_RESPONSE;

	// Prepare data
	const result = defaultResult("updated", 200);

	// Check JSON
	const json = await parseJsonBody(request);
	if (json instanceof NextResponse) return json;

	// Validate request
	const validationResult = chipApiValidation.safeParse({
		id: json.id,
		userId: json.userId,
	});
	if (!validationResult.success) {
		const validationError = validationResult.error;
		return badRequestResponse(validationError.issues, "validation");
	}
	const data = validationResult.data;

	// Update the user
	try {
		const databaseResult = await prisma.chip.update({
			where: {
				id: data.id,
			},
			data: {
				userId: data.userId,
			},
		});

		result.result = databaseResult;
		return NextResponse.json(result, { status: result.status });
	} catch (e) {
		if (e instanceof PrismaClientKnownRequestError) {
			switch (e.code) {
				case "P2025":
					return badRequestResponse(
						{
							id: data.id,
							message: "Chip does not exist.",
						},
						"not-found",
					);
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

// Delete a chip
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
	const validationResult = chipIdValidation.safeParse(json.id);
	if (!validationResult.success) {
		const validationError = validationResult.error;
		return badRequestResponse(validationError.issues, "validation");
	}
	const id = validationResult.data;

	// Delete the chip
	try {
		const databaseResult = await prisma.chip.delete({
			where: {
				id: id,
			},
		});

		result.result = databaseResult;
		return NextResponse.json(result, { status: result.status });
	} catch (e) {
		if (e instanceof PrismaClientKnownRequestError) {
			switch (e.code) {
				case "P2025":
					return badRequestResponse(
						{
							id: id,
							message: "Chip does not exist.",
						},
						"not-found",
					);
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
