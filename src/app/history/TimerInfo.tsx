"use client";

import {
  AppWindow,
  Diamond,
  HelpCircle,
  SaveAll,
  Terminal,
  Trash,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

function getIcon(timer: I_Time, start: boolean) {
  switch (start ? timer.startType : timer.endType) {
    case "Website":
      return <AppWindow className="w-4 h-4" />;
    case "Chip":
      return <Diamond className="w-4 h-4" />;
    case "API":
      return <Terminal className="w-4 h-4" />;
    default:
      return <HelpCircle className="w-4 h-4" />;
  }
}

const days = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

export default function TimerInfo({ data }: { data: I_Time }) {
  const [notes, setNotes] = useState(data.notes ? data.notes : "");

  const [start, setStart] = useState(
    data.start.toLocaleString("sv").replace(" ", "T")
  );
  const [end, setEnd] = useState(
    data.end
      ? data.end.toLocaleString("sv").replace(" ", "T")
      : new Date().toLocaleString("sv").replace(" ", "T")
  );

  const [visible, setVisible] = useState(false);

  const router = useRouter();

  if (!data.end) return <></>;

  function sendRequest() {
    var request: any = {
      id: data.id,
      notes: notes,
    };

    var startChanged =
      start !== data.start.toLocaleString("sv").replace(" ", "T");
    var endChanged = end !== data.end?.toLocaleString("sv").replace(" ", "T");

    if (startChanged || endChanged) {
      if (startChanged) request.startType = "Website";
      if (endChanged) request.endType = "Website";

      if (start.trim() !== "") request.start = new Date(start).toUTCString();
      else return;
      if (end.trim() !== "") request.end = new Date(end).toUTCString();
      else return;
    }

    fetch("/api/times", {
      method: "POST",
      body: JSON.stringify(request),
    })
      .then((result) => result.json())
      .then((result) => {
        if (result.result) {
          setVisible(false);

          router.refresh();
        }
        console.log(result);
      })
      .catch(console.error);
  }

  function sendDeleteRequest() {
    fetch("/api/times", {
      method: "DELETE",
      body: JSON.stringify({
        id: data.id,
      }),
    })
      .then((result) => result.json())
      .then((result) => {
        if (result.result) {
          setVisible(false);

          router.refresh();
        }
        console.log(result);
      })
      .catch(console.error);
  }

  return (
    <>
      <div
        className="w-full font-mono bg-backgroundSecondary rounded-md text-center border border-border hover:scale-105 cursor-pointer"
        onClick={() => setVisible(!visible)}
      >
        <p className="text-content3 text-xs text-left pt-1 pl-3">
          {days[data.start.getDay()]} ({data.start.getDate()})
        </p>

        <div className="flex flex-row justify-evenly items-center">
          {getIcon(data, true)}

          <p>{data.start.toLocaleTimeString()}</p>

          <div className="divider w-1/12"></div>

          <p>{data.end.toLocaleTimeString()}</p>

          {getIcon(data, false)}
        </div>
        <p className={`text-sm text-content2 ${data.notes ? "" : "pb-2"}`}>
          {data.time}
        </p>
        {data.notes && (
          <>
            <div className="flex flex-row items-center p-1 pt-0 gap-1">
              <div className="divider divider-vertical h-3 w-2 ml-0 mr-0"></div>
              <p className="text-xs text-content3 text-left">
                {data.notes?.split("\n")[0]}
                {data.notes?.split("\n").length > 1 ? "…" : ""}
              </p>
            </div>
          </>
        )}
      </div>

      <input
        className="modal-state"
        id={`timerModal-${data.id}`}
        type="checkbox"
        checked={visible}
        onChange={(e) => setVisible(e.target.checked)}
      />
      <div className="modal">
        <label
          className="modal-overlay"
          htmlFor={`timerModal-${data.id}`}
        ></label>
        <div className="modal-content border border-border flex flex-col w-[95%] max-w-xl">
          <div className="w-full flex flex-row justify-between items-center">
            <h2 className="text-xl text-content1">
              Edit <span className="badge badge-flat-primary">{data.time}</span>
            </h2>
            <div>
              <label
                htmlFor={`timerModal-${data.id}`}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <XCircle className="w-1/2 h-1/2" />
              </label>
            </div>
          </div>

          <div className="divider"></div>

          <div className="w-full flex flex-col gap-2">
            <p className="pl-2 text-content2 text-left">Notes</p>
            <textarea
              className="textarea textarea-block min-h-[25vh]"
              spellCheck={true}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="divider"></div>

          <div className="flex flex-col gap-2">
            <p className="pl-2 text-content2 text-left">Start</p>
            <input
              className="input input-block"
              type="datetime-local"
              name="Updated"
              id="updated"
              step={1}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <p className="pl-2 text-content2 text-left">End</p>
            <input
              className="input input-block"
              type="datetime-local"
              name="Created"
              id="created"
              step={1}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <div className="divider"></div>

          <div className="w-full flex flex-row justify-center gap-2">
            <button
              className="btn btn-solid-error btn-circle"
              onClick={() => sendDeleteRequest()}
            >
              <Trash className="w-1/2 h-1/2" />
            </button>
            <button
              className="btn btn-solid-success btn-circle"
              onClick={() => sendRequest()}
            >
              <SaveAll className="w-1/2 h-1/2" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
