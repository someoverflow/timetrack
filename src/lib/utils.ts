import { authOptions } from "@/lib/auth";
import { type Session, getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const days = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];
export const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

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
export async function checkAdminWithSession(session: Session): Promise<boolean> {
	if (!session || !session.user) return false;

	const user = await prisma.user.findUnique({
		where: {
			id: session.user.id,
		},
	});

	return user?.role === "admin";
}

export function validatePassword(password: string): boolean {
	const regex = /^(?=.*[0-9])[a-zA-Z0-9]{8,20}$/;
	return regex.test(password);
}

export function getTimePassed(start: Date, end: Date): string {
	const msPassed = Math.abs(start.getTime() - end.getTime());
	const date = new Date(Date.UTC(0, 0, 0, 0, 0, 0, msPassed));
	return [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
		.map((s) => String(s).padStart(2, "0"))
		.join(":");
}

export function getTotalTime(times: string[]): string {
	const totalSeconds = times.reduce((total, timeString) => {
		const [hours, minutes, seconds] = timeString.split(":").map(Number);
		return total + hours * 3600 + minutes * 60 + seconds;
	}, 0);

	const totalHours = Math.floor(totalSeconds / 3600);
	const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
	const remainingSeconds = totalSeconds % 60;

	return `${totalHours.toString().padStart(2, "0")}:${totalMinutes
		.toString()
		.padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
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
