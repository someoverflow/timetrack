"use client";

import "@/lib/types";

import { getTotalTime } from "@/lib/utils";

import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  FileDown,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const TimerInfo = dynamic(() => import("./TimerInfo"), { ssr: false });

interface Data {
  [yearMonth: string]: TimerWithDate[];
}

function formatHistory(data: TimerWithDate[]): Data {
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

export default function TimerHistory({
  data,
  username,
}: {
  data: TimerWithDate[];
  username: string;
}) {
  const history: Data = formatHistory(data);
  const historyKeys = Object.keys(history);

  const router = useRouter();

  const editTime = useSearchParams().get("edit");

  useEffect(() => router.refresh(), [router]);
  /*
  useEffect(() => {
    const refreshIntervalId = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(refreshIntervalId);
  }, [router]); 
  */

  const downloadCSV = (yearMonth: string, totalTime: string) => {
    let result = "Start;End;Time;Notes";

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
      {historyKeys.map((yearMonth) => {
        const timeStrings: string[] = [];

        history[yearMonth].forEach((e) => {
          if (e.time) timeStrings.push(e.time);
        });

        const totalTime = getTotalTime(timeStrings);

        return (
          <section
            className="w-full max-w-xl flex flex-col items-start"
            key={yearMonth}
          >
            <div className="w-full flex flex-row items-center justify-between p-2">
              <h1 className="font-mono text-lg text-content3 font-bold">
                {yearMonth}{" "}
                <span className="font-mono text-muted-foreground">({totalTime})</span>
              </h1>
              <Button variant="outline" size="icon" onClick={() => downloadCSV(yearMonth, totalTime)}>
                <FileDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-full p-1 rounded-md border border-border">
              {history[yearMonth].map((time) => (
                <TimerInfo
                  key={`timerHistory-${yearMonth}-${time.id}`}
                  edit={parseInt(editTime + "") == time.id}
                  data={time}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
