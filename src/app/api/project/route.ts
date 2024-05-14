import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NO_AUTH, BAD_REQUEST, NOT_ADMIN, FORBIDDEN } from "@/lib/server-utils";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

// Create a project
// TODO: Description
export const POST = auth(async (request) => {
	// Check if user is given in session
	const session = request.auth;
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
	if (json.name == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "Project Name is missing"];

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

	// Create Project
	try {
		const res = await prisma.project.create({
			data: {
				name: json.name,
				users: {
					connect: {
						id: session.user.id,
					},
				},
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
});

// TODO: Update a project
// update: name, description, users
// merge: id
export const PUT = auth(async (request) => {
	// Check if user is given in session
	const session = request.auth;
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	throw new Error("Not implemented");
});

// Delete a project
export const DELETE = auth(async (request) => {
	// Check if user is given in session
	const session = request.auth;
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	// Check for admin
	if (session.user.role !== "ADMIN")
		return NextResponse.json(NOT_ADMIN, {
			status: NOT_ADMIN.status,
			statusText: NOT_ADMIN.result,
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
		const deleteResult = await prisma.project.delete({
			where: {
				id: project.id,
			},
		});

		result.result = deleteResult;
	} catch (e) {
		// Handle prisma errors
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			result.success = false;
			result.status = 500;
			result.result = `${e.code} - ${e.message}`;
		} else throw e;
	}

	return NextResponse.json(result, { status: result.status });
});
