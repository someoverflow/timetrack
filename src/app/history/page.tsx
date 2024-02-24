import prisma from "@/lib/prisma";
import Navigation from "@/components/navigation";

import TimerSection from "./timer-section";

import { Session, getServerSession } from "next-auth";
import { Metadata } from "next";
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

async function getHistory(session: Session | null) {
  const history = await prisma.times.findMany({
    orderBy: {
      //id: "desc",
      start: "desc",
    },
    where: {
      user: session?.user?.name + "",
    },
  });
  return history;
}

export default async function History({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    ym?: string;
  };
}) {
  const session = await getServerSession();
  const history = await getHistory(session);

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
          <p className="text-2xl font-mono">History</p>
        </div>

        {/** Add button when no data found */}

        {dataFound() ? (
          <TimerSection
            history={historyData}
            totalTime={totalTime}
            username={session?.user?.name!}
          />
        ) : (
          <p className="font-mono font-bold text-base">No data found</p>
        )}
      </section>
    </Navigation>
  );
}
