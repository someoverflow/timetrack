"use client";

import "@/lib/types";

import { useCallback, useEffect, useReducer, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { toast } from "sonner";

import { PlayCircle, RefreshCcw, StopCircle, X } from "lucide-react";
import { getTimePassed } from "@/lib/utils";
import Link from "next/link";

export default function TimerSection() {
  const [data, updateData] = useReducer(
    (prev: any, next: any) => ({
      ...prev,
      ...next,
    }),
    {
      firstRun: false,
      loaded: false,
      running: false,
      changeModal: false,
      changeTimer: undefined,
      stop: false,
    }
  );

  const [currentTimer, setCurrentTimer] = useState<Timer>();
  const [fetchedTimer, setFetchedTimer] = useState<Timer>();

  const count = useCallback(() => {
    if (!data.running) return;
    if (!currentTimer && !fetchedTimer) return;

    let result = JSON.parse(
      JSON.stringify(currentTimer ? currentTimer : fetchedTimer)
    );

    const startDate = new Date(
      Date.parse(fetchedTimer ? fetchedTimer.start : result.start)
    );
    startDate.setMilliseconds(0);
    const currentDate = new Date();
    currentDate.setMilliseconds(0);

    const timePassed = getTimePassed(startDate, currentDate);

    result.state = "stop";

    result.start = startDate.toLocaleTimeString();
    result.end = currentDate.toLocaleTimeString();

    result.time = timePassed;

    setCurrentTimer(result);
  }, [currentTimer, fetchedTimer, data.running]);

  const fetchCurrentTimer = useCallback(() => {
    fetch("/api/times?indicator=current")
      .then((result) => result.json())
      .then((result) => {
        if (result.success == false) {
          updateData({
            stop: true,
          });
          toast.error("An error occurred while updating", {
            description: "Reloading the page could solve the problem",
          });
          console.error(result);
          return;
        }

        if (!data.firstRun) {
          updateData({
            firstRun: true,
            loaded: true,
          });
        }

        if (result.result.length == 0) {
          updateData({
            running: false,
          });

          setFetchedTimer(undefined);
          setCurrentTimer(undefined);
        } else {
          let timer: Timer = result.result[0];
          setFetchedTimer(timer);

          updateData({
            running: true,
          });
        }
        count();
      })
      .catch((e) => {
        updateData({
          stop: true,
        });
        toast.error("An error occurred while updating", {
          description: "Reloading the page could solve the problem",
        });
        console.error(e);
      });
  }, [data.firstRun, count]);

  function toggleTimer(start: boolean) {
    updateData({
      loaded: false,
    });

    let data: any = {
      id: 0,
      start: new Date().toISOString(),
      startType: "Website",
    };

    if (start) {
      setFetchedTimer(data);
      setCurrentTimer(undefined);

      count();

      updateData({
        running: true,
      });
    } else {
      updateData({
        changeModal: true,
        changeTimer: currentTimer?.id,
        running: false,
      });

      setFetchedTimer(undefined);
      setCurrentTimer(undefined);
    }

    fetch(
      `/api/times/toggle?type=Website&fixTime=${data.start}&value=${
        start ? "start" : "stop"
      }`,
      { method: "PUT" }
    )
      .then((result) => result.json())
      .then(() => {
        updateData({
          loaded: true,
        });
        if (start) fetchCurrentTimer();
      })
      .catch((e) => {
        updateData({
          stop: true,
        });
        toast.warning(
          `An error occurred while ${start ? "starting" : "stopping"}`,
          {
            description: "Reloading the page could solve the problem",
          }
        );
        console.error(e);
      });
  }

  // First Effect
  useEffect(() => {
    fetchCurrentTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request Effect
  useEffect(() => {
    const requestIntervalId = setInterval(() => {
      if (!data.stop) fetchCurrentTimer();
    }, 10000);
    return () => clearInterval(requestIntervalId);
  }, [data.stop, fetchCurrentTimer]);

  // Timer Effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!data.stop && data.running) count();
    }, 500);
    return () => clearInterval(intervalId);
  }, [data.stop, data.running, count]);

  // Bottom Section
  function CurrentTimerTimeA() {
    if (data.running && currentTimer) {
      return (
        <div className="flex w-full justify-center items-center gap-4">
          <p className="text-muted-foreground">{currentTimer.start + ""}</p>
          <Separator orientation="vertical" className="h-5" />
          <p className="text-muted-foreground">{currentTimer.end + ""}</p>
        </div>
      );
    }

    return (
      <div className="flex w-full justify-center items-center gap-4">
        <Skeleton className=" h-6 w-1/4 rounded-lg" />
        <Separator orientation="vertical" className="h-5" />
        <Skeleton className=" h-6 w-1/4 rounded-lg" />
      </div>
    );
  }

  return (
    <>
      <div>
        <Card className="w-[350px]">
          <CardHeader>
            <div className="w-full flex justify-center items-center flex-row gap-2">
              <ToggleSection
                loaded={data.loaded}
                running={data.running}
                startType={currentTimer?.startType + ""}
                toggleTimer={toggleTimer}
              />
              {/* <Link
                  href="/history"
                  className="btn btn-solid-primary btn-circle"
                >
                  <History className="w-1/2 h-1/2" />
                </Link> */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-full flex flex-col items-center gap-6 pb-2">
              <h1 className="text-5xl font-bold font-mono select-none">
                {data.running && currentTimer?.time
                  ? currentTimer?.time
                  : "00:00:00"}
              </h1>
              <CurrentTimerTime
                running={data.running}
                currentTimer={currentTimer}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={data.changeModal}
        onOpenChange={(e) => updateData({ changeModal: e })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit time and notes</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to edit your stopped timer now or later?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Later</AlertDialogCancel>
            <AlertDialogAction asChild variant="outline">
              <Link href={`/history?edit=${data.changeTimer}`} prefetch={false}>
                Now
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ToggleSection({
  loaded,
  running,
  startType,
  toggleTimer,
}: {
  loaded: boolean;
  running: boolean;
  startType: string;
  toggleTimer: Function;
}) {
  if (!loaded) {
    return (
      <Button className="btn-lg btn-loading" disabled>
        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
        Updating
      </Button>
    );
  }

  if (running) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="font-mono" onClick={() => toggleTimer(false)}>
            <StopCircle className="mr-2 h-4 w-4" />
            <p>Stop</p>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{`Started with ${startType}`}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button className="font-mono" onClick={() => toggleTimer(true)}>
          <PlayCircle className="mr-2 h-4 w-4" />
          <p>Start</p>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Start now with Website</p>
      </TooltipContent>
    </Tooltip>
  );
}

function CurrentTimerTime({
  running,
  currentTimer,
}: {
  running: boolean;
  currentTimer: Timer | undefined;
}) {
  if (running && currentTimer) {
    return (
      <div className="flex w-full justify-center items-center gap-4">
        <p className="text-muted-foreground">{currentTimer.start + ""}</p>
        <Separator orientation="vertical" className="h-5" />
        <p className="text-muted-foreground">{currentTimer.end + ""}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center items-center gap-4">
      <Skeleton className=" h-6 w-1/4 rounded-lg" />
      <Separator orientation="vertical" className="h-5" />
      <Skeleton className=" h-6 w-1/4 rounded-lg" />
    </div>
  );
}
