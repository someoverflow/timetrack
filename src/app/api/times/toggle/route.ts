import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { NextResponse } from "next/server";
import { api, badRequestResponse, defaultResult } from "@/lib/server-utils";
import { timesToggleApiValidation } from "@/lib/zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const PUT = api(
  async (request, user, _json) => {
    if (!user) throw Error("User is undefined");

    // Prepare data
    const result = defaultResult("updated");

    // Validate request
    const searchParams = request.nextUrl.searchParams;
    const validationResult = timesToggleApiValidation.safeParse({
      type: searchParams.get("type") ?? undefined,
      fixTime: searchParams.get("fixTime") ?? undefined,
      project: searchParams.get("project"),
    });
    if (!validationResult.success)
      return badRequestResponse(validationResult.error.issues, "validation");
    const data = validationResult.data;

    const databaseResult = await prisma.time
      .findFirst({
        orderBy: {
          start: "desc",
        },
        where: {
          userId: user.id,
          end: null,
        },
      })
      .catch(() => null);

    try {
      if (databaseResult === null) {
        const createResult = await prisma.time.create({
          data: {
            userId: user.id,
            start: data.fixTime ?? new Date(new Date().setSeconds(0)),
            startType: data.type ?? "API",
            projectName: data.project ?? null,
          },
        });
        result.result = createResult.id;
      } else {
        const changeDate = data.fixTime ? new Date(data.fixTime) : new Date();
        const timePassed = getTimePassed(databaseResult.start, changeDate);

        const updateResult = await prisma.time.update({
          data: {
            time: timePassed,
            end: changeDate,
            endType: data.type ?? "API",
            projectName: data.project,
          },
          where: {
            id: databaseResult.id,
          },
        });
        result.result = updateResult.id;
      }

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
