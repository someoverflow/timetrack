import { z } from "zod";

const emptyId = "ID is empty.";
const invalidId = "ID is invalid.";
const invalidPassword = "Password is invalid. (8-30 chars, a-z, A-Z, 0-9)";

export const nanoidRegex = /^[a-z0-9_-]{12}$/i;
export const passwordRegex = /^(?=.*[0-9])[a-zA-Z0-9]/;

// Utils
export const nanoIdValidation = // All nanoid ids
	z.string().trim().regex(nanoidRegex, invalidId);

export const nameValidation = z
	.string()
	.trim()
	.min(1, "Name is too short.")
	.max(50, "Name is too long.");
export const mailValidation = z
	.string()
	.trim()
	.min(5, "Email is too short.")
	.email();
export const passwordValidation = z
	.string()
	.trim()
	.min(8, "Password is too short. (min. 8)")
	.max(30, "Password is too long. (max. 30)")
	.regex(passwordRegex, invalidPassword);

// Profile API
export const profileApiValidation = z
	.object({
		name: nameValidation,
		mail: mailValidation,
		password: passwordValidation,
	})
	.partial()
	.refine(
		({ name, mail, password }) =>
			name !== undefined || mail !== undefined || password !== undefined,
		{
			message: "One of the fields must be given (name, mail, password)",
			path: ["name", "mail", "password"],
		},
	);

// Chips API
const chipMaxId = "ID is longer than 50 chars";
export const chipIdValidation = // Chip ids
	z.string().trim().max(50, chipMaxId).min(1, emptyId);

export const chipApiValidation = // POST & PUT requests
	z.object({
		id: chipIdValidation,
		userId: nanoIdValidation,
	});
export type chipApiValidation = z.infer<typeof chipApiValidation>;
