import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (session == null) return NextResponse.error();

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
  });

  if (user?.role != "admin") return NextResponse.error();

  const posts = await prisma.times.findMany({
    orderBy: {
      id: "desc",
    },
  });

  return NextResponse.json({ posts });
}
