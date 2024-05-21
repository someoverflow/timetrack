import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
	NO_AUTH_RESPONSE,
	NOT_ADMIN_RESPONSE,
	defaultResult,
	parseJsonBody,
	badRequestResponse,
	FORBIDDEN_RESPONSE,
} from "@/lib/server-utils";
import {
	nanoIdValidation,
	projectCreateApiValidation,
	projectUpdateApiValidation,
} from "@/lib/zod";
import type { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

// Create a project
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
	const validationResult = projectCreateApiValidation.safeParse({
		name: json.name,
		description: json.description,
		userId: json.userId,
	});
	if (!validationResult.success) {
		const validationError = validationResult.error;
		return badRequestResponse(validationError.issues, "validation");
	}
	const data = validationResult.data;

	// Prepare the users to connect
	let toConnect = [{ id: session.user.id }];
	if (data.users && session.user.role === "ADMIN")
		toConnect = [...toConnect, ...data.users.map((userId) => ({ id: userId }))];

	// Create the project
	try {
		const databaseResult = await prisma.project.create({
			data: {
				name: data.name,
				description: data.description ?? undefined,
				users: {
					connect: toConnect,
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

// Update a project
/* {
	"id":			<id>
	"name":			<name?>
	"description":	<description?>

	--- ADMINS: ---
	"users":
		{
			add: 	[<id>]? 
			remove: [<id>]? 
		}?
	TODO: "merge":		<id?>
} */
export const PUT = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;
	const isAdmin = session.user.role === "ADMIN";

	// Prepare data
	const result = defaultResult("updated");

	// Check JSON
	const json = await parseJsonBody(request);
	if (json instanceof NextResponse) return json;

	// Validate request
	const validationResult = projectUpdateApiValidation.safeParse({
		id: json.id,
		userId: json.userId,
	});
	if (!validationResult.success) {
		const validationError = validationResult.error;
		return badRequestResponse(validationError.issues, "validation");
	}
	const data = validationResult.data;

	if (!isAdmin && (data.merge || data.users)) return FORBIDDEN_RESPONSE;

	let updateData: Prisma.XOR<
		Prisma.ProjectUpdateInput,
		Prisma.ProjectUncheckedUpdateInput
	> = {
		id: data.id,
		name: data.name,
		description: data.description ?? undefined,
	};

	if (data.users) {
		if (data.users.add) {
			updateData = {
				...updateData,
				users: {
					...updateData.users,
					connect: data.users.add.map((userId) => ({ id: userId })),
				},
			};
		}
		if (data.users.remove) {
			updateData = {
				...updateData,
				users: {
					...updateData.users,
					disconnect: data.users.remove.map((userId) => ({ id: userId })),
				},
			};
		}
	}

	// Update the project
	try {
		const databaseResult = await prisma.project.update({
			where: {
				id: data.id,
				users: {
					some: {
						id: session.user.id,
					},
				},
			},
			data: updateData,
		});

		result.result = databaseResult;
		return NextResponse.json(result, { status: result.status });
	} catch (e) {
		if (e instanceof PrismaClientKnownRequestError) {
			switch (e.code) {
				// TODO: Check currently unchecked errors
				case "P2025":
					console.error("project: ", e);
					return badRequestResponse(
						{
							id: data.id,
							message: "Project does not exist.",
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

// Delete a project
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
	if (!validationResult.success)
		return badRequestResponse(validationResult.error.issues, "validation");
	const id = validationResult.data;

	// Delete the project
	try {
		const databaseResult = await prisma.project.delete({
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
							message: "Project does not exist.",
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
