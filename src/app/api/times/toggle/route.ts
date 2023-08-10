import prisma from "@/lib/prisma";
import { getTimePassed } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

  var requestValue = request.nextUrl.searchParams.get("value");
  var requestTime = request.nextUrl.searchParams.get("fixTime");
  if (
    requestValue == null ||
    !(requestValue == "start" || requestValue == "stop")
  )
    return NextResponse.error();

  let startDate = new Date();
  if (requestTime) startDate = new Date(Date.parse(requestTime));

  if (requestValue == "start") {
    if (data.length == 0) {
      const result = await prisma.times.create({
        data: {
          user: session.user?.name + "",
          start: startDate,
          startType: "Website",
        },
      });

      return NextResponse.json({ result });
    } else return NextResponse.error();
  }

  if (requestValue == "stop") {
    if (data.length == 1) {
      const item = data[0];

      const startDate = item.start;
      const currentDate = new Date();

      var timePassed = getTimePassed(startDate, currentDate);

      const result = await prisma.times.update({
        data: {
          end: currentDate,
          endType: "Website",
          time: timePassed,
        },
        where: {
          id: item.id,
        },
      });
      return NextResponse.json(result);
    } else return NextResponse.error();
  }

  return NextResponse.json({ data });
}
