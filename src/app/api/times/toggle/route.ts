import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { type NextRequest, NextResponse } from "next/server";
import { NO_AUTH } from "@/lib/server-utils";

export async function PUT(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	const data = await prisma.time
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

	const result: APIResult = {
		success: true,
		status: 200,
		result: undefined,
	};

	const type = request.nextUrl.searchParams.get("type");
	const requestTime = request.nextUrl.searchParams.get("fixTime");

	let changeDate = new Date();
	if (requestTime) changeDate = new Date(Date.parse(requestTime));

	if (data == null || data.length === 0) {
		result.result = await prisma.time
			.create({
				data: {
					userId: session.user.id,
					start: changeDate,
					startType: type ? type : "API",
				},
			})
			.catch((e) => {
				result.success = false;
				result.status = 500;
				return e.meta.cause;
			});
	} else {
		const item = data[0];

		const timePassed = getTimePassed(item.start, changeDate);

		const result = await prisma.time
			.update({
				data: {
					end: changeDate,
					endType: type ? type : "API",
					time: timePassed,
				},
				where: {
					id: item.id,
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
