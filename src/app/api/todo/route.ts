import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NO_AUTH, BAD_REQUEST, FORBIDDEN } from "@/lib/server-utils";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { type NextRequest, NextResponse } from "next/server";

// Create a todo (task, description?, deadline?, assignee?)
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
	if (json.task == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			json.task == null ? "The task for the todo is missing" : undefined,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	// Check if the task is empty
	if ((json.task as string).trim().length === 0) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			json.task == null ? "The task cannot be empty" : undefined,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const createData: Prisma.Without<
		Prisma.todoCreateInput,
		Prisma.todoUncheckedCreateInput
	> &
		Prisma.todoUncheckedCreateInput = {
		task: json.task,
	};

	// Check for description and if it is empty
	if (json.description) {
		createData.description =
			(json.description as string).trim().length !== 0
				? json.description
				: null;
	}

	// Check for deadline
	if (json.deadline) {
		const deadline = new Date(Date.parse(json.deadline));
		createData.deadline = deadline;
	}

	// Check for assignee
	if (json.assigneeId) {
		const assigneeId: number = Number.parseInt(json.assigneeId);

		const checkAssignee = await prisma.user.findUnique({
			where: {
				id: assigneeId,
			},
			select: {
				id: true,
				name: true,
			},
		});

		if (checkAssignee === null) {
			result = JSON.parse(JSON.stringify(BAD_REQUEST));

			result.result = [
				result.result,
				json.task == null
					? `The user with the id ${assigneeId} could not be found`
					: undefined,
			];

			return NextResponse.json(result, {
				status: BAD_REQUEST.status,
				statusText: BAD_REQUEST.result,
			});
		}

		createData.assigneeId = checkAssignee.id;
	}

	// Create Todo
	try {
		const res = await prisma.todo.create({
			data: createData,
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

// Update a todo
// (type, id)
// UPDATE 				(task?, description?, deadline?, assignee?)
// START_PROGRESS
// FINISH
// ARCHIVE
export async function PUT(request: NextRequest) {
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

	// Check the json data
	if (json.type == null || json.id == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			json.type == null ? "The request type is missing" : undefined,
			json.id == null ? "The todo id is missing" : undefined,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const requestType: string = json.type;

	// Check if the type can be handled
	if (
		!["UPDATE", "START_PROGRESS", "FINISH", "ARCHIVE"].includes(
			requestType.toUpperCase(),
		)
	) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "The request type cannot be processed"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	// Get the todo
	const todo = await prisma.todo.findUnique({
		where: {
			id: json.id,
		},
		include: {
			assignee: {
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
	});

	// Check if todo exists
	if (todo == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			`The todo with the id ${json.id} could not be found`,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	// Archived projects cannot be changed anymore
	if (todo.archived) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));
		result.result = [result.result, "Todo is already archived"];
		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const isByCreator = todo.creatorId === session.user.id;
	const isByAssignee = todo.assigneeId === session.user.id;

	const updateData: Prisma.Without<
		Prisma.todoUpdateInput,
		Prisma.todoUncheckedUpdateInput
	> &
		Prisma.todoUncheckedUpdateInput = {};

	switch (requestType.toUpperCase()) {
		case "UPDATE":
			// UPDATE 				(task?, description?, deadline?, assignee?)

			// Check for data
			if (!(json.task || json.description || json.deadline || json.assignee)) {
				result.result = [result.result, "Nothing has changed"];
				return NextResponse.json(result, { status: result.status });
			}

			// Check the data
			// Can be changed by creator and assignee
			if (
				!(isByCreator || isByAssignee) &&
				(json.task || json.description || json.deadline)
			) {
				result = JSON.parse(JSON.stringify(FORBIDDEN));
				result.result = [
					result.result,
					"Task, Description and Deadline can only be changed by the creator or assignee",
				];
				return NextResponse.json(result, {
					status: FORBIDDEN.status,
					statusText: FORBIDDEN.result,
				});
			}

			if (json.task) {
				const task: string = json.task;
				if (task.trim().length === 0) {
					result = JSON.parse(JSON.stringify(BAD_REQUEST));
					result.result = [result.result, "Task cannot be empty"];
					return NextResponse.json(result, {
						status: BAD_REQUEST.status,
						statusText: BAD_REQUEST.result,
					});
				}
				updateData.task = task.trim();
			}
			if (json.description) {
				const description: string = json.task;
				if (description.trim().length === 0) updateData.description = null;
				else updateData.task = description.trim();
			}
			if (json.deadline) {
				const deadline = new Date(Date.parse(json.deadline));
				updateData.deadline = deadline;
			}
			// Can only be changed by creator
			if (json.assignee) {
				if (!isByCreator) {
					result = JSON.parse(JSON.stringify(FORBIDDEN));
					result.result = [
						result.result,
						"The assigned user can only be changed by the task creator",
					];
					return NextResponse.json(result, {
						status: FORBIDDEN.status,
						statusText: FORBIDDEN.result,
					});
				}

				const assigneeId = Number.parseInt(json.assigneeId);

				const checkAssignee = await prisma.user.findUnique({
					where: {
						id: assigneeId,
					},
					select: {
						id: true,
						name: true,
					},
				});

				if (checkAssignee === null) {
					result = JSON.parse(JSON.stringify(BAD_REQUEST));

					result.result = [
						result.result,
						json.task == null
							? `The user with the id ${assigneeId} could not be found`
							: undefined,
					];

					return NextResponse.json(result, {
						status: BAD_REQUEST.status,
						statusText: BAD_REQUEST.result,
					});
				}

				updateData.assigneeId = assigneeId;
			}
			break;

		case "START_PROGRESSING":
			if (todo.inProgress || todo.done) {
				result = JSON.parse(JSON.stringify(BAD_REQUEST));
				result.result = [
					result.result,
					todo.inProgress ? "Todo is already in progress" : undefined,
					todo.inProgress ? "Todo is done already" : undefined,
				];
				return NextResponse.json(result, {
					status: BAD_REQUEST.status,
					statusText: BAD_REQUEST.result,
				});
			}

			if (!(isByCreator || isByAssignee)) {
				result = JSON.parse(JSON.stringify(FORBIDDEN));
				result.result = [
					result.result,
					"Todo-State can only be changed by the creator or assignee",
				];
				return NextResponse.json(result, {
					status: FORBIDDEN.status,
					statusText: FORBIDDEN.result,
				});
			}

			updateData.inProgress = true;
			break;

		case "FINISH":
			if (todo.done) {
				result = JSON.parse(JSON.stringify(BAD_REQUEST));
				result.result = [
					result.result,
					todo.inProgress ? "Todo is done already" : undefined,
				];
				return NextResponse.json(result, {
					status: BAD_REQUEST.status,
					statusText: BAD_REQUEST.result,
				});
			}

			if (!(isByCreator || isByAssignee)) {
				result = JSON.parse(JSON.stringify(FORBIDDEN));
				result.result = [
					result.result,
					"Todo-State can only be changed by the creator or assignee",
				];
				return NextResponse.json(result, {
					status: FORBIDDEN.status,
					statusText: FORBIDDEN.result,
				});
			}

			updateData.inProgress = false;
			updateData.done = true;
			break;

		case "ARCHIVE":
			if (!isByCreator) {
				result = JSON.parse(JSON.stringify(FORBIDDEN));
				result.result = [
					result.result,
					"The todo can only be archived by the creator",
				];
				return NextResponse.json(result, {
					status: FORBIDDEN.status,
					statusText: FORBIDDEN.result,
				});
			}

			updateData.inProgress = false;
			updateData.done = true;
			updateData.archived = true;
			break;
	}

	// Update Todo Data
	try {
		const res = await prisma.todo.update({
			where: {
				id: todo.id,
			},
			data: updateData,
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
