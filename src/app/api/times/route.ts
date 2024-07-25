import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { NextResponse } from "next/server";
import {
  defaultResult,
  badRequestResponse,
  FORBIDDEN_RESPONSE,
  api,
} from "@/lib/server-utils";
import type { Prisma } from "@prisma/client";
import {
  nanoIdValidation,
  timesGetApiValidation,
  timesPostApiValidation,
  timesPutApiValidation,
} from "@/lib/zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Get time/times
/*  
	/?<all>=true
	/?periodFrom=""&periodTo=""  DateTimes (ISO)
*/
export const GET = api(
  async (request, user) => {
    if (!user) throw Error("User is undefined");

    // Prepare data
    const result = defaultResult("ok");

    // Prepare request
    const searchParams = request.nextUrl.searchParams;
    const allSearch = searchParams.get("all");
    const periodFrom = searchParams.get("periodFrom");
    const periodTo = searchParams.get("periodTo");

    // Validate request
    const validationResult = timesGetApiValidation.safeParse({
      all: allSearch ?? undefined,
      period:
        periodFrom && periodTo
          ? {
              from: periodFrom,
              to: periodTo,
            }
          : undefined,
    });
    if (!validationResult.success)
      return badRequestResponse(validationResult.error.issues, "validation");
    const data = validationResult.data;

    // Return the current time
    if (!data.all && !data.period) {
      // Get the latest time entry
      try {
        const databaseResult = await prisma.time.findFirst({
          orderBy: {
            start: "desc",
          },
          where: {
            userId: user.id,
            end: null,
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
    }

    // Return all times
    if (data.all || !data.period) {
      try {
        const databaseResult = await prisma.time.findMany({
          orderBy: {
            start: "desc",
          },
          where: {
            userId: user.id,
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
    }

    try {
      const databaseResult = await prisma.time.findMany({
        orderBy: {
          start: "desc",
        },
        where: {
          userId: user.id,
          start: {
            lte: data.period.from,
            gte: data.period.to,
          },
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
  { parseJson: false }
);

// Create timer
export const POST = api(async (_request, user, json) => {
  if (!user) throw Error("User is undefined");

  // Prepare data
  const result = defaultResult("created", 201);

  // Validate request
  const validationResult = timesPostApiValidation.safeParse({
    userId: json.userId,

    notes: json.notes,

    project: json.project,

    traveledDistance: json.traveledDistance,

    invoiced: json.invoiced,

    start: json.start,
    end: json.end,

    startType: json.startType,
    endType: json.endType,
  });
  if (!validationResult.success)
    return badRequestResponse(validationResult.error.issues, "validation");
  const data = validationResult.data;

  // Check if user is given
  if (data.userId) {
    if (data.userId !== user.id && user.role !== "ADMIN")
      return FORBIDDEN_RESPONSE;
  }

  // Check if user is included in project when given
  if (data.project) {
    try {
      const project = await prisma.project.findUniqueOrThrow({
        where: {
          name: data.project,
        },
      });
      data.project = project.name;
    } catch {
      return badRequestResponse(
        {
          id: data.project,
          message: "Project not found.",
        },
        "not-found"
      );
    }
  }

  // Prepare passed time
  const timePassed = getTimePassed(new Date(data.start), new Date(data.end));

  // Create the time entry
  try {
    const databaseResult = await prisma.time.create({
      data: {
        userId: data.userId ?? user.id,

        start: data.start,
        end: data.end,
        startType: data.startType ?? "API",
        endType: data.endType ?? "API",

        time: timePassed,

        notes: data.notes,

        projectName: data.project,
        traveledDistance: data.traveledDistance ?? null,
        invoiced: data.invoiced,
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

// Update timer
export const PUT = api(async (_request, user, json) => {
  if (!user) throw Error("User is undefined");
  if (!json) throw Error("Request is undefined");

  // Prepare data
  const result = defaultResult("updated");

  // Validate request
  const validationResult = timesPutApiValidation.safeParse({
    id: json.id,

    notes: json.notes,

    project: json.project,

    traveledDistance: json.traveledDistance,

    invoiced: json.invoiced,

    start: json.start,
    end: json.end,

    startType: json.startType,
    endType: json.endType,
  });
  if (!validationResult.success)
    return badRequestResponse(validationResult.error.issues, "validation");
  const data = validationResult.data;

  if (
    !(
      data.notes ||
      data.notes === "" ||
      data.invoiced !== undefined ||
      data.project ||
      data.start ||
      data.end ||
      data.startType ||
      data.endType ||
      data.traveledDistance
    )
  )
    return NextResponse.json(result, { status: result.status });

  // Check the time entry
  let dbStarted: Date | undefined = undefined;
  let dbStopped: Date | undefined = undefined;
  try {
    const databaseResult = await prisma.time.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!databaseResult)
      return badRequestResponse(
        "Entry with the given id not found",
        "not-found"
      );

    dbStarted = databaseResult.start;
    dbStopped = databaseResult.end ?? undefined;

    if (data.project) {
      const projectDatabaseResult = await prisma.project
        .findUnique({
          where: {
            name: data.project,
          },
        })
        .catch(() => null);

      if (data.project && projectDatabaseResult == null)
        return badRequestResponse(
          "Project with the given id not found",
          "not-found"
        );
    }
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

  const updateData: Prisma.XOR<
    Prisma.TimeUpdateInput,
    Prisma.TimeUncheckedUpdateInput
  > = {
    projectName: data.project,
    notes: data.notes,
    traveledDistance: data.traveledDistance,
    invoiced: data.invoiced,
  };

  if (data.start && !data.end) {
    if (dbStopped)
      updateData.time = getTimePassed(new Date(data.start), dbStopped);

    updateData.start = data.start;
    updateData.startType = data.startType ?? "API";
  }

  if (data.end && !data.start) {
    const timePassed = getTimePassed(dbStarted, new Date(data.end));

    updateData.end = data.end;
    updateData.time = timePassed;
    updateData.endType = data.endType ?? "API";
  }

  if (data.start && data.end) {
    const timePassed = getTimePassed(new Date(data.start), new Date(data.end));

    updateData.start = data.start;
    updateData.end = data.end;
    updateData.time = timePassed;

    updateData.startType = data.startType ?? "API";
    updateData.endType = data.endType ?? "API";
  }

  // Update the entry
  try {
    const databaseResult = await prisma.time.update({
      where: {
        id: data.id,
      },
      data: updateData,
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

// Delete timer
export const DELETE = api(async (_request, user, json) => {
  if (!user) throw Error("User is undefined");
  if (!json) throw Error("Request is undefined");

  // Prepare data
  const result = defaultResult("deleted");

  // Validate request
  const validationResult = nanoIdValidation.safeParse(json.id);
  if (!validationResult.success)
    return badRequestResponse(validationResult.error.issues, "validation");
  const id = validationResult.data;

  // Check the time entry
  try {
    const databaseResult = await prisma.time.findUnique({
      where: {
        id: id,
      },
    });

    if (!databaseResult)
      return badRequestResponse(
        "Entry with the given id not found",
        "not-found"
      );

    if (databaseResult.userId !== user.id && user.role !== "ADMIN")
      return FORBIDDEN_RESPONSE;
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

  // Delete the entry
  try {
    const databaseResult = await prisma.time.delete({
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
});
