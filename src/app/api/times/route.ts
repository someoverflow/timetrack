import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (session == null) return NextResponse.error();

  const data = await prisma.times.findMany({
    orderBy: {
      id: "desc",
    },
    where: {
      user: session.user?.name + "",
    },
  });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (session == null) return NextResponse.error();

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
    select: {
      id: true,
      username: true,
      chips: true,
      role: true,
    },
  });

  var json = await request.json();

  if (json.id == null || json.notes == null) return NextResponse.error();

  const timer = await prisma.times.findUnique({
    where: {
      id: parseInt(json.id),
    },
  });

  if (user?.role != "admin" && user?.username !== timer?.user)
    NextResponse.error();

  const data: any = {
    notes: json.notes,
  };

  if (json.start && json.end) {
    const start = json.start;
    const startType = json.startType ? json.startType : "API";
    const end = json.end;
    const endType = json.endType ? json.endType : "API";

    const startDate = new Date(Date.parse(start));
    const endDate = new Date(Date.parse(end));
    const timePassed = getTimePassed(startDate, endDate);

    if (startDate.getTime() != timer?.start.getTime()) {
      data.start = startDate;
      data.startType = startType;
    }

    if (endDate.getTime() != timer?.end?.getTime() && timer !== null) {
      data.end = endDate;
      data.endType = endType;
    }

    data.time = timePassed;
  }

  const result = await prisma.times.update({
    where: {
      id: parseInt(json.id),
    },
    data: data,
  });

  return NextResponse.json({ result });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  if (session == null) return NextResponse.error();

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
    select: {
      id: true,
      username: true,
      chips: true,
      role: true,
    },
  });

  var json = await request.json();

  if (json.id == null) return NextResponse.error();

  const timer = await prisma.times.findUnique({
    where: {
      id: parseInt(json.id),
    },
  });

  if (user?.role != "admin" && user?.username !== timer?.user)
    NextResponse.error();

  const result = await prisma.times.delete({
    where: {
      id: parseInt(json.id),
    },
  });

  return NextResponse.json({ result });
}
