import NextAuth, { type DefaultSession } from "next-auth";
import authConfig from "./auth.config";

import type { User } from "@prisma/client";
import prisma from "@/lib/prisma";

declare module "next-auth" {
	/**
	 * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user: {
			username: string;
			role: string;
			validJwtId: string;
		} & DefaultSession["user"];
	}
}

export const { auth, handlers, signIn, signOut } = NextAuth({
	pages: {
		signIn: "/signin",
		signOut: "/signout",
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
			if (
				trigger === "update" &&
				session?.name &&
				session?.username &&
				session?.email &&
				session?.validJwtId
			) {
				token.name = session.name;
				token.email = session.email;
				token.username = session.username;
				token.validJwtId = session.validJwtId;
			}

			if (user) {
				token.id = user.id;

				token.username = (user as User).username;
				token.role = (user as User).role;
				token.validJwtId = (user as User).validJwtId;
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
