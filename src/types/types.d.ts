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

type APIResult = {
	success: boolean;
	status: number;
} & (
	| {
			type: "unknown" | "ok" | "deleted" | "created" | "updated";
			// biome-ignore lint/suspicious/noExplicitAny:
			result?: any;
	  }
	| {
			type: "validation";
			result?: ZodIssue[];
	  }
	| {
			type: "error-message" | "duplicate-found" | "not-found" | "json-parsing";
			result?: { message: string; [key: string]: unknown };
	  }
);
