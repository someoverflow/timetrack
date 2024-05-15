import { z } from "zod";

const emptyId = "ID is empty";
const invalidId = "ID is invalid";

export const nanoidRegex = /^[a-z0-9_-]{12}$/i;

// Utils
export const nanoIdValidation = // All nanoid ids
	z.string().trim().regex(nanoidRegex, invalidId);

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
