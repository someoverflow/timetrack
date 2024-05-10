import { authOptions } from "@/lib/auth";
import { type Session, getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function checkAdmin(): Promise<boolean> {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) return false;

	const user = await prisma.user.findUnique({
		where: {
			id: session.user.id,
		},
	});

	return user?.role === "admin";
}
export async function checkAdminWithSession(
	session: Session,
): Promise<boolean> {
	if (!session || !session.user) return false;

	const user = await prisma.user.findUnique({
		where: {
			id: session.user.id,
		},
	});

	return user?.role === "admin";
}

export const NO_AUTH: APIResult = Object.freeze({
	success: false,
	status: 401,
	result: "Unauthorized",
});
export const NOT_ADMIN: APIResult = Object.freeze({
	success: false,
	status: 403,
	result: "Forbidden",
});

export const BAD_REQUEST: APIResult = Object.freeze({
	success: false,
	status: 400,
	result: "Bad Request",
});
export const FORBIDDEN: APIResult = Object.freeze({
	success: false,
	status: 403,
	result: "Forbidden",
});