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
  const [info, setInfo] = useState<InfoDetails | undefined>();

  const history: Data = formatHistory(data);
  const historyKeys = Object.keys(history);

  const router = useRouter();

  const editTime = useSearchParams().get("edit");

  useEffect(() => router.refresh(), [router]);
  useEffect(() => {
    const refreshIntervalId = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(refreshIntervalId);
  }, [router]);

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
              {history[yearMonth].map((time) => (
                <TimerInfo
                  key={`timerHistory-${yearMonth}-${time.id}`}
                  infoHandler={(details) => setInfo(details)}
                  edit={parseInt(editTime + "") == time.id}
                  data={time}
                />
              ))}
            </div>
          </section>
        );
      })}

      {info && (
        <div className="fixed bottom-0 w-full p-2 max-w-lg">
          <div
            className={`w-full alert 
            ${info.type == "info" && "alert-info"}
            ${info.type == "warning" && "alert-warning"} 
            ${info.type == "error" && "alert-error"}
            `}
          >
            {info.type == "info" && (
              <AlertCircle className="w-10 h-10 text-primary" />
            )}
            {info.type == "warning" && (
              <AlertOctagon className="w-10 h-10 text-warning" />
            )}
            {info.type == "error" && (
              <AlertTriangle className="w-10 h-10 text-error" />
            )}

            <div className="flex w-full justify-between items-center">
              <div className="flex flex-col">
                <span className="text-content1">{info.title}</span>
                <span className="text-content2 text-sm">{info.content}</span>
              </div>

              {(info.type == "info" || info.type == "warning") && (
                <button
                  type="button"
                  className="btn btn-circle btn-solid"
                  onClick={() => setInfo(undefined)}
                >
                  <X className="w-1/2 h-1/2 text-content3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
