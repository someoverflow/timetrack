import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

async function checkAdmin(): Promise<boolean> {
  const session = await getServerSession();

  if (session == null) return false;

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

// Create
export async function PUT(request: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return NextResponse.error();

  var json = await request.json();

  if (json.id == null || json.userId == null) return NextResponse.error();

  const result = await prisma.chip.create({
    data: {
      id: json.id,
      userId: parseInt(json.userId),
    },
  });

  return NextResponse.json({ result });
}

// Update
export async function POST(request: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return NextResponse.error();

  var json = await request.json();

  if (json.id == null || json.userId == null) return NextResponse.error();

  const result = await prisma.chip.update({
    where: {
      id: json.id,
    },
    data: {
      userId: parseInt(json.userId),
    },
  });

  return NextResponse.json({ result });
}

// Delete
export async function DELETE(request: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return NextResponse.error();

  var json = await request.json();

  if (json.id == null) return NextResponse.error();

  const result = await prisma.chip.delete({
    where: {
      id: json.id,
    },
  });

  return NextResponse.json({ result });
}
