import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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

async function checkAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return false;

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  return user?.role == "admin";
}

// Create
export async function PUT(request: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin)
    return NextResponse.json(FORBIDDEN, {
      status: FORBIDDEN.status,
      statusText: FORBIDDEN.result,
    });

  let result: APIResult = {
    success: true,
    status: 200,
    result: undefined,
  };

  let json = await request.json();

  if (
    json.email == null ||
    json.password == null ||
    json.tag == null ||
    json.name == null
  ) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [
      result.result,
      json.tag == null ? "Tag Missing" : undefined,
      json.name == null ? "Name Missing" : undefined,
      json.password == null ? "Password Missing" : undefined,
      json.email == null ? "Mail Missing" : undefined,
    ];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  if (json.role == null) json.role = "user";
  if (!(json.role == "user" || json.role == "admin")) json.role = "user";

  result.result = await prisma.user.create({
    data: {
      tag: json.tag,
      name: json.name,
      email: json.email,
      password: await hash(json.password, 12),
      role: json.role,
    },
    select: {
      tag: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json(result, { status: result.status });
}

// Update
export async function POST(request: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin)
    return NextResponse.json(FORBIDDEN, {
      status: FORBIDDEN.status,
      statusText: FORBIDDEN.result,
    });

  let json = await request.json();

  let result: APIResult = {
    success: true,
    status: 200,
    result: undefined,
  };

  if (
    json.id == null ||
    json.tag == null ||
    json.mail == null ||
    json.role == null ||
    json.name == null
  ) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [
      result.result,
      "ID, Tag, Name, Mail or Role should be given",
    ];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  const updateData: any = {
    tag: json.tag,
    name: json.name,
    email: json.mail,
    role: json.role == "admin" || json.role == "user" ? json.role : "user",
  };

  if (json.password) {
    if (json.password.trim().length === 0) {
      result = JSON.parse(JSON.stringify(BAD_REQUEST));

      result.result = [result.result, "Password is empty"];

      return NextResponse.json(result, {
        status: BAD_REQUEST.status,
        statusText: BAD_REQUEST.result,
      });
    }
    updateData.password = await hash(json.password, 12);
  }

  const user = await prisma.user.findUnique({
    where: { id: json.id },
  });
  if (!user) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "User not found"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }
  if (user.tag == "admin") {
    if (updateData.tag != "admin" || updateData.role != "admin") {
      result = JSON.parse(JSON.stringify(BAD_REQUEST));

      result.result = [result.result, "Tag of admin cannot be changed"];

      return NextResponse.json(result, {
        status: BAD_REQUEST.status,
        statusText: BAD_REQUEST.result,
      });
    }
  }

  result.result = prisma.user.update({
    where: {
      id: parseInt(json.id),
    },
    data: updateData,
    select: {
      id: true,
      tag: true,
      email: true,
      role: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(result, { status: result.status });
}

// Delete
export async function DELETE(request: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin)
    return NextResponse.json(FORBIDDEN, {
      status: FORBIDDEN.status,
      statusText: FORBIDDEN.result,
    });

  let result: APIResult = {
    success: true,
    status: 200,
    result: undefined,
  };

  let json = await request.json();

  if (json.id == null) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "User ID Missing"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  if (json.id == 1) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "The admin account cannot be deleted"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  const userToDelete = await prisma.user.findUnique({ where: { id: json.id } });
  if (!userToDelete) {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "User not found"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }
  if (userToDelete?.tag == "admin") {
    result = JSON.parse(JSON.stringify(BAD_REQUEST));

    result.result = [result.result, "The admin account cannot be deleted"];

    return NextResponse.json(result, {
      status: BAD_REQUEST.status,
      statusText: BAD_REQUEST.result,
    });
  }

  const [timeResult, projectResult, chipResult, userResult] =
    await prisma.$transaction([
      prisma.time.deleteMany({ where: { userId: userToDelete.id } }),
      prisma.project.deleteMany({ where: { userId: userToDelete.id } }),
      prisma.chip.deleteMany({ where: { userId: userToDelete.id } }),
      prisma.user.delete({
        where: {
          id: userToDelete.id,
        },
      }),
    ]);

  result.result = [timeResult, projectResult, chipResult, userResult];

  return NextResponse.json(result, { status: result.status });
}
