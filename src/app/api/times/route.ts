import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { type NextRequest, NextResponse } from "next/server";

const NO_AUTH: APIResult = Object.freeze({
	success: false,
	status: 401,
	result: "Unauthorized",
});
const FORBIDDEN: APIResult = Object.freeze({
	success: false,
	status: 403,
	result: "Forbidden",
});
const BAD_REQUEST: APIResult = Object.freeze({
	success: false,
	status: 400,
	result: "Bad Request",
});

//     indicator
// Get current    timer
// Get all        timers
export async function GET(request: NextRequest) {
	const session = await getServerSession(authOptions);
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

	const userId = Number.parseInt(`${session.user.id}`);

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
}

// Create timer
export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);
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
			tag: true,
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
		console.log(result.result);

		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	});
	if (json instanceof NextResponse) return json;

	if (
		json.tag == null ||
		json.notes == null ||
		json.start == null ||
		json.end == null
	) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));

		result.result = [
			result.result,
			json.tag == null ? "Tag Missing" : undefined,
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

	let targetUser: number | undefined;
	if (user.tag === json.tag) targetUser = user.id;

	if (!targetUser) {
		targetUser = (
			await prisma.user
				.findUnique({
					where: {
						tag: json.tag,
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

	if (user?.role !== "admin" && targetUser !== user.id)
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
}

// Update timer
export async function PUT(request: NextRequest) {
	const session = await getServerSession(authOptions);
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
			tag: true,
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
		console.log(result.result);

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
				id: Number.parseInt(json.id),
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

	if (user?.role !== "admin" && user?.id !== timer?.userId)
		return NextResponse.json(FORBIDDEN, {
			status: FORBIDDEN.status,
			statusText: FORBIDDEN.result,
		});

	// TODO: Do this
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const data: any = {
		notes: json.notes,
	};

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
				id: Number.parseInt(json.id),
			},
			data: data,
		})
		.catch((e) => {
			result.success = false;
			result.status = 500;
			return e.meta.cause;
		});

	return NextResponse.json(result, { status: result.status });
}

// Delete timer
export async function DELETE(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	console.log(session);
	const user = await prisma.user.findUnique({
		where: {
			id: session.user.id,
		},
		select: {
			tag: true,
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
		console.log(result.result);

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
				id: Number.parseInt(json.id),
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

	if (user?.role !== "admin" && user?.id !== timer?.userId)
		return NextResponse.json(FORBIDDEN, {
			status: FORBIDDEN.status,
			statusText: FORBIDDEN.result,
		});

	result.result = await prisma.time
		.delete({
			where: {
				id: Number.parseInt(json.id),
			},
		})
		.catch((e) => {
			result.success = false;
			result.status = 500;
			return e.meta.cause;
		});

	return NextResponse.json(result, { status: result.status });
}
