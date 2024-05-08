import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validatePassword } from "@/lib/utils";
import { hash } from "bcrypt";
import { getServerSession } from "next-auth";
import { type NextRequest, NextResponse } from "next/server";

const NO_AUTH: APIResult = Object.freeze({
	success: false,
	status: 401,
	result: "Unauthorized",
});

const BAD_REQUEST: APIResult = Object.freeze({
	success: false,
	status: 400,
	result: "Bad Request",
});

// Update profile
export async function PUT(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user)
		return NextResponse.json(NO_AUTH, {
			status: NO_AUTH.status,
			statusText: NO_AUTH.result,
		});

	let result: APIResult = {
		success: true,
		status: 200,
		result: undefined,
	};

	const json = await request.json().catch(() => {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));
		result.result = [result.result, "JSON Body could not be parsed"];
		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	});
	if (json instanceof NextResponse) return json;

	const containsName = json.name != null;
	const containsMail = json.mail != null;
	const containsPassword = json.password != null;

	if (!(containsName || containsMail || containsPassword)) {
		result = JSON.parse(JSON.stringify(BAD_REQUEST));
		result.result = [result.result, "Data missing (name, mail or password)"];
		return NextResponse.json(result, {
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		});
	}

	const data: {
		password: string | undefined;
		name: string | undefined;
		email: string | undefined;
	} = {
		password: undefined,
		name: undefined,
		email: undefined,
	};

	if (containsName) {
		const name: string = json.name;
		if (name.trim() === "") {
			result = JSON.parse(JSON.stringify(BAD_REQUEST));
			result.result = [result.result, "Your name should not be empty..."];
			return NextResponse.json(result, {
				status: BAD_REQUEST.status,
				statusText: BAD_REQUEST.result,
			});
		}
		data.name = name;
	}
	if (containsMail) data.email = json.mail;
	if (containsPassword) {
		const password: string = json.password;

		if (!validatePassword(password)) {
			result = JSON.parse(JSON.stringify(BAD_REQUEST));
			result.result = [
				result.result,
				"Invalid Password (8-20 chars, a-z, A-Z, 0-9)",
			];
			return NextResponse.json(result, {
				status: BAD_REQUEST.status,
				statusText: BAD_REQUEST.result,
			});
		}

		data.password = await hash(password, 12);
	}

	const res = await prisma.user
		.update({
			where: {
				id: session.user.id,
			},
			data: data,
			select: {
				id: true,
				updatedAt: true,
			},
		})
		.catch((e) => {
			result.success = false;
			result.status = 500;
			return `System error "${e.message}"`;
		});
	result.result = res;

	return NextResponse.json(result, { status: result.status });
}
