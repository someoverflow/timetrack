import prisma from "@/lib/prisma";
import {
	NO_AUTH_RESPONSE,
	defaultResult,
	parseJsonBody,
	badRequestResponse,
} from "@/lib/server-utils";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { randomUUID } from "node:crypto";
import { profileApiValidation } from "@/lib/zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Update profile
export const PUT = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;

	// Prepare data
	const result = defaultResult("updated", 200);

	// Check JSON
	const json = await parseJsonBody(request);
	if (json instanceof NextResponse) return json;

	// Validate request
	const validationResult = profileApiValidation.safeParse({
		name: json.name,
		mail: json.mail,
		password: json.password,
		language: json.language,
	});
	if (!validationResult.success) {
		const validationError = validationResult.error;
		return badRequestResponse(validationError.issues, "validation");
	}
	const data = validationResult.data;

	// Prepare password
	const password = data.password ? await hash(data.password, 12) : undefined;

	// Check language
	if (data.language) {
		if (!["de", "en"].includes(data.language.toLowerCase()))
			return badRequestResponse(
				{ message: "Language not found" },
				"error-message",
			);
	}

	// Update the user
	try {
		const databaseResult = await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				// Invalidate all sessions
				validJwtId:
					data.name || data.mail || password ? randomUUID() : undefined,
				name: data.name ?? undefined,
				language: data.language ? data.language.toLowerCase() : undefined,
				email: data.mail ?? undefined,
				password: password,
			},
			select: {
				id: true,
				name: true,
				username: true,
				email: true,
				validJwtId: true,
				updatedAt: true,
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
