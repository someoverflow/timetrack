import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const NO_AUTH: APIResult = Object.freeze({
  success: false,
  status: 401,
  result: "Unauthorized",
});

export async function PUT(request: NextRequest) {
  const session = await getServerSession();
  if (session == null)
    return NextResponse.json(NO_AUTH, {
      status: NO_AUTH.status,
      statusText: NO_AUTH.result,
    });

  const data = await prisma.times
    .findMany({
      take: 1,
      orderBy: {
        id: "desc",
      },
      where: {
        user: session.user?.name + "",
        end: null,
      },
    })
    .catch(() => null);

  let result: APIResult = {
    success: true,
    status: 200,
    result: undefined,
  };

  var type = request.nextUrl.searchParams.get("type");
  var requestTime = request.nextUrl.searchParams.get("fixTime");

  let changeDate = new Date();
  if (requestTime) changeDate = new Date(Date.parse(requestTime));

  if (data == null || data.length == 0) {
    result.result = await prisma.times
      .create({
        data: {
          user: session.user?.name + "",
          start: changeDate,
          startType: type ? type : "API",
        },
      })
      .catch((e) => {
        result.success = false;
        result.status = 500;
        return e.meta.cause;
      });
  } else {
    const item = data[0];

    var timePassed = getTimePassed(item.start, changeDate);

    const result = await prisma.times
      .update({
        data: {
          end: changeDate,
          endType: type ? type : "API",
          time: timePassed,
        },
        where: {
          id: item.id,
        },
      })
      .catch((e) => {
        result.success = false;
        result.status = 500;
        return e.meta.cause;
      });
  }

  return NextResponse.json(result, { status: result.status });
}
