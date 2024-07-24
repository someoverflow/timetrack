import { AuthError, type NextAuthConfig } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

class CustomAuthError extends AuthError {
	constructor(message: string) {
		super();
		this.message = message;
	}
}

export default {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				username: {},
				password: {},
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
				if (!user) throw new CustomAuthError("Username not found");

				// Check the password
				const isPasswordValid = await compare(data.password, user.password);
				if (!isPasswordValid) throw new CustomAuthError("Password is invalid");

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
