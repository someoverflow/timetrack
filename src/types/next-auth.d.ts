import type { DefaultSession } from "next-auth";

declare module "next-auth" {
	interface Session {
		user: {
			id: number;
			tag: string;
			role: string;
		} & DefaultSession["user"];
	}
}
