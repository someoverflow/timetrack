import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (session == null) return NextResponse.error();

  const data = await prisma.times.findMany({
    take: 1,
    orderBy: {
      id: "desc",
    },
    where: {
      user: session.user?.name + "",
      end: null,
    },
  });

  return NextResponse.json({ data });
}
