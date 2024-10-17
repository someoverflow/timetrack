import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { z } from "zod";

//#region Utils
const emptyId = "ID is empty.";
const invalidId = "ID is invalid.";

export const nanoidRegex = /^[a-z0-9_-]{12}$/i;
export const passwordRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*#?&\.]{8,30}$/;

const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!.*+@#$%&-_]).+$/;
const numberRegex = /\d/;
const charRegexUpper = /[A-Z]/;
const charRegexLower = /[a-z]/;

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
  .regex(passRegex, "Password is invalid. (a-Z, 0-9, !.*+@#$%&-_)")

  .min(8, "Password is too short. (min. 8)")
  .max(30, "Password is too long. (max. 30)")

  .regex(numberRegex, "The password must include at least one digit.")
  .regex(charRegexLower, "The password must include at least one letter.")
  .regex(
    charRegexUpper,
    "The password must include at least one uppercase letter.",
  );

export const userArrayValidation = z.array(nameValidation).min(1);
//#endregion

//#region User API
export const userCreateApiValidation = z.object({
  name: nameValidation,
  username: nameValidation,
  email: mailValidation.optional(),
  password: passwordValidation,
  role: z.nativeEnum(Role).optional(),
  customer: nameValidation.optional(),
});
export const userUpdateApiValidation = z
  .object({
    id: nanoIdValidation,
    name: nameValidation,
    username: nameValidation,
    email: mailValidation,
    password: passwordValidation,
    role: z.nativeEnum(Role),
    customer: nameValidation.optional(),
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

    breakTime: z.coerce.number().min(0),

    invoiced: z.coerce.boolean(),

    traveledDistance: z.coerce.number(),

    startType: z.coerce.string().trim(),
    endType: z.coerce.string().trim(),
  })
  .partial()
  .required({
    notes: true,
    start: true,
    end: true,
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

    invoiced: z.coerce.boolean(),

    breakTime: z.coerce.number().min(0),

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
  .min(4, "Task is too short. (min. 4)")
  .max(100, "Task is too long. (max. 100)");
const todoDescriptionValidation = z
  .string()
  .trim()
  .max(10e6, "Description is too long. (max. 800)");

export const todoCreateApiValidation = z
  .object({
    task: todoTaskValidation,
    description: todoDescriptionValidation.nullable(),
    deadline: z.string().date(),
    assignees: z.array(nameValidation).nonempty(),
    projects: z.array(nameValidation).nonempty(),
    priority: z.nativeEnum(TicketPriority),
  })
  .partial()
  .required({ task: true });

export const todoUpdateApiValidation = z
  .object({
    id: nanoIdValidation,
    task: todoTaskValidation,
    status: z.nativeEnum(TicketStatus),
    priority: z.nativeEnum(TicketPriority),
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
    ticketCreationMail: z.boolean(),
    ticketUpdateMail: z.boolean(),
  })
  .partial()
  .refine(
    ({
      name,
      mail,
      password,
      language,
      ticketCreationMail,
      ticketUpdateMail,
    }) =>
      name == undefined ||
      mail == undefined ||
      password == undefined ||
      language == undefined ||
      ticketCreationMail == undefined ||
      ticketUpdateMail == undefined,
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
  type: z.enum(["CUSTOMER", "PROJECT"]),
  description: projectDescriptionValidation,
});

export const projectUpdateApiValidation = z.object({
  name: nameValidation,
  customer: nameValidation.optional().nullable(),
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
