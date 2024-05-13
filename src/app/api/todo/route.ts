import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NO_AUTH, BAD_REQUEST } from "@/lib/server-utils";
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

	const dbData: Prisma.Without<
		Prisma.todoCreateInput,
		Prisma.todoUncheckedCreateInput
	> &
		Prisma.todoUncheckedCreateInput = {
		task: json.task,
	};

	// Check for description and if it is empty
	if (json.description) {
		dbData.description =
			(json.description as string).trim().length !== 0
				? json.description
				: null;
	}

	// Check for deadline
	if (json.deadline) {
		const deadline = new Date(Date.parse(json.deadline));
		dbData.deadline = deadline;
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

		dbData.assigneeId = checkAssignee.id;
	}

	// Create Todo
	try {
		const res = await prisma.todo.create({
			data: dbData,
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
