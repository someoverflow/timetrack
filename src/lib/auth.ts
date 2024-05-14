import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

import prisma from "@/lib/prisma";
import { compare } from "bcrypt";
import { cache } from "react";

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

class UserNotFound extends CredentialsSignin {
	code = "UserNotFound";
}
class InvalidPassword extends CredentialsSignin {
	code = "InvalidPassword";
}

export const { auth, handlers, signIn, signOut } = NextAuth({
	pages: {
		signIn: "/signin",
	},
	session: { strategy: "jwt" },

	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				username: {
					label: "Username",
					type: "text",
				},
				password: { label: "Password", type: "password" },
			},
			authorize: async (credentials) => {
				if (!credentials.username || !credentials.password) return null;
				const data = credentials as Record<"username" | "password", string>;

				// Check the user
				const user = await prisma.user.findUnique({
					where: {
						username: data.username,
					},
				});
				if (!user) throw new UserNotFound();

				// Check the password
				const isPasswordValid = await compare(data.password, user.password);
				if (!isPasswordValid) throw new InvalidPassword();

				return {
					id: `${user.id}`,
					username: user.username,
					name: user.name,

					email: user.email,
					role: user.role,

					validJwtId: user.validJwtId,
				};
			},
		}),
	],

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

			console.log(checkJwt);

			return token;
		},
	},
});

export const cachedAuth = cache(auth);
