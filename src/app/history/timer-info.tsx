"use client";

import "@/lib/types";

import { SaveAll, Trash, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";

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
  const [state, setState] = useReducer(
    (prev: any, next: any) => ({
      ...prev,
      ...next,
    }),
    {
      notes: data.notes ? data.notes : "",
      start: data.start.toLocaleString("sv").replace(" ", "T"),
      end: data.end
        ? data.end.toLocaleString("sv").replace(" ", "T")
        : new Date().toLocaleString("sv").replace(" ", "T"),
      loading: false,
    }
  );

  const [visible, setVisible] = useState(edit);
  useEffect(() => {
    if (visible) {
      setState({
        notes: data.notes ? data.notes : "",
        start: data.start.toLocaleString("sv").replace(" ", "T"),
        end: data.end
          ? data.end.toLocaleString("sv").replace(" ", "T")
          : new Date().toLocaleString("sv").replace(" ", "T"),
      });
    }
  }, [visible]);

  const [blockVisible, setBlockVisible] = useState(false);

  const [dragProgress, setDragProgress] = useState(0);

  const router = useRouter();

  if (!data.end) {
    return (
      <div
        className="w-full font-mono bg-backgroundSecondary rounded-md text-center mt-2 mb-2 pt-1 pb-1 animate__animated animate__fadeIn"
        onClick={() => setVisible(!visible)}
      >
        <p className="text-sm text-muted-foreground">Running Timer</p>
      </div>
    );
  }

  async function sendRequest() {
    setState({
      loading: true,
    });

    let request: any = {
      id: data.id,
      notes: state.notes,
    };

    let startChanged =
      state.start !== data.start.toLocaleString("sv").replace(" ", "T");
    let endChanged =
      state.end !== data.end?.toLocaleString("sv").replace(" ", "T");

    if (startChanged || endChanged) {
      if (startChanged) request.startType = "Website";
      if (endChanged) request.endType = "Website";

      if (state.start.trim() == "" || state.end.trim() == "") {
        toast.warning("Missing data", {
          description: "Start or End time not set",
        });
        setState({
          loading: false,
        });
        return;
      }

      request.start = new Date(state.start).toUTCString();
      request.end = new Date(state.end).toUTCString();
    }

    const result = await fetch("/api/times", {
      method: "PUT",
      body: JSON.stringify(request),
    });

    setState({
      loading: false,
    });

    if (result.ok) {
      setVisible(false);

      toast.success("Successfully updated entry", {
        duration: 3000,
      });
      router.refresh();
      return;
    }

    const resultData: APIResult = await result.json();
    if (!resultData) {
      toast.error("An error occurred", {
        description: "Result could not be proccessed",
        important: true,
        duration: 8000,
      });
      return;
    }

    if (result.status == 400 && !!resultData.result[1]) {
      toast.warning(`An error occurred (${resultData.result[0]})`, {
        description: resultData.result[1],
        important: true,
        duration: 10000,
      });
      return;
    }

    toast.error("An error occurred", {
      description: "Error could not be identified. You can try again.",
      important: true,
      duration: 8000,
    });
  }

  async function sendDeleteRequest() {
    setState({
      loading: true,
    });

    const result = await fetch("/api/times", {
      method: "DELETE",
      body: JSON.stringify({
        id: data.id,
      }),
    });

    setState({
      loading: false,
    });

    if (result.ok) {
      setVisible(false);

      toast.success("Successfully deleted entry", {
        duration: 3000,
      });
      router.refresh();
      return;
    }

    const resultData: APIResult = await result.json();
    if (!resultData) {
      toast.error("An error occurred", {
        description: "Result could not be proccessed",
        important: true,
        duration: 8000,
      });
      return;
    }

    if (result.status == 400 && !!resultData.result[1]) {
      toast.warning(`An error occurred (${resultData.result[0]})`, {
        description: resultData.result[1],
        important: true,
        duration: 10000,
      });
      return;
    }

    toast.error("An error occurred", {
      description: "Error could not be identified. You can try again.",
      important: true,
      duration: 8000,
    });
  }

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
                  className={`text-destructive h-1/2 w-1/2 transition-all duration-200 ${
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
          className="w-full font-mono p-4 md:py-3 select-none rounded-sm text-center border border-border hover:border-ring cursor-pointer transition-all duration-300 animate__animated animate__slideInLeft"
          onClick={() => {
            if (!blockVisible) setVisible(true);
          }}
        >
          <p className="font-semibold text-xs text-muted-foreground text-left pb-2">
            {`${data.start.getDate().toString().padStart(2, "0")}.${(
              data.start.getMonth() + 1
            )
              .toString()
              .padStart(2, "0")} ${days[data.start.getDay()]}`}
          </p>

          <div className="flex flex-row justify-evenly items-center text-lg">
            <p>{data.start.toLocaleTimeString()}</p>
            <Separator orientation="horizontal" className="w-[5%]" />
            <p>{data.end.toLocaleTimeString()}</p>
          </div>

          <p className="text-xs text-muted-foreground">{data.time!}</p>

          {data.notes && (
            <>
              <div className="flex flex-row items-center p-2 gap-1">
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
              <div>Edit entry</div>
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
                <div className="grid w-full gap-1.5 py-4">
                  <Label
                    htmlFor={`timerModal-notes-${data.id}`}
                    className="text-muted-foreground pl-2"
                  >
                    Notes
                  </Label>
                  <Textarea
                    id={`timerModal-notes-${data.id}`}
                    className={`min-h-[25dvh] max-h-[55dvh] border-2 transition-all duration-300 ${
                      state.notes != (data.notes ? data.notes : "") &&
                      "border-sky-700"
                    }`}
                    spellCheck={true}
                    value={state.notes}
                    onChange={(e) => setState({ notes: e.target.value })}
                  />
                </div>
              </TabsContent>
              <TabsContent value="time">
                <Separator orientation="horizontal" className="w-full" />
                <div className="grid gap-4 py-4 w-full">
                  <div className="grid w-full items-center gap-1.5">
                    <Label
                      htmlFor="name"
                      className="pl-2 text-muted-foreground"
                    >
                      Start
                    </Label>
                    <Input
                      className={`w-full font-mono border-2 transition-all duration-300 ${
                        state.start !=
                          data.start.toLocaleString("sv").replace(" ", "T") &&
                        "border-sky-700"
                      }`}
                      type="datetime-local"
                      name="Updated"
                      id="updated"
                      step={1}
                      value={state.start}
                      onChange={(e) => setState({ start: e.target.value })}
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label
                      htmlFor="username"
                      className="pl-2 text-muted-foreground"
                    >
                      End
                    </Label>
                    <Input
                      className={`w-full font-mono border-2 transition-all duration-300 ${
                        state.end !=
                          (data.end
                            ? data.end.toLocaleString("sv").replace(" ", "T")
                            : new Date()
                                .toLocaleString("sv")
                                .replace(" ", "T")) && "border-sky-700"
                      }`}
                      type="datetime-local"
                      name="Created"
                      id="created"
                      step={1}
                      value={state.end}
                      onChange={(e) => setState({ end: e.target.value })}
                    />
                  </div>

                  <div id="divider" className="h-1" />

                  <div className="grid w-full items-center gap-1.5">
                    <Label
                      htmlFor="start-w"
                      className="pl-2 text-muted-foreground"
                    >
                      Started with
                    </Label>
                    <Input
                      disabled
                      className="w-full font-mono"
                      type="text"
                      name="started-with"
                      id="start-w"
                      value={data.startType + ""}
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label
                      htmlFor="stopped-w"
                      className="pl-2 text-muted-foreground"
                    >
                      Stopped with
                    </Label>
                    <Input
                      disabled
                      className="w-full font-mono"
                      type="text"
                      name="stopped-with"
                      id="stopped-w"
                      value={data.endType + ""}
                    />
                  </div>

                  <div id="divider" className="h-1" />

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="id" className="pl-2 text-muted-foreground">
                      ID
                    </Label>
                    <Input
                      disabled
                      className="w-full font-mono"
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
            <Button
              variant="destructive"
              onClick={() => sendDeleteRequest()}
              disabled={state.loading}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => sendRequest()}
              disabled={state.loading}
            >
              <SaveAll className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
