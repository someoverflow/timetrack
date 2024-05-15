export const NO_AUTH: APIResult = Object.freeze({
	success: false,
	status: 401,
	result: "Not authenticated",
});
export const NOT_ADMIN: APIResult = Object.freeze({
	success: false,
	status: 403,
	result: "Forbidden",
});

export const BAD_REQUEST: APIResult = Object.freeze({
	success: false,
	status: 400,
	result: "Bad Request",
});
export const FORBIDDEN: APIResult = Object.freeze({
	success: false,
	status: 403,
	result: "Forbidden",
});
