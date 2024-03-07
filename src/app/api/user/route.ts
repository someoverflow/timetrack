import prisma from "@/lib/prisma";
import { hash } from "bcrypt";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// TODO: Add result info

async function checkAdmin(): Promise<boolean> {
  const session = await getServerSession();

  if (session == null) return false;

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
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
    json.username == null ||
    json.displayName == null
  )
    return NextResponse.error();

  if (json.role == null) json.role = "user";
  if (!(json.role == "user" || json.role == "admin")) json.role = "user";

  const result = await prisma.user.create({
    data: {
      username: json.username,
      name: json.displayName,
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

  // TODO: Check for default user

  let json = await request.json();

  if (
    json.id == null ||
    json.username == null ||
    json.mail == null ||
    json.role == null ||
    json.displayName == null
  )
    return NextResponse.error();

  const updateData: any = {
    username: json.username,
    name: json.displayName,
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

  const [userResult, timesResult] = await prisma.$transaction([
    prisma.user.update({
      where: {
        id: parseInt(json.id),
      },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
    prisma.times.updateMany({
      where: {
        user: user.username,
      },
      data: {
        user: updateData.username,
      },
    }),
  ]);

  return NextResponse.json({ userResult, timesResult });
}

// Delete
export async function DELETE(request: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return NextResponse.error();

  // TODO: Check for default user

  let json = await request.json();

  if (json.id == null) return NextResponse.error();

  if (json.id == 1) return NextResponse.error();

  const userToDelete = await prisma.user.findUnique({ where: { id: json.id } });

  if (!userToDelete) return NextResponse.error();

  const [timesResult, userResult] = await prisma.$transaction([
    prisma.times.deleteMany({ where: { user: userToDelete.username } }),
    prisma.user.delete({
      where: {
        id: userToDelete.id,
      },
    }),
  ]);

  return NextResponse.json({ timesResult, userResult });
}
