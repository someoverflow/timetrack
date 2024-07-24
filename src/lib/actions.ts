"use server";

import { signIn } from "./auth";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function authenticate(formData: any) {
	try {
		const _session = await signIn("credentials", formData);
		return { success: true, message: "login successful" };
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (err: any) {
		if (err.type === "AuthError") {
			return {
				error: { message: err.message },
			};
		}
		return { error: { message: "Failed to login", error: err } };
	}
}
