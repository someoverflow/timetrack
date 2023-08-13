"use client";

import "@/lib/types";

import { useCallback, useEffect, useState } from "react";

import { History, PlayCircle, StopCircle, Menu, X } from "lucide-react";
import { getTimePassed } from "@/lib/utils";
import Link from "next/link";

export default function TimerSection() {
  const [currentTimer, setCurrentTimer] = useState<Timer>();
  const [fetchedTimer, setFetchedTimer] = useState<Timer>();

  const [loaded, setLoaded] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const [running, setRunning] = useState(false);

  const [changeModal, setChangeModal] = useState(false);
  const [changeTimer, setChangeTimer] = useState<number | undefined>();

  const [error, setError] = useState<InfoDetails | undefined>();

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
    fetch("/api/times?indicator=current")
      .then((result) => result.json())
      .then((result) => {
        if (result.success == false) {
          setError({
            type: "error",
            title: "An error occurred while updating",
            content: "Reloading the page could solve the problem",
          });
          console.error(result);
          return;
        }

        if (!firstRun) {
          setFirstRun(true);
          setLoaded(true);
        }

        if (result.result.length == 0) {
          setRunning(false);

          setFetchedTimer(undefined);
          setCurrentTimer(undefined);
        } else {
          let timer: Timer = result.result[0];
          setFetchedTimer(timer);

          setRunning(true);
        }
        count();
      })
      .catch((e) => {
        setError({
          type: "error",
          title: "An error occurred while updating",
          content: "Reloading the page could solve the problem",
        });
        console.error(e);
      });
  }, [firstRun, count]);

  function toggleTimer(start: boolean) {
    setLoaded(false);

    let data: any = {
      id: 0,
      start: new Date().toISOString(),
      startType: "Website",
    };

    if (start) {
      setFetchedTimer(data);
      setCurrentTimer(undefined);

      count();

      setRunning(true);
    } else {
      setChangeTimer(currentTimer?.id);
      setChangeModal(true);

      setRunning(false);

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
        setLoaded(true);
        if (start) fetchCurrentTimer();
      })
      .catch((e) => {
        setError({
          type: "warning",
          title: `An error occurred while ${start ? "starting" : "stopping"}`,
          content: "Reloading the page could solve the problem",
        });
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
      if (!error) fetchCurrentTimer();
    }, 10000);
    return () => clearInterval(requestIntervalId);
  }, [error, fetchCurrentTimer]);

  // Timer Effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!error && running) count();
    }, 500);
    return () => clearInterval(intervalId);
  }, [error, running, count]);

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
                <button className="btn btn-rounded btn-lg btn-loading">
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
                      className="btn btn-solid-success btn-rounded btn-lg font-mono gap-2"
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
                      className="btn btn-solid-error btn-rounded btn-lg font-mono gap-2"
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

      <input
        className="modal-state"
        id="editlast-modal"
        type="checkbox"
        checked={changeModal}
        onChange={(e) => setChangeModal(e.target.checked)}
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
              href={`/history?edit=${changeTimer}`}
              prefetch={false}
              className="btn btn-solid-primary btn-block"
            >
              Edit Now
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <>
          <div
            className={`absolute max-w-sm w-[95vw] bottom-2 alert ${
              error.type == "warning" && "alert-warning"
            } ${error.type == "error" && "alert-error"}`}
          >
            <div className="flex flex-col">
              <span className="text-content1 text-base font-bold">
                {error.title}
              </span>
              <span className="text-content2 text-sm">{error.content}</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
