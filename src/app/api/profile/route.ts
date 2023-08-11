import prisma from "@/lib/prisma";
import { validatePassword } from "@/lib/utils";
import { hash } from "bcrypt";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const NO_AUTH: APIResult = Object.freeze({
  success: false,
  status: 401,
  result: "Unauthorized",
});

const BAD_REQUEST: APIResult = Object.freeze({
  success: false,
  status: 400,
  result: "Bad Request",
});

// Update profile
export async function PUT(request: NextRequest) {
  const session = await getServerSession();
  if (session == null)
    return NextResponse.json(NO_AUTH, {
      status: NO_AUTH.status,
      statusText: NO_AUTH.result,
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

  if (json.dbIndicator == null || json.value == null) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [
      result.result,
      json.dbIndicator == null ? "Indicator Missing" : undefined,
      json.value == null ? "Value Missing" : undefined,
    ];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  if (json.dbIndicator == "password" && !validatePassword(json.value)) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "Invalid Password"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  const data = {
    password:
      json.dbIndicator == "password" ? await hash(json.value, 12) : undefined,
    name: json.dbIndicator == "name" ? json.value : undefined,
    email: json.dbIndicator == "email" ? json.value : undefined,
  };

  result.result = await prisma.user
    .update({
      where: {
        username: json.username,
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
