import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { api, badRequestResponse, defaultResult } from "@/lib/server-utils";
import { randomUUID } from "node:crypto";
import {
  nanoIdValidation,
  userCreateApiValidation,
  userUpdateApiValidation,
} from "@/lib/zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Create
export const PUT = api(
  async (_request, _user, json) => {
    // Prepare data
    const result = defaultResult("created", 201);

    // Validate request
    const validationResult = userCreateApiValidation.safeParse({
      name: json.name,
      username: json.username,
      password: json.password,
      email: json.email,
      role: json.role,
    });
    if (!validationResult.success) {
      const validationError = validationResult.error;
      return badRequestResponse(validationError.issues, "validation");
    }
    const data = validationResult.data;

    const role =
      data.role === "ADMIN" || data.role === "USER" ? data.role : "USER";

    // Check if new username exists when given
    const databaseUser = await prisma.user
      .findUnique({
        where: { username: data.username },
      })
      .catch(() => null);
    if (databaseUser) {
      return badRequestResponse(
        {
          username: data.username,
          message: "User with the username exists.",
        },
        "duplicate-found"
      );
    }

    // Create the user
    try {
      const databaseResult = await prisma.user.create({
        data: {
          username: data.username,
          name: data.name,
          email: data.email,
          password: await hash(data.password, 12),
          role: role,
        },
        select: {
          username: true,
          name: true,
          email: true,
          role: true,
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
  { adminOnly: true }
);

// Update
export const POST = api(
  async (_request, _user, json) => {
    // Prepare data
    const result = defaultResult("updated");

    // Validate request
    const validationResult = userUpdateApiValidation.safeParse({
      id: json.id,
      name: json.name,
      username: json.username,
      password: json.password,
      email: json.email,
      role: json.role,
    });
    if (!validationResult.success) {
      const validationError = validationResult.error;
      return badRequestResponse(validationError.issues, "validation");
    }
    const data = validationResult.data;

    // Check the user
    const databaseUser = await prisma.user
      .findUnique({
        where: { id: json.id },
      })
      .catch(() => null);
    if (!databaseUser) {
      return badRequestResponse(
        {
          id: data.id,
          message: "User does not exist.",
        },
        "not-found"
      );
    }
    // Check if new username exists when given
    if (data.username) {
      const databaseUser = await prisma.user
        .findUnique({
          where: { username: data.username },
          select: { id: true },
        })
        .catch(() => null);
      if (databaseUser && databaseUser.id !== data.id) {
        return badRequestResponse(
          {
            username: data.username,
            message: "User with the new username exists.",
          },
          "duplicate-found"
        );
      }
    }
    // Check for changes of admin
    if (databaseUser.username === "admin") {
      if (data.username !== "admin" || data.role !== "ADMIN")
        return badRequestResponse(
          "Tag of admin cannot be changed",
          "error-message"
        );
    }

    // Prepare data
    const updateData: Partial<{
      validJwtId: string;

      username: string;
      name: string | undefined;
      email: string | undefined;
      role: "ADMIN" | "USER";
      password: string | undefined;
    }> = {
      validJwtId: randomUUID(), // Invalidate session
      username: data.username,
      name: data.name,
      email: data.email,
      role:
        data.role === "ADMIN" || data.role === "USER" ? data.role : undefined,
      password: data.password ? await hash(data.password, 12) : undefined,
    };

    // Update the user
    try {
      const databaseResult = await prisma.user.update({
        where: {
          id: data.id,
        },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          updatedAt: true,
          createdAt: true,
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
  { adminOnly: true }
);

// Delete
export const DELETE = api(
  async (_request, _user, json) => {
    // Prepare data
    const result = defaultResult("deleted");

    // Validate request
    const validationResult = nanoIdValidation.safeParse(json.id);
    if (!validationResult.success) {
      const validationError = validationResult.error;
      return badRequestResponse(validationError.issues, "validation");
    }
    const id = validationResult.data;

    const databaseUser = await prisma.user
      .findUnique({
        where: { id: id },
        select: {
          username: true,
          createdTodos: {
            select: {
              id: true,
              assignees: {
                select: { id: true },
              },
            },
          },
        },
      })
      .catch(() => null);
    if (!databaseUser) {
      return badRequestResponse(
        {
          id: id,
          message: "User does not exist.",
        },
        "not-found"
      );
    }
    if (databaseUser.username === "admin")
      return badRequestResponse(
        "Admin account cannot be deleted.",
        "error-message"
      );

    // Delete the chip
    try {
      // TODO: Delete Todo or change creator to assigned

      const databaseResult = await prisma.user.delete({
        where: {
          id: id,
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
  { adminOnly: true }
);
