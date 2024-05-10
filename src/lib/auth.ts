import type { NextAuthOptions } from "next-auth";

import prisma from "@/lib/prisma";
import { compare } from "bcrypt";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
	pages: {
		signIn: "/signin",
	},
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				username: {
					label: "Username",
					type: "text",
					placeholder: "Type here...",
				},
				password: { label: "Password", type: "password", placeholder: "..." },
			},
			async authorize(credentials, req) {
				if (!credentials?.username || !credentials?.password) return null;

				const user = await prisma.user.findUnique({
					where: {
						tag: credentials.username,
					},
				});

				if (!user) return null;

				const isPasswordValid = await compare(
					credentials.password,
					user.password,
				);

				if (!isPasswordValid) return null;

				return {
					id: `${user.id}`,
					tag: user.tag,
					name: user.name,
					email: user.email,
					role: user.role,
				};
			},
		}),
	],
	session: {
		maxAge: 30 * 24 * 60 * 60, // 3 Days
	},
	callbacks: {
		async session({ session, token }) {
			session.user.id = token.id as number;
			session.user.name = token.name as string;
			session.user.tag = token.tag as string;
			session.user.role = token.role as string;

			try {
				const user = await prisma.user.findUniqueOrThrow({
					where: {
						id: session.user.id,
					},
				});
				if (
					!user ||
					user.tag !== session.user.tag ||
					user.role !== session.user.role ||
					user.email !== session.user.email
				)
					return { expires: "", user: undefined };
			} catch (e) {
				return { expires: "", user: undefined };
			}

			return session;
		},
		jwt({ token, user, session, trigger }) {
			if (trigger === "update" && session?.name) {
				token.name = session.name;
			}

			if (user) {
				token.id = Number.parseInt(user.id);

				// biome-ignore lint/suspicious/noExplicitAny: Type differences
				token.tag = (user as any).tag;
				// biome-ignore lint/suspicious/noExplicitAny: Type differences
				token.role = (user as any).role;
			}
			return token;
		},
	},
};
