interface Timer {
	id: number;

	user: string;

	start: string;
	startType: string | null;
	end: string | null;
	endType: string | null;

	time: string | null;
	notes: string | null;
	state: string | null;
}

interface APIResult {
	success: boolean;
	status: number;
	// biome-ignore lint/suspicious/noExplicitAny: API Result Data can be anything
	result: any;
}
