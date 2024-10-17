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

const timePassedErrorResult: APIResult = {
  status: 400,
  success: false,
  type: "error-message",
  result: { message: "The calculated time would be negative" },
};

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
    if (!!data.all || !data.period) {
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
  { parseJson: false },
);

// Create timer
export const POST = api(async (_request, user, json) => {
  if (!user) throw Error("User is undefined");

  // Prepare data
  const result = defaultResult("created", 201);

  // Validate request
  const validationResult = timesPostApiValidation.safeParse(json);
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
        "not-found",
      );
    }
  }

  // Prepare passed time
  const timePassed = getTimePassed(
    new Date(data.start),
    new Date(data.end),
    data.breakTime,
  );

  if (!timePassed) {
    return NextResponse.json(timePassedErrorResult, {
      status: timePassedErrorResult.status,
    });
  }

  // Create the time entry
  try {
    const databaseResult = await prisma.time.create({
      data: {
        userId: data.userId ?? user.id,

        start: data.start,
        end: data.end,
        startType: data.startType ?? "API",
        endType: data.endType ?? "API",

        breakTime: data.breakTime ?? 0,

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
  const validationResult = timesPutApiValidation.safeParse(json);
  if (!validationResult.success)
    return badRequestResponse(validationResult.error.issues, "validation");
  const data = validationResult.data;

  const relevantFields: (keyof typeof data)[] = [
    "notes",
    "invoiced",
    "project",
    "start",
    "end",
    "startType",
    "endType",
    "traveledDistance",
    "breakTime",
  ];

  if (
    !relevantFields.some(
      (field) => data[field] !== undefined && data[field] !== "",
    )
  )
    return NextResponse.json(result, { status: result.status });

  // Check the time entry
  try {
    const databaseResult = await prisma.time.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!databaseResult)
      return badRequestResponse(
        "Entry with the given id not found",
        "not-found",
      );

    // eslint-disable-next-line no-var
    var dbStarted = databaseResult.start;
    // eslint-disable-next-line no-var
    var dbStopped = databaseResult.end ?? undefined;
    // eslint-disable-next-line no-var
    var dbBreakTime = databaseResult.breakTime ?? undefined;

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
          "not-found",
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
    breakTime: data.breakTime ?? dbBreakTime,
  };

  if (data.breakTime !== undefined && !data.start && !data.end) {
    // Case: No start or end, but breakTime is given
    updateData.time = getTimePassed(
      dbStarted,
      dbStopped ?? new Date(),
      data.breakTime,
    );

    if (!updateData.time) {
      return NextResponse.json(timePassedErrorResult, {
        status: timePassedErrorResult.status,
      });
    }

    if (!dbStopped) {
      updateData.time = undefined;
    }
  }

  if (data.start) {
    // Case: Start is given
    updateData.start = data.start;
    updateData.startType = data.startType ?? "API";

    if (dbStopped && !data.end) {
      // Case: Start is given, end is missing, dbStopped is given
      updateData.time = getTimePassed(
        new Date(data.start),
        dbStopped,
        data.breakTime ?? dbBreakTime,
      );

      if (!updateData.time) {
        return NextResponse.json(timePassedErrorResult, {
          status: timePassedErrorResult.status,
        });
      }
    }
  }

  if (data.end) {
    // Case: End is given
    updateData.end = data.end;
    updateData.endType = data.endType ?? "API";

    const startTime = data.start ? new Date(data.start) : dbStarted;
    // Calculate timePassed based on the given start (or dbStarted if not given)
    updateData.time = getTimePassed(
      startTime,
      new Date(data.end),
      data.breakTime ?? dbBreakTime,
    );

    if (!updateData.time) {
      return NextResponse.json(timePassedErrorResult, {
        status: timePassedErrorResult.status,
      });
    }
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
        "not-found",
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
