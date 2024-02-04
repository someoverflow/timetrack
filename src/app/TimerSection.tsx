"use client";

import "@/lib/types";

import { useCallback, useEffect, useReducer, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        running: true,
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

  return (
    <>
      <div>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>
              Deploy your new project in one-click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full flex items-center flex-row gap-2">
              {(!data.loaded && (
                <>
                  <Button className="btn-lg btn-loading" disabled>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Updating
                  </Button>
                </>
              )) || (
                <>
                  {(!data.running && (
                    <span
                      className="tooltip tooltip-bottom"
                      data-tooltip="Start now with Website"
                    >
                      <Button
                        className="font-mono"
                        onClick={() => toggleTimer(true)}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        <p>Start</p>
                      </Button>
                    </span>
                  )) || (
                    <span
                      className="tooltip tooltip-bottom"
                      data-tooltip={`Started with ${currentTimer?.startType}`}
                    >
                      <Button
                        className="font-mono"
                        onClick={() => toggleTimer(false)}
                      >
                        <StopCircle className="mr-2 h-4 w-4" />
                        <p>Stop</p>
                      </Button>
                    </span>
                  )}
                </>
              )}
              {/* <Link
                  href="/history"
                  className="btn btn-solid-primary btn-circle"
                >
                  <History className="w-1/2 h-1/2" />
                </Link> */}
            </div>

            <div className="w-full h-full flex flex-col items-center gap-6 pb-2">
              <h1 className="text-5xl font-bold font-mono">
                {data.running && currentTimer?.time
                  ? currentTimer?.time
                  : "00:00:00"}
              </h1>

              <div className="flex w-full justify-center items-center gap-4">
                {(data.running && currentTimer?.start && (
                  <p className="text-muted-foreground">
                    {currentTimer?.start + ""}
                  </p>
                )) || <Skeleton className=" h-6 w-1/4 rounded-lg" />}

                <Separator orientation="vertical" className="h-5" />

                {(data.running && currentTimer?.end && (
                  <p className="text-muted-foreground">
                    {currentTimer?.end + ""}
                  </p>
                )) || <Skeleton className=" h-6 w-1/4 rounded-lg" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <input
        className="modal-state"
        id="editlast-modal"
        type="checkbox"
        checked={data.changeModal}
        onChange={(e) => updateData({ changeModal: e.target.checked })}
      />
      <div className="modal">
        <label className="modal-overlay" htmlFor="editlast-modal"></label>
        <div className="modal-content flex flex-col gap-5">
          <label
            htmlFor="editlast-modal"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          >
            <X className="w-1/2 h-1/2" />
          </label>
          <h2 className="text-xl">Edit?</h2>
          <p className="flex flex-col text-content2">
            <span>You have just stopped a timer.</span>
            <span>Do you want to edit it directly now?</span>
          </p>
          <div className="flex gap-3">
            <label htmlFor="editlast-modal" className="btn btn-solid-error">
              Close
            </label>

            <Link
              href={`/history?edit=${data.changeTimer}`}
              prefetch={false}
              className="btn btn-solid-primary btn-block"
            >
              Edit Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
