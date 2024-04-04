import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// TODO: Add result info

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
  if (!isAdmin) return NextResponse.error();

  let json = await request.json();

  if (
    json.email == null ||
    json.password == null ||
    json.tag == null ||
    json.name == null
  )
    return NextResponse.error();

  if (json.role == null) json.role = "user";
  if (!(json.role == "user" || json.role == "admin")) json.role = "user";

  const result = await prisma.user.create({
    data: {
      tag: json.tag,
      name: json.name,
      email: json.email,
      password: await hash(json.password, 12),
      role: json.role,
    },
  });

  return NextResponse.json({ result });
}

// Update
export async function POST(request: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return NextResponse.error();

  let json = await request.json();

  if (
    json.id == null ||
    json.tag == null ||
    json.mail == null ||
    json.role == null ||
    json.name == null
  )
    return NextResponse.error();

  const updateData: any = {
    tag: json.tag,
    name: json.name,
    email: json.mail,
    role: json.role == "admin" || json.role == "user" ? json.role : "user",
  };

  if (json.password) {
    if (json.password.trim().length === 0) return NextResponse.error();
    updateData.password = await hash(json.password, 12);
  }

  const user = await prisma.user.findUnique({
    where: { id: json.id },
  });
  if (!user) return NextResponse.error();
  if (user.tag == "admin") {
    if (updateData.tag != "admin" || updateData.role != "admin")
      return NextResponse.error();
  }

  const [userResult] = await prisma.$transaction([
    prisma.user.update({
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
    }),
  ]);

  return NextResponse.json({ userResult });
}

// Delete
export async function DELETE(request: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return NextResponse.error();

  let json = await request.json();

  if (json.id == null) return NextResponse.error();

  if (json.id == 1) return NextResponse.error();

  const userToDelete = await prisma.user.findUnique({ where: { id: json.id } });
  if (!userToDelete) return NextResponse.error();
  if (userToDelete?.tag == "admin") return NextResponse.error();

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

  return NextResponse.json({
    timeResult,
    projectResult,
    chipResult,
    userResult,
  });
}
