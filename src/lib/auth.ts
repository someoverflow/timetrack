import NextAuth, { type DefaultSession } from "next-auth";
import authConfig from "./auth.config";

import prisma from "@/lib/prisma";

declare module "next-auth" {
	/**
	 * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user: {
			id: number;
			username: string;
			role: string;
			validJwtId: string;
		} & DefaultSession["user"];
	}
}

export const { auth, handlers, signIn, signOut } = NextAuth({
	pages: {
		signIn: "/signin",
	},
	session: { strategy: "jwt" },

	callbacks: {
		async session({ session, token }) {
			return {
				...session,
				user: {
					...session.user,
					// biome-ignore lint/suspicious/noExplicitAny: unknown
					id: token.id as any,
					name: token.name,
					username: token.username,
					role: token.role,
					validJwtId: token.validJwtId,
				},
			};
		},
		async jwt({ token, user, session, trigger }) {
			if (trigger === "update" && session?.name) {
				token.name = session.name;
				token.username = session.username;
			}

			if (user) {
				token.id = Number.parseInt(user.id ?? "");

				// biome-ignore lint/suspicious/noExplicitAny: Type differences
				token.username = (user as any).username;
				// biome-ignore lint/suspicious/noExplicitAny: Type differences
				token.role = (user as any).role;
				// biome-ignore lint/suspicious/noExplicitAny: Type differences
				token.validJwtId = (user as any).validJwtId;
			}

			// To invalidate the jwt
			if (token.username !== undefined) {
				const checkJwt = await prisma.user.findUnique({
					where: {
						username: token.username as string,
					},
					select: {
						validJwtId: true,
					},
				});
				if (!checkJwt) return null; // User may be deleted
				if (token.validJwtId !== checkJwt.validJwtId) return null; // Token is invalid
			}

			return token;
		},
	},

	...authConfig,
});
