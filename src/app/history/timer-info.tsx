"use client";

import "@/lib/types";

import {
  AppWindow,
  Diamond,
  HelpCircle,
  SaveAll,
  Terminal,
  Trash,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
} from "react-swipeable-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import "react-swipeable-list/dist/styles.css";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function getIcon(timer: TimerWithDate, start: boolean) {
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
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TimerInfo({
  data,
  edit,
}: {
  data: TimerWithDate;
  edit: boolean;
}) {
  const [notes, setNotes] = useState(data.notes ? data.notes : "");

  const [start, setStart] = useState(
    data.start.toLocaleString("sv").replace(" ", "T")
  );
  const [end, setEnd] = useState(
    data.end
      ? data.end.toLocaleString("sv").replace(" ", "T")
      : new Date().toLocaleString("sv").replace(" ", "T")
  );

  const [visible, setVisible] = useState(edit);
  const [blockVisible, setBlockVisible] = useState(false);

  const [dragProgress, setDragProgress] = useState(0);

  const router = useRouter();

  if (!data.end) {
    return (
      <div
        className="w-full font-mono bg-backgroundSecondary rounded-md text-center mt-2 mb-2 pt-1 pb-1"
        onClick={() => setVisible(!visible)}
      >
        <p className="text-sm text-muted-foreground">Running Timer</p>
      </div>
    );
  }

  function sendRequest() {
    let request: any = {
      id: data.id,
      notes: notes,
    };

    let startChanged =
      start !== data.start.toLocaleString("sv").replace(" ", "T");
    let endChanged = end !== data.end?.toLocaleString("sv").replace(" ", "T");

    if (startChanged || endChanged) {
      if (startChanged) request.startType = "Website";
      if (endChanged) request.endType = "Website";

      if (start.trim() !== "") request.start = new Date(start).toUTCString();
      else return;
      if (end.trim() !== "") request.end = new Date(end).toUTCString();
      else return;
    }

    fetch("/api/times", {
      method: "PUT",
      body: JSON.stringify(request),
    })
      .then((result) => result.json())
      .then((result: APIResult) => {
        if (result.success) {
          setVisible(false);
          toast.success(`Successfully updated ${data.id}`);
          router.refresh();
        } else throw new Error(JSON.stringify(result));
      })
      .catch((e) => {
        toast.error("An error occurred", {
          description: `While updating ${data.id}. You could try it again.`,
        });
        console.error(e);
      });
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
          toast.info(`Successfully deleted ${data.id}`);
          router.refresh();
        } else throw new Error(JSON.stringify(result));
      })
      .catch((e) => {
        toast.error("An error occurred", {
          description: `While deleting ${data.id}. You could try it again.`,
        });
        console.error(e);
      });
  }

  // TODO: Visualize changes

  return (
    <>
      <SwipeableListItem
        onSwipeStart={() => setBlockVisible(true)}
        onSwipeEnd={() => {
          setDragProgress(0);
          setTimeout(() => setBlockVisible(false), 500);
        }}
        onSwipeProgress={(progress) => setDragProgress(progress)}
        trailingActions={
          <TrailingActions>
            <SwipeAction
              destructive={true}
              onClick={() => setTimeout(() => sendDeleteRequest(), 500)}
            >
              <div className="flex flex-row items-center justify-between w-full h-full p-2">
                <Trash2
                  className={`h-1/2 w-1/2 transition-all duration-200 ${
                    dragProgress > 50 ? "text-error" : "text-warning scale-50"
                  }`}
                />
              </div>
            </SwipeAction>
          </TrailingActions>
        }
        threshold={0.5}
        className="p-1"
      >
        <div
          className="w-full font-mono rounded-md text-center border border-border hover:border-ring cursor-pointer animate__animated animate__slideInLeft"
          onClick={() => {
            if (!blockVisible) setVisible(true);
          }}
        >
          <p className="text-content3 text-xs text-left pt-1 pl-3">
            {days[data.start.getDay()]} ({data.start.getDate()})
          </p>

          <div className="flex flex-row justify-evenly items-center">
            {getIcon(data, true)}

            <p>{data.start.toLocaleTimeString()}</p>

            <Separator orientation="horizontal" className="w-1/12" />

            <p>{data.end.toLocaleTimeString()}</p>

            {getIcon(data, false)}
          </div>

          <p
            className={`text-sm text-muted-foreground ${
              data.notes ? "" : "pb-2"
            }`}
          >
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
      </SwipeableListItem>

      <AlertDialog
        key={`timerModal-${data.id}`}
        open={visible}
        onOpenChange={(e) => setVisible(e)}
      >
        <AlertDialogContent className="w-[95%] max-w-xl rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex flex-row items-center justify-between">
              <div>Edit tracked time</div>
              <AlertDialogCancel variant="ghost" size="icon">
                <XCircle className="w-5 h-5" />
              </AlertDialogCancel>
            </AlertDialogTitle>
            <AlertDialogDescription></AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 min-h-[45dvh]">
            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="time">Time</TabsTrigger>
              </TabsList>
              <TabsContent value="notes">
                <Separator orientation="horizontal" className="w-full" />
                <div className="grid w-full gap-1.5 py-2">
                  <Label
                    htmlFor={`timerModal-notes-${data.id}`}
                    className="text-muted-foreground"
                  >
                    Notes
                  </Label>
                  <Textarea
                    id={`timerModal-notes-${data.id}`}
                    className="min-h-[25dvh] max-h-[55dvh]"
                    spellCheck={true}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="time">
                <Separator orientation="horizontal" className="w-full" />
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="name"
                      className="text-right text-muted-foreground"
                    >
                      Start
                    </Label>
                    <Input
                      className="col-span-3 font-mono"
                      type="datetime-local"
                      name="Updated"
                      id="updated"
                      step={1}
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="username"
                      className="text-right text-muted-foreground"
                    >
                      End
                    </Label>
                    <Input
                      className="col-span-3 font-mono"
                      type="datetime-local"
                      name="Created"
                      id="created"
                      step={1}
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="id"
                      className="text-right text-muted-foreground"
                    >
                      ID
                    </Label>
                    <Input
                      disabled
                      className="col-span-3 font-mono"
                      type="number"
                      name="Id"
                      id="id"
                      value={data.id}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Separator orientation="horizontal" className="w-full" />

          <AlertDialogFooter>
            <AlertDialogAction asChild variant="destructive">
              <Button onClick={() => sendDeleteRequest()}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogAction>
            <AlertDialogAction asChild variant="outline">
              <Button onClick={() => sendRequest()}>
                <SaveAll className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
