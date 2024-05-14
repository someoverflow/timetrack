import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { NextResponse } from "next/server";
import { NO_AUTH, BAD_REQUEST, FORBIDDEN } from "@/lib/server-utils";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

//     indicator
// Get current    timer
// Get all        timers
export const GET = auth(async (request) => {
	const session = request.auth;
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	const indicator = request.nextUrl.searchParams.get("indicator");

	const result: APIResult = {
		success: true,
		status: 200,
		result: undefined,
	};

	const userId = session.user.id;

	if (indicator === "current") {
		result.result = await prisma.time
			.findMany({
				take: 1,
				orderBy: {
					id: "desc",
				},
				where: {
					userId: userId,
					end: null,
				},
			})
			.catch((e) => {
				result.success = false;
				result.status = 500;
				return e.meta.cause;
			});
	} else {
		result.result = await prisma.time
			.findMany({
				orderBy: {
					id: "desc",
				},
				where: {
					userId: userId,
				},
			})
			.catch((e) => {
				result.success = false;
				result.status = 500;
				return e.meta.cause;
			});
	}

	return NextResponse.json(result, { status: result.status });
});

// Create timer
export const POST = auth(async (request) => {
	const session = request.auth;
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	const user = await prisma.user.findUnique({
		where: {
			id: session.user.id,
		},
		select: {
			username: true,
			role: true,
			id: true,
		},
	});

	if (user == null)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
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

	if (
		json.username == null ||
		json.notes == null ||
		json.start == null ||
		json.end == null
	) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			json.username == null ? "Username Missing" : undefined,
			json.notes == null ? "Notes Missing" : undefined,
			json.start == null ? "Start Missing" : undefined,
			json.end == null ? "End Missing" : undefined,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const startDate = new Date(Date.parse(json.start));
	const endDate = new Date(Date.parse(json.end));
	if (endDate < startDate) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "The end time is before the start time"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const timePassed = getTimePassed(startDate, endDate);

	let targetUser: string | undefined;
	if (user.username === json.username) targetUser = user.id;

	if (!targetUser) {
		targetUser = (
			await prisma.user
				.findUnique({
					where: {
						username: json.username,
					},
					select: {
						id: true,
					},
				})
				.catch(() => undefined)
		)?.id;
	}

	if (!targetUser) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "User not found"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	if (user?.role !== "ADMIN" && targetUser !== user.id)
		return NextResponse.json(FORBIDDEN, {
			status: FORBIDDEN.status,
			statusText: FORBIDDEN.result,
		});

	result.result = await prisma.time
		.create({
			data: {
				userId: targetUser,
				notes: json.notes,
				start: startDate,
				end: endDate,
				startType: json.startType ? json.startType : "API",
				endType: json.endType ? json.endType : "API",
				time: timePassed,
			},
		})
		.catch((e) => {
			result.success = false;
			result.status = 500;
			return e.meta.cause;
		});

	return NextResponse.json(result, { status: result.status });
});

// Update timer
export const PUT = auth(async (request) => {
	const session = request.auth;
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	const user = await prisma.user.findUnique({
		where: {
			id: session.user.id,
		},
		select: {
			id: true,
			username: true,
			role: true,
		},
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

	if (json.id == null || json.notes == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			json.id == null ? "ID Missing" : undefined,
			json.notes == null ? "Notes Missing" : undefined,
		];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const timer = await prisma.time
		.findUnique({
			where: {
				id: json.id,
			},
			include: {
				user: {
					select: {
						id: true,
						projects: {
							select: {
								id: true,
							},
						},
					},
				},
			},
		})
		.catch(() => null);

	if (timer == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "Timer not found"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	if (!timer.user) throw Error("User cannot be null");

	if (user?.role !== "ADMIN" && user?.id !== timer.user?.id)
		return NextResponse.json(FORBIDDEN, {
			status: FORBIDDEN.status,
			statusText: FORBIDDEN.result,
		});

	const data: Prisma.XOR<
		Prisma.TimeUpdateInput,
		Prisma.TimeUncheckedUpdateInput
	> = {
		notes: json.notes,
	};

	if (json.projectId === null) data.projectId = null;

	if (json.projectId) {
		for (const { id } of timer.user.projects) {
			if (id === json.projectId) data.projectId = id;
		}
	}

	if (json.start && json.end) {
		const startDate = new Date(Date.parse(json.start));
		const endDate = new Date(Date.parse(json.end));

		if (endDate < startDate) {
			result = JSON.parse(JSON.stringify(BAD_REQUEST));

			result.result = [result.result, "The end time is before the start time"];

			return NextResponse.json(result, {
				status: BAD_REQUEST.status,
				statusText: BAD_REQUEST.result,
			});
		}

		const timePassed = getTimePassed(startDate, endDate);

		if (startDate.getTime() !== timer?.start.getTime()) {
			data.start = startDate;
			data.startType = json.startType ? json.startType : "API";
		}

		if (endDate.getTime() !== timer?.end?.getTime()) {
			data.end = endDate;
			data.endType = json.endType ? json.endType : "API";
		}

		data.time = timePassed;
	}

	result.result = await prisma.time
		.update({
			where: {
				id: json.id,
			},
			data: data,
		})
		.catch((e) => {
			result.success = false;
			result.status = 500;
			return e.meta.cause;
		});

	return NextResponse.json(result, { status: result.status });
});

// Delete timer
export const DELETE = auth(async (request) => {
	const session = request.auth;
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	const user = await prisma.user.findUnique({
		where: {
			id: session.user.id,
		},
		select: {
			username: true,
			id: true,
			role: true,
		},
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

	if (json.id == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, json.id == null ? "ID Missing" : undefined];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const timer = await prisma.time
		.findUnique({
			where: {
				id: json.id,
			},
		})
		.catch(() => null);

	if (timer == null) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [result.result, "Timer not found"];

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	if (user?.role !== "ADMIN" && user?.id !== timer?.userId)
		return NextResponse.json(FORBIDDEN, {
			status: FORBIDDEN.status,
			statusText: FORBIDDEN.result,
		});

	result.result = await prisma.time
		.delete({
			where: {
				id: json.id,
			},
		})
		.catch((e) => {
			result.success = false;
			result.status = 500;
			return e.meta.cause;
		});

	return NextResponse.json(result, { status: result.status });
});
