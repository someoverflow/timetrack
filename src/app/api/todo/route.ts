import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
	NO_AUTH,
	BAD_REQUEST,
	FORBIDDEN,
	parseJsonBody,
	defaultResult,
	NO_AUTH_RESPONSE,
	badRequestResponse,
	FORBIDDEN_RESPONSE,
} from "@/lib/server-utils";
import { todoCreateApiValidation, todoUpdateApiValidation } from "@/lib/zod";
import type { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

// Create a todo (task, description?, deadline?, assignees?)
/*{
	"task": 			<task>
	"description": 		<description?>
	"deadline": 		<Date?>
	"assignees": 		[<username>]?
	"projects": 		[<projectName>]?
}*/
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
	const validationResult = todoCreateApiValidation.safeParse({
		task: json.task,
		description: json.description,
		deadline: json.deadline,
		assignees: json.assignees,
		projects: json.projects,
	});
	if (!validationResult.success)
		return badRequestResponse(validationResult.error.issues, "validation");
	const data = validationResult.data;

	const createData: Prisma.Without<
		Prisma.TodoCreateInput,
		Prisma.TodoUncheckedCreateInput
	> &
		Prisma.TodoUncheckedCreateInput = {
		task: data.task,
		description: data.description,
		deadline: data.deadline ? new Date(data.deadline) : undefined,

		assignees: data.assignees
			? {
					connect: data.assignees.map((username) => ({ username: username })),
				}
			: undefined,

		relatedProjects: data.projects
			? {
					connect: data.projects.map((name) => ({ name: name })),
				}
			: undefined,

		creatorId: session.user.id ?? "",
	};

	// Create the todo
	try {
		const databaseResult = await prisma.todo.create({
			data: createData,
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

// Update a todo
/*

	/?type=<UPDATE(default) | START_PROGRESS | FINISH | ARCHIVE>

	// Changeable by creator & assignees when not archived
	{
		"task": 			<task?>
		"description": 		<description?>
		"deadline": 		<Date?>
		"assignees": {
			"add": 			[<username>]?
			"remove": 		[<username>]?
		}?
	}
*/
export const PUT = auth(async (request) => {
	// Check auth
	const session = request.auth;
	if (!session || !session.user) return NO_AUTH_RESPONSE;
	const isAdmin = session.user.role === "ADMIN";

	// Prepare data
	const result = defaultResult("updated");

	const searchParams = request.nextUrl.searchParams;
	const type = (searchParams.get("type") ?? "UPDATE").toUpperCase();

	// Check JSON
	const json = await parseJsonBody(request);
	if (json instanceof NextResponse) return json;

	// Validate request
	const validationResult = todoUpdateApiValidation.safeParse({
		id: json.id,
		task: json.task,
		description: json.description,
		deadline: json.deadline,
		assignees: json.assignees,
	});
	if (!validationResult.success)
		return badRequestResponse(validationResult.error.issues, "validation");
	const data = validationResult.data;

	// Check if the type can be handled
	if (!["UPDATE", "START_PROGRESS", "FINISH", "ARCHIVE"].includes(type))
		return badRequestResponse(
			"Request-Type cannot be processed.",
			"error-message",
		);

	// Get the todo
	const todo = await prisma.todo
		.findUnique({
			where: {
				id: data.id,
			},
			include: {
				assignees: {
					select: {
						id: true,
						name: true,
					},
				},
				creator: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})
		.catch(() => null);

	// Check if todo exists
	if (todo == null)
		return badRequestResponse(
			{
				id: data.id,
				message: "Todo does not exist.",
			},
			"not-found",
		);

	// Check if todo is archived (Archived projects cannot be changed anymore)
	if (todo.archived)
		return badRequestResponse(
			{
				id: data.id,
				message: "Todo is archived.",
			},
			"error-message",
		);

	// Prepare data
	const isByCreator = todo.creatorId === session.user.id;
	const isByAssignee = !!todo.assignees.find(
		(assignee) => assignee.id === session.user.id,
	);

	// Data can only be changed by creator and assignee
	if (!(isByCreator || isByAssignee))
		return badRequestResponse(
			{
				id: data.id,
				message: "Todos can only be changed by the creator or assignees.",
			},
			"error-message",
		);

	const updateData: Prisma.Without<
		Prisma.TodoUpdateInput,
		Prisma.TodoUncheckedUpdateInput
	> &
		Prisma.TodoUncheckedUpdateInput = {};

	switch (type) {
		case "UPDATE":
			updateData.task = data.task;
			updateData.description = data.description;
			updateData.deadline = data.deadline ? new Date(data.deadline) : undefined;

			if (data.assignees) {
				if (data.assignees.add) {
					updateData.assignees = {
						...updateData.assignees,
						connect: data.assignees.add.map((username) => ({
							username: username,
						})),
					};
				}
				if (data.assignees.remove) {
					updateData.assignees = {
						...updateData.assignees,
						connect: data.assignees.remove.map((username) => ({
							username: username,
						})),
					};
				}
			}
			break;

		case "START_PROGRESSING":
			if (todo.status === "IN_PROGRESS")
				return badRequestResponse(
					{
						id: data.id,
						message: "Todo is in progress.",
					},
					"error-message",
				);

			updateData.status = "IN_PROGRESS";
			break;

		case "FINISH":
			if (todo.status === "DONE")
				return badRequestResponse(
					{
						id: data.id,
						message: "Todo is done already.",
					},
					"error-message",
				);

			updateData.status = "DONE";
			break;

		case "ARCHIVE":
			if (!isByCreator)
				return badRequestResponse(
					{
						id: data.id,
						message: "Todos can only be archived by the creator.",
					},
					"error-message",
				);

			updateData.archived = true;
			break;
	}

	// Update Todo Data
	try {
		const databaseResult = await prisma.todo.update({
			where: {
				id: todo.id,
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
