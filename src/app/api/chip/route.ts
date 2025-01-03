import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chipApiValidation, chipIdValidation } from "@/lib/zod";
import { api, badRequestResponse, defaultResult } from "@/lib/server-utils";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Create a chip
export const POST = api(
  async (_request, _user, json) => {
    if (!json) throw Error("Request is undefined");

    // Prepare data
    const result = defaultResult("created", 201);

    // Validate request
    const validationResult = chipApiValidation.safeParse({
      id: json.id,
      userId: json.userId,
    });
    if (!validationResult.success) {
      const validationError = validationResult.error;
      return badRequestResponse(validationError.issues, "validation");
    }
    const data = validationResult.data;

    // Check for duplicated chip
    const check = await prisma.chip.findUnique({
      where: {
        id: data.id,
      },
      select: {
        id: true,
        user: true,
      },
    });

    if (check) {
      return badRequestResponse(
        {
          duplicateId: check.user.id,
          message: `Chip ID is already in use by ${
            check.user.id === json.userId ? "this user" : check.user.username
          }`,
        },
        "duplicate-found",
      );
    }

    // Create the chip
    try {
      const databaseResult = await prisma.chip.create({
        data: {
          id: data.id,
          userId: data.userId,
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
  { adminOnly: true },
);

// Change the user of a chip
export const PUT = api(
  async (_request, _user, json) => {
    if (!json) throw Error("Request is undefined");

    // Prepare data
    const result = defaultResult("updated");

    // Validate request
    const validationResult = chipApiValidation.safeParse({
      id: json.id,
      userId: json.userId,
    });
    if (!validationResult.success) {
      const validationError = validationResult.error;
      return badRequestResponse(validationError.issues, "validation");
    }
    const data = validationResult.data;

    // Update the user
    try {
      const databaseResult = await prisma.chip.update({
        where: {
          id: data.id,
        },
        data: {
          userId: data.userId,
        },
      });

      result.result = databaseResult;
      return NextResponse.json(result, { status: result.status });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        switch (e.code) {
          case "P2025":
            return badRequestResponse(
              {
                id: data.id,
                message: "Chip does not exist.",
              },
              "not-found",
            );
        }

        result.result = `Server issue occurred ${e.code}`;
      } else result.result = "Server issue occurred";

      result.success = false;
      result.status = 500;
      result.type = "unknown";
      console.warn(e);
      return NextResponse.json(result, { status: result.status });
    }
  },
  { adminOnly: true },
);

// Delete a chip
export const DELETE = api(
  async (_request, _user, json) => {
    if (!json) throw Error("Request is undefined");

    // Prepare data
    const result = defaultResult("deleted");

    // Validate request
    const validationResult = chipIdValidation.safeParse(json.id);
    if (!validationResult.success) {
      const validationError = validationResult.error;
      return badRequestResponse(validationError.issues, "validation");
    }
    const id = validationResult.data;

    // Delete the chip
    try {
      const databaseResult = await prisma.chip.delete({
        where: {
          id: id,
        },
      });

      result.result = databaseResult;
      return NextResponse.json(result, { status: result.status });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        switch (e.code) {
          case "P2025":
            return badRequestResponse(
              {
                id: id,
                message: "Chip does not exist.",
              },
              "not-found",
            );
        }

        result.result = `Server issue occurred ${e.code}`;
      } else result.result = "Server issue occurred";

      result.success = false;
      result.status = 500;
      result.type = "unknown";
      console.warn(e);
      return NextResponse.json(result, { status: result.status });
    }
  },
  { adminOnly: true },
);
