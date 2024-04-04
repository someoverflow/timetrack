// UI
import Navigation from "@/components/navigation";
import TimerSection from "./timer-section";

// Database
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Navigation
import { redirect } from "next/navigation";

// React
import { Metadata } from "next";
import { getServerSession } from "next-auth";

// Utils
import { getTotalTime } from "@/lib/utils";
import { authOptions } from "@/lib/auth";

type Timer = Prisma.timeGetPayload<{}>;
interface Data {
  [yearMonth: string]: Timer[];
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

function formatHistory(data: Timer[]): Data {
  let result: Data = {};

  data.forEach((item) => {
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
}: {
  searchParams?: {
    query?: string;
    ym?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return redirect("/signin");
  const user = session.user;

  const history = await prisma.time.findMany({
    orderBy: {
      //id: "desc",
      start: "desc",
    },
    where: {
      userId: user.id,
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
          <p className="text-2xl font-mono">History</p>
        </div>

        {/** Add button when no data found */}

        {dataFound() ? (
          <TimerSection
            history={historyData}
            totalTime={totalTime}
            tag={user.tag}
          />
        ) : (
          <p className="font-mono font-bold text-base">No data found</p>
        )}
      </section>
    </Navigation>
  );
}
