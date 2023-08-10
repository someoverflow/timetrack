"use client";

import "@/lib/types";

import { useCallback, useEffect, useState } from "react";

import { History, PlayCircle, StopCircle, Menu } from "lucide-react";
import { getTimePassed } from "@/lib/utils";
import Link from "next/link";

export default function TimerSection() {
  const [currentTimer, setCurrentTimer] = useState<Timer>();
  const [fetchedTimer, setFetchedTimer] = useState<Timer>();

  const [loaded, setLoaded] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const [running, setRunning] = useState(false);

  const [error, setError] = useState<string | undefined>();

  const count = useCallback(() => {
    if (!running) return;

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
  }, [currentTimer, fetchedTimer, running]);

  const fetchCurrentTimer = useCallback(() => {
    fetch("/api/times/current")
      .then((result) => result.json())
      .then((result) => {
        if (!firstRun) {
          setFirstRun(true);
          setLoaded(true);
        }

        if (result.data.length == 0) {
          setRunning(false);

          setFetchedTimer(undefined);
          setCurrentTimer(undefined);
        } else {
          let timer: Timer = result.data[0];
          setFetchedTimer(timer);

          setRunning(true);
        }
        count();
      })
      .catch((e) => {
        setError("updating");
        console.log(e);
      });
  }, [firstRun, count]);

  function toggleTimer(start: boolean) {
    setLoaded(false);
    if (start) {
      const data: any = {
        id: 0,
        start: new Date().toISOString(),
        startType: "Website",
      };
      setFetchedTimer(data);
      setCurrentTimer(undefined);

      count();

      setRunning(true);
    } else {
      setRunning(false);

      setFetchedTimer(undefined);
      setCurrentTimer(undefined);
    }

    fetch("/api/times/toggle?value=" + (start ? "start" : "stop"))
      .then((result) => result.json())
      .then(() => {
        setLoaded(true);
        if (start) fetchCurrentTimer();
      })
      .catch((e) => {
        setError("toggling");
        console.log(e);
      });
  }

  // First Effect
  useEffect(() => {
    fetchCurrentTimer();
  }, []);

  // Request Effect
  useEffect(() => {
    const requestIntervalId = setInterval(() => {
      if (!error) fetchCurrentTimer();
    }, 10000);
    return () => clearInterval(requestIntervalId);
  }, [error, firstRun, fetchCurrentTimer]);

  // Timer Effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!error && running) count();
    }, 500);
    return () => clearInterval(intervalId);
  }, [error, firstRun, running, count]);

  return (
    <>
      <div className="w-[80vw] max-w-sm bg-backgroundSecondary rounded-xl border border-border p-2 pt-4 pb-4">
        <div className="w-full h-full flex flex-col items-center gap-6 pb-2">
          <div className="flex items-center flex-row gap-2">
            <label
              htmlFor="sidebar-mobile-fixed"
              className="btn btn-outline btn-circle "
            >
              <Menu className="w-1/2 h-1/2" />
            </label>
            {(!loaded && (
              <>
                <button className="btn btn-rounded btn-loading">
                  Updating
                  {/* <DownloadCloud className="w-1/2 h-1/2" /> */}
                </button>
              </>
            )) || (
              <>
                {(!running && (
                  <span
                    className="tooltip tooltip-bottom"
                    data-tooltip="Start now with Website"
                  >
                    <button
                      className="btn btn-solid-success btn-rounded font-mono gap-2"
                      onClick={() => toggleTimer(true)}
                    >
                      <PlayCircle className="w-1/2 h-1/2" />
                      <p>Start</p>
                    </button>
                  </span>
                )) || (
                  <span
                    className="tooltip tooltip-bottom"
                    data-tooltip={`Started with ${currentTimer?.startType}`}
                  >
                    <button
                      className="btn btn-solid-error btn-rounded font-mono gap-2"
                      onClick={() => toggleTimer(false)}
                    >
                      <StopCircle className="w-1/2 h-1/2" />
                      <p>Stop</p>
                    </button>
                  </span>
                )}
              </>
            )}
            <Link href="/history" className="btn btn-solid-primary btn-circle">
              <History className="w-1/2 h-1/2" />
            </Link>
          </div>

          <h1 className="text-5xl font-bold font-mono">
            {running && currentTimer?.time ? currentTimer?.time : "00:00:00"}
          </h1>

          <div className="flex w-full justify-center gap-4">
            {(running && currentTimer?.start && (
              <p className="text-content2">{currentTimer?.start + ""}</p>
            )) || <div className="skeleton h-6 w-1/4 rounded-lg"></div>}

            <div className="divider divider-vertical mx-0 h-6"></div>

            {(running && currentTimer?.end && (
              <p className="text-content2">{currentTimer?.end + ""}</p>
            )) || <div className="skeleton h-6 w-1/4 rounded-lg"></div>}
          </div>
        </div>
      </div>

      {error && (
        <>
          <div className="absolute bottom-2 alert alert-error max-w-sm w-[95vw]">
            <div className="flex flex-col">
              <span>
                <b>An error occurred ({error})</b>
              </span>
              <span className="text-content2">
                Try to reload the page to fix the problem
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
