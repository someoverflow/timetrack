import { z } from "zod";

const emptyId = "ID is empty.";
const invalidId = "ID is invalid.";
const invalidPassword = "Password is invalid. (8-30 chars, a-z, A-Z, 0-9)";

export const nanoidRegex = /^[a-z0-9_-]{12}$/i;
export const passwordRegex =
	/^(?=.*[A-Za-z])(?=.*\d)[a-zA-Z0-9\d@$!%*#?&]{8,30}$/i;

// Utils
export const nanoIdValidation = // All nanoid ids
	z.string().trim().length(12, invalidId).regex(nanoidRegex, invalidId);

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

// User API
export const userCreateApiValidation = z.object({
	name: nameValidation,
	username: nameValidation,
	email: mailValidation.optional(),
	password: passwordValidation,
	role: z
		.string()
		.regex(/\b(?:USER|ADMIN)\b/gm, "Role is not USER or ADMIN")
		.optional(),
});
export const userUpdateApiValidation = z
	.object({
		id: nanoIdValidation,
		name: nameValidation,
		username: nameValidation,
		email: mailValidation,
		password: passwordValidation,
		role: z.string().regex(/\b(?:USER|ADMIN)\b/gm, "Role is not USER or ADMIN"),
	})
	.partial()
	.required({ id: true });

// Times API
export const timesToggleApiValidation = z
	.object({
		type: z.string(),
		fixTime: z.string().datetime(),
	})
	.partial();

export const timesGetApiValidation = z
	.object({
		all: z.coerce.boolean(),
		period: z.object({
			from: z.string().datetime(),
			to: z.string().datetime(),
		}),
	})
	.partial();

export const timesPostApiValidation = z
	.object({
		userId: nanoIdValidation,

		notes: z.coerce.string().trim(),
		project: nanoIdValidation,

		start: z.coerce.string().datetime(),
		end: z.coerce.string().datetime(),

		startType: z.coerce.string().trim(),
		endType: z.coerce.string().trim(),
	})
	.partial({
		userId: true,
		project: true,
		startType: true,
		endType: true,
	})
	.refine((data) => data.end > data.start, {
		message: "The end is earlier than start",
		path: ["end"],
	});

export const timesPutApiValidation = z
	.object({
		id: nanoIdValidation,

		notes: z.coerce.string().trim(),
		project: nanoIdValidation,

		start: z.coerce.string().datetime(),
		end: z.coerce.string().datetime(),

		startType: z.coerce.string().trim(),
		endType: z.coerce.string().trim(),
	})
	.partial()
	.required({
		id: true,
	})
	.superRefine((data, ctx) => {
		if (
			!(
				data.notes ||
				data.project ||
				data.start ||
				data.end ||
				data.startType ||
				data.endType
			)
		)
			ctx.addIssue({
				code: "custom",
				message:
					"One of the fields must be given (notes, project, start(type), end(type))",
				path: ["notes", "project", "start", "end"],
			});

		if (data.start || data.end) {
			if ((data.start && !data.end) || (data.end && !data.start))
				ctx.addIssue({
					code: "custom",
					message:
						"One of the fields must be given (notes, project, start(type), end(type))",
					path: ["start", "end"],
				});
		}

		if (data.end && data.start ? data.end < data.start : false)
			ctx.addIssue({
				code: "custom",
				message: "The end is earlier than start",
				path: ["end"],
			});
	});

export type timesPutApiValidation = z.infer<typeof timesPutApiValidation>;

// Profile API
export const profileApiValidation = z
	.object({
		name: nameValidation,
		mail: mailValidation,
		password: passwordValidation,
	})
	.partial()
	.refine(({ name, mail, password }) => !(name || mail || password), {
		message: "One of the fields must be given (name, mail, password)",
		path: ["name", "mail", "password"],
	});

// Projects API
// name, description, [userId]
const projectDescriptionValidation = z
	.string()
	.min(1, "Description is too short.")
	.max(100, "Description is too long. (max. 100)")
	.nullable()
	.optional();

export const projectCreateApiValidation = z.object({
	name: nameValidation,
	description: projectDescriptionValidation,
	users: z.array(nanoIdValidation).nonempty().optional(),
});

export const projectUpdateApiValidation = z
	.object({
		id: nanoIdValidation,
		name: nameValidation,
		description: projectDescriptionValidation,
		merge: nanoIdValidation,
		users: z
			.object({
				add: z.array(nanoIdValidation).nonempty(),
				remove: z.array(nanoIdValidation).nonempty(),
			})
			.partial()
			.optional(),
	})
	.partial()
	.required({
		id: true,
	});

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
