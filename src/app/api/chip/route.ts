import prisma from "@/lib/prisma";
import { Session, getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

async function checkAdmin(session: Session): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
    select: {
      role: true,
    },
  });

  if (user?.role != "admin") return false;

  return true;
}

const NO_AUTH: APIResult = Object.freeze({
  success: false,
  status: 401,
  result: "Unauthorized",
});
const NOT_ADMIN: APIResult = Object.freeze({
  success: false,
  status: 403,
  result: "Forbidden",
});

const BAD_REQUEST: APIResult = Object.freeze({
  success: false,
  status: 400,
  result: "Bad Request",
});

// Delete a chip
export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  if (session == null)
    return NextResponse.json(NO_AUTH, {
      status: NO_AUTH.status,
      statusText: NO_AUTH.result,
    });

  const isAdmin = await checkAdmin(session);
  if (!isAdmin)
    return NextResponse.json(NOT_ADMIN, {
      status: NOT_ADMIN.status,
      statusText: NOT_ADMIN.result,
    });

  let result: APIResult = {
    success: true,
    status: 200,
    result: undefined,
  };

  var json = await request.json().catch((e) => {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "JSON Body could not be parsed"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  });
  if (json instanceof NextResponse) return json;

  if (json.id == null) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "ID Missing"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  const check = await prisma.chip.findUnique({
    where: {
      id: json.id,
    },
  });

  if (!check) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "Chip ID not found"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  const res = await prisma.chip
    .delete({
      where: {
        id: json.id,
      },
    })
    .catch(() => {
      return null;
    });

  if (!res) {
    result.success = false;
    result.status = 500;
    return NextResponse.json(result, { status: result.status });
  }

  result.result = res;

  return NextResponse.json(result, { status: result.status });
}

// Create a chip
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (session == null)
    return NextResponse.json(NO_AUTH, {
      status: NO_AUTH.status,
      statusText: NO_AUTH.result,
    });

  const isAdmin = await checkAdmin(session);
  if (!isAdmin)
    return NextResponse.json(NOT_ADMIN, {
      status: NOT_ADMIN.status,
      statusText: NOT_ADMIN.result,
    });

  let result: APIResult = {
    success: true,
    status: 201,
    result: undefined,
  };

  var json = await request.json().catch((e) => {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "JSON Body could not be parsed"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  });
  if (json instanceof NextResponse) return json;

  if (json.id == null || json.userId == null) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [
      result.result,
      json.id == null ? "ID Missing" : undefined,
      json.userId == null ? "User ID Missing" : undefined,
    ];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  const check = await prisma.chip.findUnique({
    where: {
      id: json.id,
    },
  });

  if (check) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [
      result.result,
      "Chip ID is already in use by " +
        (check.userId === json.userId ? "this user" : check.userId),
    ];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  const res = await prisma.chip
    .create({
      data: {
        id: json.id,
        userId: parseInt(json.userId),
      },
    })
    .catch(() => {
      return null;
    });

  if (!res) {
    result.success = false;
    result.status = 500;
    return NextResponse.json(result, { status: result.status });
  }

  result.result = res;

  return NextResponse.json(result, { status: result.status });
}

// Update a chip
export async function PUT(request: NextRequest) {
  const session = await getServerSession();
  if (session == null)
    return NextResponse.json(NO_AUTH, {
      status: NO_AUTH.status,
      statusText: NO_AUTH.result,
    });

  const isAdmin = await checkAdmin(session);
  if (!isAdmin)
    return NextResponse.json(NOT_ADMIN, {
      status: NOT_ADMIN.status,
      statusText: NOT_ADMIN.result,
    });

  let result: APIResult = {
    success: true,
    status: 200,
    result: undefined,
  };

  var json = await request.json().catch((e) => {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "JSON Body could not be parsed"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  });
  if (json instanceof NextResponse) return json;

  if (json.id == null || json.userId == null) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [
      result.result,
      json.id == null ? "ID Missing" : undefined,
      json.userId == null ? "User ID Missing" : undefined,
    ];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  result.result = await prisma.chip
    .update({
      where: {
        id: json.id,
      },
      data: {
        userId: parseInt(json.userId),
      },
    })
    .catch((e) => {
      result.success = false;
      result.status = 500;
      return e.meta.cause;
    });

  return NextResponse.json(result, { status: result.status });
}
