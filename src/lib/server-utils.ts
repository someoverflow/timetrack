import type { NextAuthRequest } from "next-auth/lib";
import { NextResponse } from "next/server";

//#region Results
const NO_AUTH: APIResult = {
	success: false,
	status: 401,
	type: "unknown",
	result: "Not authenticated",
};
const NOT_ADMIN: APIResult = {
	success: false,
	status: 403,
	type: "unknown",
	result: "Forbidden",
};
const BAD_REQUEST: APIResult = {
	success: false,
	status: 400,
	type: "unknown",
	result: "Bad Request",
};
const FORBIDDEN: APIResult = {
	success: false,
	status: 403,
	type: "unknown",
	result: "Forbidden",
};
//#endregion
//#region Responses
export const NO_AUTH_RESPONSE = NextResponse.json(NO_AUTH, {
	status: NO_AUTH.status,
	statusText: NO_AUTH.result,
});

export const NOT_ADMIN_RESPONSE = NextResponse.json(NOT_ADMIN, {
	status: NOT_ADMIN.status,
	statusText: NOT_ADMIN.result,
});
export const FORBIDDEN_RESPONSE = NextResponse.json(FORBIDDEN, {
	status: FORBIDDEN.status,
	statusText: FORBIDDEN.result,
});
//#endregion

export const defaultResult = (
	type?: APIResultType,
	status?: number,
): APIResult => {
	return {
		success: true,
		status: status ?? 200,
		type: type ?? "unknown",
	};
};

export const badRequestResponse = (result: unknown, type?: APIResultType) => {
	return NextResponse.json(
		{ ...BAD_REQUEST, type: type ?? "unknown", result: result },
		{
			status: BAD_REQUEST.status,
			statusText: BAD_REQUEST.result,
		},
	);
};

export const parseJsonBody = async (request: NextAuthRequest) => {
	try {
		const result = await request.json();
		return result;
	} catch (ignored) {
		return badRequestResponse(
			{ message: "JSON Body could not be parsed" },
			"json-parsing",
		);
	}
};
