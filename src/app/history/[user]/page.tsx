import prisma from "@/lib/prisma";
import Navigation from "@/components/navigation";

import TimerSection from "../timer-section";

import { getServerSession } from "next-auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTotalTime } from "@/lib/utils";

interface Data {
  [yearMonth: string]: TimerWithDate[];
}
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatHistory(data: TimerWithDate[]): Data {
  let result: Data = {};

  data.forEach((item: TimerWithDate) => {
    let date = new Date(item.start);
    let year = date.getFullYear();
    let month = months[date.getMonth()];

    if (!result[`${year} ${month}`]) result[`${year} ${month}`] = [];
    result[`${year} ${month}`].push(item);
  });

  return result;
}

export const metadata: Metadata = {
  title: "Time Track - History",
  description: "Track your Time",
};

export default async function History({
  searchParams,
  params,
}: {
  searchParams?: {
    query?: string;
    ym?: string;
    user: string;
  };
  params: { user: string };
}) {
  const session = await getServerSession();

  if (session == null) return redirect("/");

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
  });

  if (user?.role != "admin") redirect("/history");

  const target = await prisma.user
    .findUnique({
      where: {
        username: params.user,
      },
      select: {
        username: true,
        name: true,
      },
    })
    .catch(() => null);

  const history = await prisma.times.findMany({
    orderBy: {
      //id: "desc",
      start: "desc",
    },
    where: {
      user: target?.username + "",
    },
  });

  function dataFound(): boolean {
    if (history.length == 0) return false;
    return !(history.length == 1 && history[0].end == null);
  }

  const historyData = formatHistory(history);

  const timeStrings: string[] = [];
  try {
    if (searchParams && searchParams.ym) {
      historyData[searchParams.ym].forEach((e) => {
        if (e.time) timeStrings.push(e.time);
      });
    }
  } catch (err: any) {}
  const totalTime = timeStrings.length == 0 ? "" : getTotalTime(timeStrings);

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">{`History of ${
            target ? target.name : "?"
          }`}</p>
        </div>

        {history != null ? (
          <>
            {dataFound() ? (
              <TimerSection
                history={historyData}
                totalTime={totalTime}
                username={session?.user?.name!}
              />
            ) : (
              <p className="font-mono font-bold text-xl">No data found</p>
            )}
          </>
        ) : (
          <p className="font-mono font-bold text-4xl">User not found</p>
        )}
      </section>
    </Navigation>
  );
}
