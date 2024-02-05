"use client";

import "@/lib/types";

import { getTotalTime } from "@/lib/utils";

import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

export default function TimerSection({ data }: { data: TimerWithDate[] }) {
  const history: Data = formatHistory(data);
  const historyKeys = Object.keys(history);

  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();
  const editTime = searchParams.get("edit");
  const yearMonth = searchParams.get("ym");

  function changeYearMonth(change: string) {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("ym", change);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  }

  // Set selected yearMonth if not set
  if (yearMonth == null || !historyKeys.includes(yearMonth)) {
    changeYearMonth(historyKeys[0]);
    return null;
  }

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

  const timeStrings: string[] = [];
  history[yearMonth].forEach((e) => {
    if (e.time) timeStrings.push(e.time);
  });
  const totalTime = getTotalTime(timeStrings);

  return (
    <section
      className="w-full max-w-md flex flex-col items-start"
      key={yearMonth}
    >
      <div className="w-full flex flex-row items-center justify-stretch gap-2 p-2">
        <div className="font-bold w-full">
          <Select value={yearMonth} onValueChange={changeYearMonth}>
            <SelectTrigger>
              <div className="flex flex-row items-center justify-start gap-2">
                <SelectValue />
                <p className="font-mono text-muted-foreground">({totalTime})</p>
              </div>
            </SelectTrigger>
            <SelectContent>
              {historyKeys.map((key) => (
                <SelectItem
                  key={`history-${key}`}
                  value={key}
                  className="font-mono"
                >
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-max">
          {/** TODO: Tooltip */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => downloadCSV(yearMonth, totalTime)}
          >
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
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
}
