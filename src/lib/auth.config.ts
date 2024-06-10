import { CredentialsSignin, type NextAuthConfig } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export class MemberNotFoundError extends CredentialsSignin {}
export class InvalidPasswordError extends CredentialsSignin {}

export default {
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
				if (!user) throw new MemberNotFoundError();

				// Check the password
				const isPasswordValid = await compare(data.password, user.password);
				if (!isPasswordValid) throw new InvalidPasswordError();

				return {
					id: user.id,
					username: user.username,
					name: user.name,

					email: user.email,
					role: user.role,

					validJwtId: user.validJwtId,
				};
			},
		}),
	],
} satisfies NextAuthConfig;
