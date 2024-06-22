interface Timer {
	id: string;

	user: string;

	start: string;
	startType: string | null;
	end: string | null;
	endType: string | null;

	time: string | null;
	notes: string | null;
	state: string | null;
}

type APIResultType =
	| "unknown"
	// No Success
	| "validation"
	| "json-parsing"
	| "error-message"
	| "not-found"
	| "duplicate-found"
	// Success
	| "ok"
	| "deleted"
	| "created"
	| "updated";

interface APIResult {
	success: boolean;
	status: number;
	type: APIResultType;
	// biome-ignore lint/suspicious/noExplicitAny: API Result Data can be anything
	result?: any;
}
