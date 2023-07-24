"use client";

import { getTotalTime } from "@/lib/utils";
import { FileDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const TimerInfo = dynamic(() => import("./timerinfo"), { ssr: false });

interface I_Time {
  id: number;
  user: string;
  start: Date;
  startType: string | null;
  end: Date | null;
  endType: string | null;
  time: string | null;
  notes: string | null;
}

interface Data {
  [yearMonth: string]: I_Time[];
}

function formatHistory(data: I_Time[]): Data {
  const months = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];

  let result: Data = {};

  data.forEach((item: I_Time) => {
    let date = new Date(item.start);
    let year = date.getFullYear();
    let month = months[date.getMonth()];

    if (!result[`${year} ${month}`]) result[`${year} ${month}`] = [];
    result[`${year} ${month}`].push(item);
  });

  return result;
}

export default function TimerHistory({ data }: { data: I_Time[] }) {
  const history: Data = formatHistory(data);

  const keys = Object.keys(history);

  const router = useRouter();

  useEffect(() => {
    const refreshIntervalId = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(refreshIntervalId);
  });

  const downloadCSV = (yearMonth: string, totalTime: string) => {
    var result = "Start;End;Time;Notes";

    history[yearMonth].forEach((time) => {
      result = `${result}\n${time.start.toLocaleString()};${time.end?.toLocaleString()};${
        time.time
      };"${time.notes ? time.notes : ""}"`;
    });

    result = `${result}\n\n;;${totalTime};`;

    const element = document.createElement("a");
    const file = new Blob([result], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = `Time ${yearMonth}.csv`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <>
      {keys.map((yearMonth) => {
        const timeStrings: string[] = [];

        history[yearMonth].forEach((e) => {
          if (e.time) timeStrings.push(e.time);
        });

        const totalTime = getTotalTime(timeStrings);

        return (
          <section className="w-full max-w-xl flex flex-col items-start" key={yearMonth}>
            <div className="w-full flex flex-row items-center justify-between p-2">
              <h1 className="font-mono text-lg text-content3 font-bold">
                {yearMonth}{" "}
                <span className="font-mono text-content2">({totalTime})</span>
              </h1>
              <button
                className="btn btn-solid-primary btn-circle btn-sm"
                onClick={() => downloadCSV(yearMonth, totalTime)}
              >
                <FileDown className="w-1/2 h-1/2" />
              </button>
            </div>
            <div className="w-full p-1 rounded-md border border-border">
              {history[yearMonth].reverse().map((time) => {
                return (
                  <div className="p-1 cursor-pointer" key={`${yearMonth} ${time.id}`}>
                    <TimerInfo data={time} />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}
