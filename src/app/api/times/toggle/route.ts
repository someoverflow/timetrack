import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { NextResponse } from "next/server";
import {
	NO_AUTH,
	NO_AUTH_RESPONSE,
	badRequestResponse,
	defaultResult,
} from "@/lib/server-utils";
import { auth } from "@/lib/auth";
import { timesToggleApiValidation } from "@/lib/zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const PUT = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;

	// Prepare data
	const result = defaultResult("updated");

	// Validate request
	const validationResult = timesToggleApiValidation.safeParse({
		type: request.nextUrl.searchParams.get("type") ?? undefined,
		fixTime: request.nextUrl.searchParams.get("fixTime") ?? undefined,
	});
	if (!validationResult.success)
		return badRequestResponse(validationResult.error.issues, "validation");
	const data = validationResult.data;

	const databaseResult = await prisma.time
		.findMany({
			take: 1,
			orderBy: {
				id: "desc",
			},
			where: {
				userId: session.user.id,
				end: null,
			},
		})
		.catch(() => null);

	try {
		if (databaseResult == null || databaseResult.length === 0) {
			const createResult = await prisma.time.create({
				data: {
					userId: session.user.id,
					start: data.fixTime ?? new Date(),
					startType: data.type ?? "API",
				},
			});
			result.result = createResult;
		} else {
			const changeDate = data.fixTime ? new Date(data.fixTime) : new Date();
			const timePassed = getTimePassed(databaseResult[0].start, changeDate);

			const updateResult = await prisma.time.update({
				data: {
					time: timePassed,
					end: changeDate,
					endType: data.type ?? "API",
				},
				where: {
					id: databaseResult[0].id,
				},
			});
			result.result = updateResult;
		}

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
