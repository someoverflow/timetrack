import prisma from "@/lib/prisma";
import { defaultResult, badRequestResponse, api } from "@/lib/server-utils";
import {
  nameValidation,
  projectCreateApiValidation,
  projectUpdateApiValidation,
} from "@/lib/zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

// Create a project
export const POST = api(async (_request, _user, json) => {
  if (!json) throw Error("Request is undefined");

  // Prepare data
  const result = defaultResult("created", 201);

  // Validate request
  const validationResult = projectCreateApiValidation.safeParse({
    name: json.name,
    description: json.description,
    userId: json.userId,
  });
  if (!validationResult.success) {
    const validationError = validationResult.error;
    return badRequestResponse(validationError.issues, "validation");
  }
  const data = validationResult.data;

  // Check if new project exists when given
  const databaseProject = await prisma.project
    .findUnique({
      where: { name: data.name },
    })
    .catch(() => null);
  if (databaseProject) {
    return badRequestResponse(
      {
        name: data.name,
        message: "Project with this name exists.",
      },
      "duplicate-found"
    );
  }

  // Create the project
  try {
    const databaseResult = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description ?? undefined,
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
});

// Update a project
/* {
	"name":			<name>
	"description":	<description?>
} */
export const PUT = api(async (_request, _user, json) => {
  if (!json) throw Error("Request is undefined");

  // Prepare data
  const result = defaultResult("updated");

  // Validate request
  const validationResult = projectUpdateApiValidation.safeParse({
    name: json.name,
    newName: json.newName,
    description: json.description,
  });
  if (!validationResult.success) {
    const validationError = validationResult.error;
    return badRequestResponse(validationError.issues, "validation");
  }
  const data = validationResult.data;

  // Update the project
  try {
    const databaseResult = await prisma.project.update({
      where: {
        name: data.name,
      },
      data: {
        name: data.newName ?? undefined,
        description: data.description,
      },
    });

    result.result = databaseResult;
    return NextResponse.json(result, { status: result.status });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P2025":
          console.error("project: ", e);
          return badRequestResponse(
            {
              name: data.name,
              message: "Project does not exist.",
            },
            "not-found"
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
});

// Delete a project (Admin Only)
export const DELETE = api(async (_request, _user, json) => {
  if (!json) throw Error("Request is undefined");

  // Prepare data
  const result = defaultResult("deleted");

  // Validate request
  const validationResult = nameValidation.safeParse(json.id);
  if (!validationResult.success)
    return badRequestResponse(validationResult.error.issues, "validation");
  const name = validationResult.data;

  // Delete the project
  try {
    const databaseResult = await prisma.project.delete({
      where: {
        name: name,
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
              name: name,
              message: "Project does not exist.",
            },
            "not-found"
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
});
