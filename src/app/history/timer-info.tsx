"use client";

//#region Imports
import type { Prisma, Time } from "@prisma/client";
import type { timesPutApiValidation } from "@/lib/zod";

import {
  LeadingActions,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
} from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Coffee,
  MailCheck,
  MailMinus,
  SaveAll,
  Trash,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useCallback, useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn, formatDate, getTimePassed } from "@/lib/utils";
import useRequest from "@/lib/hooks/useRequest";
import { ProjectSelection } from "@/components/project-select";
//#endregion

interface timerInfoState {
  notes: string;
  start: string;
  end: string;

  invoiced: boolean;

  traveledDistance: number | null;

  breakTime: number;

  projectSelectionOpen: boolean;
  projectName: string | null;
}

export default function TimerInfo({
  timer,
  projects,
  edit = false,
  user,
}: {
  timer: Prisma.TimeGetPayload<{
    include: { project: true };
  }>;
  projects: Projects;
  edit?: boolean;
  user: string | undefined;
}) {
  const t = useTranslations("History");
  const router = useRouter();

  const [blockVisible, setBlockVisible] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [visible, setVisible] = useState(edit);

  const generateReducer = (): timerInfoState => {
    return {
      notes: timer.notes ?? "",
      start: formatDate(timer.start),
      end: formatDate(timer.end ?? new Date()),

      invoiced: timer.invoiced,

      breakTime: timer.breakTime,

      traveledDistance: timer.traveledDistance ?? null,

      projectSelectionOpen: false,
      projectName: timer.projectName,
    };
  };
  const [state, setState] = useReducer(
    (prev: timerInfoState, next: Partial<timerInfoState>) => ({
      ...prev,
      ...next,
    }),
    generateReducer(),
  );
  useEffect(() => {
    // Reset everything when opening/closing
    if (visible) setState(generateReducer());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (timer.end === null && !visible) {
      const interval = setInterval(
        () => setState({ end: formatDate(new Date()) }),
        1000,
      );
      return () => clearInterval(interval);
    }
  }, [timer.end, visible]);

  const { status: updateStatus, send: sendUpdate } = useRequest(
    useCallback(
      (passed: { stop: boolean } | undefined) => {
        const request: timesPutApiValidation = {
          id: timer.id,
          notes: state.notes,
          invoiced:
            timer.invoiced !== state.invoiced ? state.invoiced : undefined,
          breakTime: state.breakTime,
        };

        // Handle start change
        if (state.start !== formatDate(timer.start)) {
          request.startType = "Website";
          request.start = new Date(state.start).toISOString();
        }

        // Handle stop and end change
        if (
          passed?.stop &&
          (!timer.end || state.end !== formatDate(timer.end))
        ) {
          request.endType = "Website";
          request.end = new Date(state.end).toISOString();
        }

        // Only add project if it has changed
        if (state.projectName !== timer.projectName) {
          request.project = state.projectName;
        }

        // Only add traveledDistance if it has changed
        if (state.traveledDistance !== timer.traveledDistance) {
          request.traveledDistance = state.traveledDistance;
        }

        return fetch("/api/times", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });
      },
      [timer, state],
    ),
    (_result) => {
      setVisible(false);
      toast.success(t("Miscellaneous.updated"), {
        duration: 3_000,
      });
      router.refresh();
    },
  );
  const { status: invoicedStatus, send: sendInvoiced } = useRequest(
    (passed: { invoiced: boolean } | undefined) => {
      const request: timesPutApiValidation = {
        id: timer.id,
        invoiced: passed?.invoiced,
      };

      return fetch("/api/times", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
    },
    (_result) => {
      setVisible(false);

      toast.success(t("Miscellaneous.updated"), {
        duration: 3_000,
      });
      router.refresh();
    },
  );
  const { status: deleteStatus, send: sendDelete } = useRequest(
    () =>
      fetch("/api/times", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: timer.id,
        }),
      }),
    (result) => {
      setVisible(false);

      const undoTime: Time = result.result;

      const start = new Date(undoTime.start);
      const end = undoTime.end ? new Date(undoTime.end) : undefined;

      const toastDescription = `${start.toLocaleDateString()} • ${start.toLocaleTimeString()} → ${end ? end.toLocaleTimeString() : "--:--:--"}`;

      toast.success(t("Miscellaneous.deleted"), {
        description: toastDescription,
        duration: 30_000,
        action: undoTime.end
          ? {
              label: t("Miscellaneous.undo"),
              onClick: () => {
                async () => {
                  try {
                    const response = await fetch("/api/times", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        userId: timer.userId,
                        start: undoTime.start,
                        end: undoTime.end,
                        startType: undoTime.startType ?? undefined,
                        endType: undoTime.endType ?? undefined,
                        breakTime: undoTime.breakTime,
                        project: undoTime.projectName ?? undefined,
                        notes: undoTime.notes ?? "",
                        traveledDistance: undoTime.traveledDistance ?? null,
                      }),
                    });

                    if (!response.ok) {
                      throw new Error(`Error: ${response.statusText}`);
                    }

                    router.refresh();
                  } catch (error) {
                    console.error("Failed to undo:", error);
                    toast.error(t("Miscellaneous.errorUndo"), {
                      duration: 5000,
                    });
                  }
                };
              },
            }
          : undefined,
      });

      router.refresh();
    },
  );

  const preventClosing = useCallback(() => {
    if (
      deleteStatus.loading ||
      updateStatus.loading ||
      invoicedStatus.loading
    ) {
      return true; // Prevent closing if any of the loading states are true
    }

    // Check if notes have changed
    if (state.notes !== (timer.notes ?? "")) {
      return true;
    }

    // Check if breakTime has changed
    if (state.breakTime != timer.breakTime) {
      return true;
    }

    // Check if start time has changed
    if (state.start != formatDate(timer.start)) {
      return true;
    }

    // Check if end time has changed (if end is defined)
    if (timer.end && state.end != formatDate(timer.end)) {
      return true;
    }

    // Check if traveledDistance has changed
    if (state.traveledDistance !== (timer.traveledDistance ?? null)) {
      return true;
    }

    // Check if project name has changed or project selection is open
    if (state.projectName !== timer.projectName || state.projectSelectionOpen) {
      return true;
    }

    return false; // No changes detected, allow closing
  }, [timer, state, updateStatus, deleteStatus, invoicedStatus]);

  const notes = (() => {
    const lines = timer.notes?.split("\n") ?? []; // Split notes into lines
    const firstLine = lines[0]; // Get the first line

    if (!firstLine) return undefined; // Return undefined if no first line

    const hasMultipleLines = lines.length > 1; // Check if there are multiple lines

    // Format the first line based on its content
    if (firstLine.startsWith("- ")) {
      return `${firstLine.replace("- ", "")}${hasMultipleLines ? " …" : ""}`; // Add ellipsis if there are more lines
    }

    return hasMultipleLines ? `${firstLine} …` : firstLine; // Add ellipsis if there are more lines
  })();

  return (
    <>
      <SwipeableListItem
        onSwipeStart={() => setBlockVisible(true)}
        onSwipeEnd={() => {
          setDragProgress(0);
          setTimeout(() => setBlockVisible(false), 500);
        }}
        onSwipeProgress={(progress) => setDragProgress(progress)}
        leadingActions={
          <LeadingActions>
            <SwipeAction
              onClick={() =>
                setTimeout(() => {
                  sendInvoiced({ invoiced: !timer.invoiced });
                }, 500)
              }
            >
              <div className="flex h-full w-full flex-row items-center justify-between p-2">
                {timer.invoiced ? (
                  <MailMinus
                    className={cn(
                      "h-1/2 w-1/2 text-destructive transition-all duration-200",
                      dragProgress > 50
                        ? "text-blue-800"
                        : "scale-50 text-indigo-500",
                    )}
                  />
                ) : (
                  <MailCheck
                    className={cn(
                      "h-1/2 w-1/2 text-destructive transition-all duration-200",
                      dragProgress > 50
                        ? "text-blue-800"
                        : "scale-50 text-indigo-500",
                    )}
                  />
                )}
              </div>
            </SwipeAction>
          </LeadingActions>
        }
        trailingActions={
          <TrailingActions>
            <SwipeAction
              destructive
              onClick={() =>
                setTimeout(() => {
                  sendDelete();
                }, 500)
              }
            >
              <div className="flex h-full w-full flex-row items-center justify-between p-2">
                <Trash2
                  className={cn(
                    "h-1/2 w-1/2 text-destructive transition-all duration-200",
                    dragProgress > 50
                      ? "text-red-800"
                      : "scale-50 text-red-500",
                  )}
                />
              </div>
            </SwipeAction>
          </TrailingActions>
        }
        threshold={0.5}
        className="p-1"
      >
        <div
          className={cn(
            "animate__animated animate__slideInLeft w-full cursor-pointer select-none rounded-sm border-2 border-border p-2 font-mono transition-all duration-300 hover:border-ring",
            timer.invoiced && "border-border/50",
          )}
          onClick={() => setVisible(blockVisible ? visible : true)}
          onKeyDown={() => setVisible(blockVisible ? visible : true)}
        >
          <div className="flex items-center justify-between pb-2">
            {timer.project ? (
              <Badge variant="secondary" className="gap-2 text-xs">
                {timer.project.customerName && (
                  <span className="text-muted-foreground">
                    {timer.project.customerName}
                  </span>
                )}
                {timer.project.name}
              </Badge>
            ) : (
              <div className="pb-4" />
            )}

            {user && <Badge variant="outline">{user}</Badge>}
            {/* <div
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked
                onCheckedChange
                disabled
              />
            </div> */}
          </div>

          <div className="flex flex-row items-center justify-evenly text-lg">
            <p className="flex flex-row items-center">
              {timer.start.toLocaleTimeString()}
            </p>
            <div className="relative flex flex-col items-center">
              {!!timer.breakTime && (
                <div className="absolute -top-5 font-sans text-xs text-muted-foreground">
                  <div className="flex flex-row items-center justify-center">
                    <Coffee className="mr-1 size-4" />
                    {timer.breakTime.toLocaleString()}
                    <sub className="ml-0.5">min</sub>
                  </div>
                </div>
              )}
              <Separator orientation="horizontal" className="w-10" />
              <p className="absolute -bottom-5 text-xs text-muted-foreground/80">
                {timer.time ??
                  getTimePassed(
                    timer.start,
                    new Date(state.end),
                    timer.breakTime,
                  ) ??
                  "00:00:00"}
              </p>
            </div>
            <p className={timer.end ? "" : "opacity-50"}>
              {new Date(state.end).toLocaleTimeString()}
            </p>
          </div>

          <p
            className={cn(
              "max-w-52 truncate p-2 pt-4 text-start font-sans text-xs text-muted-foreground/90",
            )}
          >
            {notes}
          </p>
        </div>
      </SwipeableListItem>

      <Dialog
        key={`timer-modal-${timer.id}`}
        open={visible}
        onOpenChange={(e) => setVisible(e)}
      >
        <DialogContent
          className="flex w-[95vw] max-w-xl flex-col justify-between rounded-lg"
          onPointerDownOutside={(e) => {
            if (preventClosing()) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (preventClosing()) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              <div>{t("Dialogs.Edit.title")}</div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex w-full flex-col gap-2">
            <Tabs defaultValue="details">
              <TabsList className="flex w-full">
                <TabsTrigger className="w-full" value="details">
                  {t("Dialogs.Edit.details")}
                </TabsTrigger>
                <TabsTrigger className="w-full" value="time">
                  {t("Dialogs.Edit.time")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <ScrollArea
                  className="h-[60svh] w-full overflow-hidden rounded-sm p-2.5"
                  type="always"
                >
                  <div>
                    <div className="grid h-full w-full gap-1.5 p-1">
                      <Label
                        htmlFor="projects-button"
                        className={cn(
                          "pl-2 text-muted-foreground transition-colors",
                          state.projectName !== timer.projectName
                            ? "text-blue-500"
                            : "",
                        )}
                      >
                        {t("Dialogs.Edit.project")}
                      </Label>
                      <ProjectSelection
                        project={state.projectName ?? undefined}
                        changeProject={(e) =>
                          setState({ projectName: e ?? null })
                        }
                        projects={projects}
                      />
                    </div>

                    <div id="divider" className="h-4" />

                    <div className="grid h-full w-full gap-1.5 p-1">
                      <Label
                        htmlFor={`timerModal-notes-${timer.id}`}
                        className={cn(
                          "pl-2 text-muted-foreground transition-colors",
                          state.notes !== (timer.notes ?? "")
                            ? "text-blue-500"
                            : "",
                        )}
                      >
                        {t("Dialogs.Edit.notes")}
                      </Label>
                      <Textarea
                        id={`timerModal-notes-${timer.id}`}
                        className="h-full max-h-[50svh] min-h-[30svh] border-2"
                        spellCheck={true}
                        value={state.notes}
                        onChange={(e) => setState({ notes: e.target.value })}
                      />
                    </div>

                    <div id="divider" className="h-2" />

                    <div
                      className={cn(
                        "flex flex-row items-center gap-2 border-l-2 p-2 transition-all",
                        timer.invoiced !== state.invoiced
                          ? "border-blue-500"
                          : "",
                      )}
                    >
                      <Checkbox
                        id="invoiced"
                        checked={state.invoiced}
                        onCheckedChange={() =>
                          setState({ invoiced: !state.invoiced })
                        }
                      />
                      <Label
                        htmlFor="invoiced"
                        className="text-muted-foreground"
                      >
                        {t("Miscellaneous.invoicedSingular")}
                      </Label>
                    </div>

                    <div id="divider" className="h-4" />

                    <div className="grid h-full w-full gap-1.5 p-1">
                      <Label
                        htmlFor="distance-button"
                        className={cn(
                          "pl-2 text-muted-foreground transition-colors",
                          state.traveledDistance !== timer.traveledDistance
                            ? "text-blue-500"
                            : "",
                        )}
                      >
                        {t("Dialogs.Edit.distance")}
                      </Label>
                      <Input
                        id="distance-button"
                        type="number"
                        min={0}
                        className="w-full border-2"
                        onChange={(change) => {
                          const target = change.target.valueAsNumber;
                          setState({
                            traveledDistance: Number.isNaN(target)
                              ? null
                              : target,
                          });
                        }}
                        value={state.traveledDistance ?? ""}
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="time" className="h-full">
                <ScrollArea
                  className="h-[60svh] w-full overflow-hidden rounded-sm p-2.5"
                  type="always"
                >
                  <div className="grid w-full gap-4 p-1">
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="start"
                        className={cn(
                          "pl-2 text-muted-foreground transition-colors",
                          state.start !== formatDate(timer.start)
                            ? "text-blue-500"
                            : "",
                        )}
                      >
                        {t("Dialogs.Edit.start")}
                      </Label>
                      <Input
                        className="w-full appearance-none border-2 font-mono"
                        type="datetime-local"
                        name="Start"
                        id="start"
                        step={1}
                        value={state.start}
                        onChange={(e) => setState({ start: e.target.value })}
                      />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="end"
                        className={cn(
                          "pl-2 text-muted-foreground transition-colors",
                          state.end !== formatDate(timer.end ?? new Date())
                            ? "text-blue-500"
                            : "",
                        )}
                      >
                        {t("Dialogs.Edit.end")}
                      </Label>
                      <Input
                        className="w-full appearance-none border-2 font-mono"
                        type="datetime-local"
                        name="End"
                        id="end"
                        step={1}
                        value={state.end}
                        onChange={(e) => setState({ end: e.target.value })}
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid h-full w-full gap-1.5 p-1">
                      <Label
                        htmlFor="break-input"
                        className={cn(
                          "pl-2 text-muted-foreground transition-colors",
                          timer.breakTime != state.breakTime
                            ? "text-blue-500"
                            : "",
                        )}
                      >
                        {t("Dialogs.Create.breakTime")}
                      </Label>
                      <Input
                        id="break-input"
                        type="number"
                        min={0}
                        className="w-full appearance-none border-2"
                        onChange={(change) => {
                          const target = change.target.valueAsNumber;
                          setState({
                            breakTime: Number.isNaN(target) ? 0 : target,
                          });
                        }}
                        value={state.breakTime}
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="start-w"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Edit.startedWith")}
                      </Label>
                      <Input
                        disabled
                        className="w-full appearance-none font-mono"
                        type="text"
                        name="started-with"
                        id="start-w"
                        value={`${timer.startType}`}
                      />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="stopped-w"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Edit.stoppedWith")}
                      </Label>
                      <Input
                        disabled
                        className="w-full font-mono"
                        type="text"
                        name="stopped-with"
                        id="stopped-w"
                        value={timer.endType ?? "not stopped"}
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="id"
                        className="pl-2 text-muted-foreground"
                      >
                        ID
                      </Label>
                      <Input
                        disabled
                        className="w-full font-mono"
                        type="text"
                        name="Id"
                        id="id"
                        value={timer.id}
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="flex w-full flex-row justify-end gap-2">
              {timer.end && (
                <Button
                  variant="destructive"
                  onClick={() => sendDelete()}
                  disabled={updateStatus.loading || deleteStatus.loading}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {t("Dialogs.Edit.delete")}
                </Button>
              )}

              <Button
                variant={timer.end ? "outline" : "secondary"}
                onClick={() => sendUpdate({ stop: true })}
                disabled={updateStatus.loading || deleteStatus.loading}
              >
                <SaveAll className="mr-2 h-4 w-4" />
                {t(
                  !timer.end ? "Dialogs.Edit.saveDetails" : "Dialogs.Edit.save",
                )}
              </Button>
              {!timer.end && (
                <Button
                  variant="outline"
                  onClick={() => sendUpdate({ stop: false })}
                  disabled={updateStatus.loading || deleteStatus.loading}
                >
                  <SaveAll className="mr-2 h-4 w-4" />
                  {t("Dialogs.Edit.save")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
