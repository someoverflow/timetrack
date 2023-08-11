import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const NO_AUTH: APIResult = Object.freeze({
  success: false,
  status: 401,
  result: "Unauthorized",
});
const FORBIDDEN: APIResult = Object.freeze({
  success: false,
  status: 403,
  result: "Forbidden",
});
const BAD_REQUEST: APIResult = Object.freeze({
  success: false,
  status: 400,
  result: "Bad Request",
});

//     indicator
// Get current    timer
// Get all        timers
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (session == null)
    return NextResponse.json(NO_AUTH, {
      status: NO_AUTH.status,
      statusText: NO_AUTH.result,
    });

  const indicator = request.nextUrl.searchParams.get("indicator");

  let result: APIResult = {
    success: true,
    status: 200,
    result: undefined,
  };

  const user = session.user?.name + "";

  if (indicator == "current") {
    result.result = await prisma.times
      .findMany({
        take: 1,
        orderBy: {
          id: "desc",
        },
        where: {
          user: user,
          end: null,
        },
      })
      .catch((e) => {
        result.success = false;
        result.status = 500;
        return e.meta.cause;
      });
  } else {
    result.result = await prisma.times
      .findMany({
        orderBy: {
          id: "desc",
        },
        where: {
          user: user,
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

// Create timer
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (session == null)
    return NextResponse.json(NO_AUTH, {
      status: NO_AUTH.status,
      statusText: NO_AUTH.result,
    });

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
    select: {
      username: true,
      role: true,
    },
  });

  let result: APIResult = {
    success: true,
    status: 200,
    result: undefined,
  };

  var json = await request.json().catch((e) => {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "JSON Body could not be parsed"];
    console.log(result.result);

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  });
  if (json instanceof NextResponse) return json;

  if (
    json.username == null ||
    json.notes == null ||
    json.start == null ||
    json.end == null
  ) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [
      result.result,
      json.username == null ? "Username Missing" : undefined,
      json.notes == null ? "Notes Missing" : undefined,
      json.start == null ? "Start Missing" : undefined,
      json.end == null ? "End Missing" : undefined,
    ];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  let dbUser: string | undefined;

  if (user?.username == json.username) dbUser = user?.username;

  if (!dbUser) {
    dbUser = (
      await prisma.user
        .findUnique({
          where: {
            username: json.username,
          },
          select: {
            username: true,
          },
        })
        .catch(() => undefined)
    )?.username;
  }

  if (!dbUser) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "User not found"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  if (user?.role != "admin" && dbUser != user?.username)
    return NextResponse.json(FORBIDDEN, {
      status: FORBIDDEN.status,
      statusText: FORBIDDEN.result,
    });

  const startDate = new Date(Date.parse(json.start));
  const endDate = new Date(Date.parse(json.end));
  const timePassed = getTimePassed(startDate, endDate);

  result.result = await prisma.times
    .create({
      data: {
        user: json.username,
        notes: json.notes,
        start: startDate,
        end: endDate,
        startType: json.startType ? json.startType : "API",
        endType: json.endType ? json.endType : "API",
        time: timePassed,
      },
    })
    .catch((e) => {
      result.success = false;
      result.status = 500;
      return e.meta.cause;
    });

  return NextResponse.json(result, { status: result.status });
}

// Update timer
export async function PUT(request: NextRequest) {
  const session = await getServerSession();
  if (session == null)
    return NextResponse.json(NO_AUTH, {
      status: NO_AUTH.status,
      statusText: NO_AUTH.result,
    });

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
    select: {
      username: true,
      role: true,
    },
  });

  let result: APIResult = {
    success: true,
    status: 200,
    result: undefined,
  };

  var json = await request.json().catch((e) => {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "JSON Body could not be parsed"];
    console.log(result.result);

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  });
  if (json instanceof NextResponse) return json;

  if (json.id == null || json.notes == null) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [
      result.result,
      json.id == null ? "ID Missing" : undefined,
      json.notes == null ? "Notes Missing" : undefined,
    ];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  const timer = await prisma.times
    .findUnique({
      where: {
        id: parseInt(json.id),
      },
    })
    .catch(() => null);

  if (timer == null) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "Timer not found"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  if (user?.role != "admin" && user?.username !== timer?.user)
    return NextResponse.json(FORBIDDEN, {
      status: FORBIDDEN.status,
      statusText: FORBIDDEN.result,
    });

  const data: any = {
    notes: json.notes,
  };

  if (json.start && json.end) {
    const startDate = new Date(Date.parse(json.start));
    const endDate = new Date(Date.parse(json.end));
    const timePassed = getTimePassed(startDate, endDate);

    if (startDate.getTime() != timer?.start.getTime()) {
      data.start = startDate;
      data.startType = json.startType ? json.startType : "API";
    }

    if (endDate.getTime() != timer?.end?.getTime()) {
      data.end = endDate;
      data.endType = json.endType ? json.endType : "API";
    }

    data.time = timePassed;
  }

  result.result = await prisma.times
    .update({
      where: {
        id: parseInt(json.id),
      },
      data: data,
    })
    .catch((e) => {
      result.success = false;
      result.status = 500;
      return e.meta.cause;
    });

  return NextResponse.json(result, { status: result.status });
}

// Delete timer
export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  if (session == null)
    return NextResponse.json(NO_AUTH, {
      status: NO_AUTH.status,
      statusText: NO_AUTH.result,
    });

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
    select: {
      username: true,
      role: true,
    },
  });

  let result: APIResult = {
    success: true,
    status: 200,
    result: undefined,
  };

  var json = await request.json().catch((e) => {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "JSON Body could not be parsed"];
    console.log(result.result);

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  });
  if (json instanceof NextResponse) return json;

  if (json.id == null) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, json.id == null ? "ID Missing" : undefined];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  const timer = await prisma.times
    .findUnique({
      where: {
        id: parseInt(json.id),
      },
    })
    .catch(() => null);

  if (timer == null) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "Timer not found"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  if (user?.role != "admin" && user?.username !== timer?.user)
    return NextResponse.json(FORBIDDEN, {
      status: FORBIDDEN.status,
      statusText: FORBIDDEN.result,
    });

  result.result = await prisma.times
    .delete({
      where: {
        id: parseInt(json.id),
      },
    })
    .catch((e) => {
      result.success = false;
      result.status = 500;
      return e.meta.cause;
    });

  return NextResponse.json(result, { status: result.status });
}
