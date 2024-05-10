import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
	NO_AUTH,
	BAD_REQUEST,
	NOT_ADMIN,
	checkAdminWithSession,
	FORBIDDEN,
} from "@/lib/server-utils";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { type NextRequest, NextResponse, userAgent } from "next/server";

export const MAX_PROJECTS = 100;

// Delete a project
export async function DELETE(request: NextRequest) {
	// Get server session and check if user is given
	const session = await getServerSession(authOptions);
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	// Create the default result
	let result: Partial<APIResult> = {
		success: true,
		status: 200,
	};

	// Process json request
	const json = await request.json().catch((e) => {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "JSON-Body could not be parsed"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	});
	if (json instanceof NextResponse) return json;

	// Check for the project id in the request
	if (json.id == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "ID is missing"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	// Get the data about the project
	const project = await prisma.project.findUnique({
		where: {
			id: json.id,
		},
		select: {
			id: true,
		},
	});

	// Check if the project exists
	if (!project) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			`Project with id ${json.id} could not be found`,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	// Execute database updates
	try {
		const [updateTimesResult, updateTodosResult, updateDeleteResult] =
			await prisma.$transaction([
				prisma.time.updateMany({
					where: {
						projectId: project.id,
					},
					data: {
						projectId: undefined,
					},
				}),
				prisma.todo.updateMany({
					where: {
						relatedProjectId: project.id,
					},
					data: {
						relatedProjectId: undefined,
					},
				}),
				prisma.project.delete({
					where: {
						id: project.id,
					},
				}),
			]);

		result.result = [updateDeleteResult, updateTimesResult, updateTodosResult];
	} catch (e) {
		// Handle prisma errors
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			result.success = false;
			result.status = 500;
			result.result = `${e.code} - ${e.message}`;
		} else throw e;
	}

	return NextResponse.json(result, { status: result.status });
}

// Create a project
export async function POST(request: NextRequest) {
	// Get server session and check if user is given
	const session = await getServerSession(authOptions);
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	// Create the default result
	let result: Partial<APIResult> = {
		success: true,
		status: 200,
	};

	// Process json request
	const json = await request.json().catch((e) => {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "JSON-Body could not be parsed"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	});
	if (json instanceof NextResponse) return json;

	// Check for given data
	if (json.name == null || json.userId == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			json.name == null ? "Project Name is missing" : undefined,
			json.userId == null ? "User is missing" : undefined,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	if (session.user.id !== Number.parseInt(json.userId)) {
		if (!checkAdminWithSession(session)) {
			return NextResponse.json(FORBIDDEN, {
				status: FORBIDDEN.status,
				statusText: FORBIDDEN.result,
			});
		}
	}

	const user = await prisma.user.findUnique({
		where: {
			id: json.userId,
		},
		select: {
			id: true,
			name: true,
			projects: true,
		},
	});
	if (!user) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "User not found"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	// Check if user exceeded the project limit
	if (user.projects.length >= MAX_PROJECTS) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			`You cannot have more than ${MAX_PROJECTS} projects.`,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	// Check if the given project name is empty
	if ((json.name as string).trim().length === 0) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "Project name is empty"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	// Check if the project exists
	if (
		user.projects.filter(
			(project) => project.name.toLowerCase() === json.name.toLowerCase(),
		).length !== 0
	) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			`Project with the name ${json.name} already exists`,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	// Create Project
	try {
		const res = await prisma.project.create({
			data: {
				id: json.id,
				name: json.name,
				userId: user.id,
			},
		});

		result.result = res;
	} catch (e) {
		// Handle prisma errors
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			result.success = false;
			result.status = 500;
			result.result = `${e.code} - ${e.message}`;
		} else throw e;
	}

	return NextResponse.json(result, { status: result.status });
}

// TODO: Rename a project
export async function PUT(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	const isAdmin = await checkAdminWithSession(session);
	if (!isAdmin)
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
				userId: Number.parseInt(json.userId),
			},
		})
		.catch((e) => {
			result.success = false;
			result.status = 500;
			return e.meta.cause;
		});

	return NextResponse.json(result, { status: result.status });
}
