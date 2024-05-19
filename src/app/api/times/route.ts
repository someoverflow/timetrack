import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { NextResponse } from "next/server";
import {
	FORBIDDEN,
	NO_AUTH_RESPONSE,
	defaultResult,
	parseJsonBody,
	badRequestResponse,
} from "@/lib/server-utils";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import {
	nanoIdValidation,
	timesGetApiValidation,
	timesPostApiValidation,
	timesPutApiValidation,
} from "@/lib/zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Get time/times
/*  
	/?<all>=true
	/?periodFrom=""&periodTo=""  DateTimes (ISO)
*/
export const GET = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;

	// Prepare data
	const result = defaultResult("ok");

	// Check JSON
	const searchParams = request.nextUrl.searchParams;
	const allSearch = searchParams.get("all");
	const periodFrom = searchParams.get("periodFrom");
	const periodTo = searchParams.get("periodTo");

	// Validate request
	const validationResult = timesGetApiValidation.safeParse({
		all: allSearch ?? undefined,
		period:
			periodFrom && periodTo
				? {
						from: periodFrom,
						to: periodTo,
					}
				: undefined,
	});
	if (!validationResult.success)
		return badRequestResponse(validationResult.error.issues, "validation");
	const data = validationResult.data;

	// Return the current time
	if (!data.all && !data.period) {
		// Get the latest time entry
		try {
			const databaseResult = await prisma.time.findFirst({
				orderBy: {
					id: "desc",
				},
				where: {
					userId: session.user.id,
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
	}

	// Return all times
	if (data.all || !data.period) {
		try {
			const databaseResult = await prisma.time.findMany({
				orderBy: {
					id: "desc",
				},
				where: {
					userId: session.user.id,
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
	}

	try {
		const databaseResult = await prisma.time.findMany({
			orderBy: {
				id: "desc",
			},
			where: {
				userId: session.user.id,
				start: {
					lte: data.period.from,
					gte: data.period.to,
				},
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

// Create timer
export const POST = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;

	// Prepare data
	const result = defaultResult("created", 201);

	// Check JSON
	const json = await parseJsonBody(request);
	if (json instanceof NextResponse) return json;

	// Validate request
	const validationResult = timesPostApiValidation.safeParse({
		userId: json.id,

		notes: json.notes,

		project: json.project,

		start: json.start,
		end: json.end,

		startType: json.startType,
		endType: json.endType,
	});
	if (!validationResult.success)
		return badRequestResponse(validationResult.error.issues, "validation");
	const data = validationResult.data;

	// Check if user is given
	if (data.userId) {
		if (data.userId !== session.user.id && session.user.role !== "ADMIN")
			return NextResponse.json(FORBIDDEN, {
				status: FORBIDDEN.status,
				statusText: FORBIDDEN.result,
			});
	}

	// Check if user is included in project when given
	if (data.project) {
		try {
			const project = await prisma.project.findUniqueOrThrow({
				where: {
					id: data.project,
					users: {
						some: {
							id: data.userId ?? session.user.id,
						},
					},
				},
			});
			data.project = project.id;
		} catch {
			return badRequestResponse(
				{
					id: data.project,
					message: "Project not available.",
				},
				"not-found",
			);
		}
	}

	// Prepare passed time
	const timePassed = getTimePassed(new Date(data.start), new Date(data.end));

	// Create the time entry
	try {
		const databaseResult = await prisma.time.create({
			data: {
				userId: data.userId ?? session.user.id,
				projectId: data.project,
				notes: data.notes,
				start: data.start,
				end: data.end,
				startType: data.startType ?? "API",
				endType: data.endType ?? "API",
				time: timePassed,
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

// Update timer
export const PUT = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;

	// Prepare data
	const result = defaultResult("updated");

	// Check JSON
	const json = await parseJsonBody(request);
	if (json instanceof NextResponse) return json;

	// Validate request
	const validationResult = timesPutApiValidation.safeParse({
		id: json.id,

		notes: json.notes,

		project: json.project,

		start: json.start,
		end: json.end,

		startType: json.startType,
		endType: json.endType,
	});
	if (!validationResult.success)
		return badRequestResponse(validationResult.error.issues, "validation");
	const data = validationResult.data;

	// Check the time entry
	try {
		const databaseResult = await prisma.time.findUnique({
			where: {
				id: data.id,
			},
			include: {
				user: {
					select: {
						projects: {
							where: {
								id: data.project,
							},
						},
					},
				},
			},
		});

		if (!databaseResult)
			return badRequestResponse(
				"Entry with the given id not found",
				"not-found",
			);

		if (
			databaseResult.userId !== session.user.id &&
			session.user.role !== "ADMIN"
		)
			return NextResponse.json(FORBIDDEN, {
				status: FORBIDDEN.status,
				statusText: FORBIDDEN.result,
			});

		if (data.project && databaseResult.user?.projects.length === 0)
			return badRequestResponse(
				"Project with the given id not found",
				"not-found",
			);
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

	const updateData: Prisma.XOR<
		Prisma.TimeUpdateInput,
		Prisma.TimeUncheckedUpdateInput
	> = {
		projectId: data.project,
		notes: data.notes,
	};

	if (data.start && data.end) {
		const timePassed = getTimePassed(new Date(data.start), new Date(data.end));

		updateData.start = data.start;
		updateData.end = data.end;
		updateData.time = timePassed;

		updateData.startType = data.startType ?? "API";
		updateData.endType = data.endType ?? "API";
	}

	// Update the entry
	try {
		const databaseResult = await prisma.time.update({
			where: {
				id: data.id,
			},
			data: updateData,
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

// Delete timer
export const DELETE = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;

	// Prepare data
	const result = defaultResult("deleted");

	// Check JSON
	const json = await parseJsonBody(request);
	if (json instanceof NextResponse) return json;

	// Validate request
	const validationResult = nanoIdValidation.safeParse(json.id);
	if (!validationResult.success)
		return badRequestResponse(validationResult.error.issues, "validation");
	const id = validationResult.data;

	// Check the time entry
	try {
		const databaseResult = await prisma.time.findUnique({
			where: {
				id: id,
			},
		});

		if (!databaseResult)
			return badRequestResponse(
				"Entry with the given id not found",
				"not-found",
			);

		if (
			databaseResult.userId !== session.user.id &&
			session.user.role !== "ADMIN"
		)
			return NextResponse.json(FORBIDDEN, {
				status: FORBIDDEN.status,
				statusText: FORBIDDEN.result,
			});
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

	// Delete the entry
	try {
		const databaseResult = await prisma.time.delete({
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
