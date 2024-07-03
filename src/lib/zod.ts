import { Role, TodoPriority, TodoStatus } from "@prisma/client";
import { z } from "zod";

//#region Utils
const emptyId = "ID is empty.";
const invalidId = "ID is invalid.";
const invalidPassword = "Password is invalid. (8-30 chars, a-z, A-Z, 0-9)";

export const nanoidRegex = /^[a-z0-9_-]{12}$/i;
export const passwordRegex =
	/^(?=.*[A-Za-z])(?=.*\d)[a-zA-Z0-9\d@$!%*#?&]{8,30}$/i;

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
//#endregion

//#region User API
export const userCreateApiValidation = z.object({
	name: nameValidation,
	username: nameValidation,
	email: mailValidation.optional(),
	password: passwordValidation,
	role: z.nativeEnum(Role).optional(),
});
export const userUpdateApiValidation = z
	.object({
		id: nanoIdValidation,
		name: nameValidation,
		username: nameValidation,
		email: mailValidation,
		password: passwordValidation,
		role: z.nativeEnum(Role),
	})
	.partial()
	.required({ id: true });
//#endregion

//#region Times API
export const timesToggleApiValidation = z
	.object({
		type: z.string(),
		fixTime: z.string().datetime(),
		project: nameValidation.nullable(),
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
		project: nameValidation,

		start: z.coerce.string().datetime(),
		end: z.coerce.string().datetime(),

		traveledDistance: z.coerce.number(),

		startType: z.coerce.string().trim(),
		endType: z.coerce.string().trim(),
	})
	.partial({
		userId: true,
		project: true,
		startType: true,
		endType: true,
		traveledDistance: true,
	})
	.refine((data) => data.end > data.start, {
		message: "The end is earlier than start",
		path: ["end"],
	});

export const timesPutApiValidation = z
	.object({
		id: nanoIdValidation,

		notes: z.coerce.string().trim(),
		project: nameValidation.nullable(),

		traveledDistance: z.coerce.number().nullable(),

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
		if (data.end && data.start ? data.end < data.start : false)
			ctx.addIssue({
				code: "custom",
				message: "The end is earlier than start",
				path: ["end"],
			});
	});

export type timesPutApiValidation = z.infer<typeof timesPutApiValidation>;
//#endregion

//#region Todo API
const todoTaskValidation = z
	.string()
	.trim()
	.min(1, "Task is too short.")
	.max(100, "Task is too long. (max. 100)");
const todoDescriptionValidation = z
	.string()
	.trim()
	.min(1, "Description is too short.")
	.max(800, "Description is too long. (max. 800)");

export const todoCreateApiValidation = z
	.object({
		task: todoTaskValidation,
		description: todoDescriptionValidation.nullable(),
		deadline: z.string().date(),
		assignees: z.array(nameValidation).nonempty(),
		projects: z.array(nameValidation).nonempty(),
		priority: z.nativeEnum(TodoPriority),
	})
	.partial()
	.required({ task: true });

export const todoUpdateApiValidation = z
	.object({
		id: nanoIdValidation,
		task: todoTaskValidation,
		status: z.nativeEnum(TodoStatus),
		priority: z.nativeEnum(TodoPriority),
		description: todoDescriptionValidation.nullable(),
		deadline: z.string().date().nullable(),
		assignees: z
			.object({
				add: z.array(nameValidation).nonempty(),
				remove: z.array(nameValidation).nonempty(),
			})
			.partial(),
		projects: z
			.object({
				add: z.array(nameValidation).nonempty(),
				remove: z.array(nameValidation).nonempty(),
			})
			.partial(),
	})
	.partial()
	.required({ id: true });

export type todoUpdateApiValidationType = z.infer<
	typeof todoUpdateApiValidation
>;
//#endregion

//#region Profile API
export const profileApiValidation = z
	.object({
		name: nameValidation,
		language: z.coerce.string(),
		mail: mailValidation,
		password: passwordValidation,
	})
	.partial()
	.refine(
		({ name, mail, password, language }) =>
			name || mail || password || language,
		{
			message: "One of the fields must be given (name, mail, password)",
			path: ["name", "mail", "password"],
		},
	);
//#endregion

//#region Projects API
// name, description
const projectDescriptionValidation = z
	.string()
	.min(1, "Description is too short.")
	.max(100, "Description is too long. (max. 100)")
	.nullable()
	.optional();

export const projectCreateApiValidation = z.object({
	name: nameValidation,
	description: projectDescriptionValidation,
});

export const projectUpdateApiValidation = z.object({
	name: nameValidation,
	newName: nameValidation.optional(),
	description: projectDescriptionValidation.optional(),
});
//#endregion

//#region Chips API
const chipMaxId = "ID is longer than 50 chars";
export const chipIdValidation = // Chip ids
	z.string().trim().max(50, chipMaxId).min(1, emptyId);

export const chipApiValidation = // POST & PUT requests
	z.object({
		id: chipIdValidation,
		userId: nanoIdValidation,
	});
export type chipApiValidation = z.infer<typeof chipApiValidation>;
//#endregion
