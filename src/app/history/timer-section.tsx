"use client";

import "@/lib/types";

import { cn, getTotalTime } from "@/lib/utils";

import { Check, ChevronDown, FileDown, ListPlus, Plus } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import TimerAdd from "./timer-add";
import React, { useState } from "react";
const TimerInfo = dynamic(() => import("./timer-info"), { ssr: false });

interface Data {
  [yearMonth: string]: TimerWithDate[];
}

export default function TimerSection({
  username,
  history,
  totalTime,
}: {
  username: string;
  history: Data;
  totalTime: string;
}) {
  const historyKeys = Object.keys(history);

  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();
  const editTime = searchParams.get("edit");
  const yearMonth = searchParams.get("ym");

  const [addVisible, setAddVisible] = useState(false);

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
    return <></>;
  }

  const downloadCSV = (yearMonth: string, totalTime: string) => {
    let result = "Date;Start;End;Time;Notes";

    history[yearMonth].reverse().forEach((time) => {
      if (!time.end) return;
      result = `${result}\n${time.start.toLocaleDateString()};${time.start.toLocaleTimeString()};${time.end?.toLocaleTimeString()};${
        time.time
      };"${time.notes ? time.notes : ""}"`;
    });

    result = `${result}\n\n;;;${totalTime};`;

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
    <section
      className="w-full max-w-md max-h-[75dvh] overflow-hidden flex flex-col items-start animate__animated animate__fadeIn"
      key={yearMonth}
    >
      <div className="w-full flex flex-row items-center justify-stretch gap-2 p-2">
        <div className="font-bold w-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                <div className="flex flex-row items-center justify-start gap-2">
                  {yearMonth}
                  <p className="font-mono text-muted-foreground">
                    ({totalTime})
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-1">
              <Command>
                <CommandInput
                  placeholder="Search year/month..."
                  className="h-8"
                />
                <CommandEmpty>No data found.</CommandEmpty>
                <CommandGroup>
                  {historyKeys.map((key) => (
                    <CommandItem
                      key={`history-${key}`}
                      value={key}
                      className="font-mono"
                      onSelect={() => changeYearMonth(key)}
                    >
                      {key}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          yearMonth === key ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="w-max">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => downloadCSV(yearMonth, totalTime)}
              >
                <FileDown className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-center">
                Download a <code>.csv</code> containing all
                <br /> the current visible entries
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="w-max">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAddVisible(true)}
              >
                <ListPlus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-center">Add a new entry</p>
            </TooltipContent>
          </Tooltip>
          <TimerAdd
            username={username}
            visible={addVisible}
            setVisible={setAddVisible}
          />
        </div>
      </div>
      <ScrollArea
        className="h-[65dvh] w-full rounded-sm border p-1.5 overflow-hidden"
        type="scroll"
      >
        {history[yearMonth].map((time) => (
          <TimerInfo
            key={`timerHistory-${yearMonth}-${time.id}`}
            edit={parseInt(editTime + "") == time.id}
            data={time}
          />
        ))}
      </ScrollArea>
    </section>
  );
}
