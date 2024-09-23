import prisma from "@/lib/prisma";
import { defaultResult, badRequestResponse, api } from "@/lib/server-utils";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { profileApiValidation } from "@/lib/zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { lucia } from "@/lib/auth";

// Update profile
export const PUT = api(
  async (_request, user, json) => {
    if (!user) throw Error("User is undefined");
    if (!json) throw Error("Request is undefined");

    // Prepare data
    const result = defaultResult("updated", 200);

    // Validate request
    const validationResult = profileApiValidation.safeParse({
      name: json.name,
      mail: json.mail,
      password: json.password,
      language: json.language,
    });
    if (!validationResult.success) {
      const validationError = validationResult.error;
      return badRequestResponse(validationError.issues, "validation");
    }
    const data = validationResult.data;

    // Prepare password
    const password = data.password ? await hash(data.password, 12) : undefined;

    // Check language
    if (data.language) {
      if (!["de", "en"].includes(data.language.toLowerCase()))
        return badRequestResponse(
          { message: "Language not found" },
          "error-message",
        );
    }

    // Invalidate all sessions when changing the password
    if (password) lucia.invalidateUserSessions(user.id);

    // Update the user
    try {
      const databaseResult = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: data.name ?? undefined,
          language: data.language ? data.language.toLowerCase() : undefined,
          email: data.mail ?? undefined,
          password: password,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          updatedAt: true,
        },
      });
      result.result = databaseResult;
      return NextResponse.json(result, { status: result.status });
    } catch (e) {
      result.success = false;
      result.status = 500;
      result.type = "unknown";
      result.result = `Server issue occurred ${
        e instanceof PrismaClientKnownRequestError ? e.code : ""
      }`;
      console.warn(e);
      return NextResponse.json(result, { status: result.status });
    }
  },
  { allowCustomers: true },
);
