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
import { MailCheck, MailMinus, SaveAll, Trash, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCallback, useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn, getTimePassed } from "@/lib/utils";
import useRequest from "@/lib/hooks/useRequest";
import { ProjectSelection } from "@/components/project-select";
//#endregion

type Timer = Prisma.TimeGetPayload<{
  include: { project: true };
}>;
interface timerInfoState {
  notes: string;
  start: string;
  end: string;

  invoiced: boolean;

  traveledDistance: number | null;

  projectSelectionOpen: boolean;
  projectName: string | null;
}
export default function TimerInfo({
  timer,
  projects,
  edit,
  user,
}: {
  timer: Timer;
  projects: Projects;
  edit: boolean;
  user: string | undefined;
}) {
  const t = useTranslations("History");
  const router = useRouter();

  const generateReducer = (): timerInfoState => {
    return {
      notes: timer.notes ?? "",
      start: timer.start.toLocaleString("sv").replace(" ", "T"),
      end: timer.end
        ? timer.end.toLocaleString("sv").replace(" ", "T")
        : new Date().toLocaleString("sv").replace(" ", "T"),

      invoiced: timer.invoiced,

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

  const [blockVisible, setBlockVisible] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [visible, setVisible] = useState(edit);

  useEffect(() => {
    // Reset everything when opening/closing
    if (visible) setState(generateReducer());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (timer.end === null && !visible) {
      const interval = setInterval(
        () =>
          setState({ end: new Date().toLocaleString("sv").replace(" ", "T") }),
        1000,
      );
      return () => clearInterval(interval);
    }
  });

  const { status: updateStatus, send: sendUpdate } = useRequest(
    useCallback(
      (passed: { stop: boolean } | undefined) => {
        const request: timesPutApiValidation = {
          id: timer.id,
          notes: state.notes,
          invoiced:
            timer.invoiced !== state.invoiced ? state.invoiced : undefined,
        };

        const startChanged =
          state.start !== timer.start.toLocaleString("sv").replace(" ", "T");
        if (startChanged) {
          request.startType = "Website";
          request.start = new Date(state.start).toISOString();
        }

        if (passed?.stop) {
          const endChanged =
            state.end !== timer.end?.toLocaleString("sv").replace(" ", "T");

          if (endChanged) {
            request.endType = "Website";
            request.end = new Date(state.end).toISOString();
          }
        }

        if (state.projectName !== timer.projectName)
          request.project = state.projectName;

        if (state.traveledDistance !== timer.traveledDistance)
          request.traveledDistance = state.traveledDistance;

        return fetch("/api/times", {
          method: "PUT",
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
        body: JSON.stringify({
          id: timer.id,
        }),
      }),
    (result) => {
      setVisible(false);

      const undoTime: Time = result.result;

      const start = new Date(undoTime.start);
      const end = undoTime.end ? new Date(undoTime.end) : undefined;

      toast.success(t("Miscellaneous.deleted"), {
        description: `${start.toLocaleDateString()} • ${start.toLocaleTimeString()} → ${end ? end.toLocaleTimeString() : "--:--:--"}`,
        duration: 30_000,
        action: undoTime.end
          ? {
              label: t("Miscellaneous.undo"),
              onClick: () => {
                fetch("/api/times", {
                  method: "POST",
                  body: JSON.stringify({
                    userId: timer.userId,
                    notes: undoTime.notes ?? "",
                    traveledDistance:
                      undoTime.traveledDistance !== 0
                        ? undoTime.traveledDistance
                        : null,
                    start: undoTime.start,
                    end: undoTime.end,
                    startType: undoTime.startType ?? undefined,
                    endType: undoTime.endType ?? undefined,
                    project: undoTime.projectName ?? undefined,
                  }),
                }).then((_res) => {
                  console.log("Undo:", result);
                  router.refresh();
                });
              },
            }
          : undefined,
      });
      router.refresh();
    },
  );

  const preventClosing = useCallback(() => {
    let prevent = false;

    if (deleteStatus.loading || updateStatus.loading || invoicedStatus.loading)
      prevent = true;

    if (state.notes !== (timer.notes ?? "")) prevent = true;

    if (state.start !== timer.start.toLocaleString("sv").replace(" ", "T"))
      prevent = true;
    if (
      timer.end &&
      state.end !== timer.end.toLocaleString("sv").replace(" ", "T")
    )
      prevent = true;

    if (state.traveledDistance !== (timer.traveledDistance ?? null))
      prevent = true;

    if (state.projectName !== timer.projectName || state.projectSelectionOpen)
      prevent = true;

    return prevent;
  }, [timer, state, updateStatus, deleteStatus, invoicedStatus]);

  const changeVisibility = () => {
    if (!blockVisible) setVisible(true);
  };

  const notesSplit = timer.notes?.split("\n")[0];
  const notes = notesSplit
    ? notesSplit.startsWith("- ")
      ? `${notesSplit.replace("- ", "")} …`
      : notesSplit
    : undefined;

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
              <div className="flex flex-row items-center justify-between w-full h-full p-2">
                {timer.invoiced ? (
                  <MailMinus
                    className={cn(
                      "text-destructive h-1/2 w-1/2 transition-all duration-200",
                      dragProgress > 50
                        ? "text-blue-800"
                        : "text-indigo-500 scale-50",
                    )}
                  />
                ) : (
                  <MailCheck
                    className={cn(
                      "text-destructive h-1/2 w-1/2 transition-all duration-200",
                      dragProgress > 50
                        ? "text-blue-800"
                        : "text-indigo-500 scale-50",
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
              <div className="flex flex-row items-center justify-between w-full h-full p-2">
                <Trash2
                  className={cn(
                    "text-destructive h-1/2 w-1/2 transition-all duration-200",
                    dragProgress > 50
                      ? "text-red-800"
                      : "text-red-500 scale-50",
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
            "w-full font-mono p-2 select-none rounded-sm border-border border-2 hover:border-ring cursor-pointer transition-all duration-300 animate__animated animate__slideInLeft",
            timer.invoiced && "border-border/50",
          )}
          onClick={changeVisibility}
          onKeyDown={changeVisibility}
        >
          <div className="flex items-center justify-between pb-2">
            {timer.project ? (
              <Badge variant="secondary" className="text-xs gap-2">
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
                checked={data.invoiced}
                onCheckedChange={() =>
                  sendInvoiced({ invoiced: !data.invoiced })
                }
                disabled={invoicedStatus.loading}
              />
            </div> */}
          </div>

          <div className="flex flex-row justify-evenly items-center text-lg">
            <p>{timer.start.toLocaleTimeString()}</p>
            <div className="relative flex flex-col items-center">
              <Separator orientation="horizontal" className="w-10" />
              <p className="text-xs text-muted-foreground/80 absolute -bottom-5">
                {timer.time ?? getTimePassed(timer.start, new Date(state.end))}
              </p>
            </div>
            <p className={timer.end ? "" : "opacity-50"}>
              {new Date(state.end).toLocaleTimeString()}
            </p>
          </div>

          <p
            className={cn(
              "text-xs text-muted-foreground/90 truncate max-w-52 text-start p-2 pt-4",
            )}
          >
            {timer.notes && notes}
          </p>
        </div>
      </SwipeableListItem>

      <Dialog
        key={`timer-modal-${timer.id}`}
        open={visible}
        onOpenChange={(e) => setVisible(e)}
      >
        <DialogContent
          className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between"
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

          <div className="w-full flex flex-col gap-2">
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
                  className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
                  type="always"
                >
                  <div className="h-full w-full grid p-1 gap-1.5">
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

                  <div className="h-full w-full grid p-1 gap-1.5">
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
                      className="h-full min-h-[30svh] max-h-[50svh] border-2"
                      spellCheck={true}
                      value={state.notes}
                      onChange={(e) => setState({ notes: e.target.value })}
                    />
                  </div>

                  <div id="divider" className="h-2" />

                  <div
                    className={cn(
                      "flex flex-row items-center gap-2 p-2 transition-all border-l-2",
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
                    <Label htmlFor="invoiced" className="text-muted-foreground">
                      {t("Miscellaneous.invoicedSingular")}
                    </Label>
                  </div>

                  <div id="divider" className="h-4" />

                  <div className="h-full w-full grid p-1 gap-1.5">
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
                </ScrollArea>
              </TabsContent>
              <TabsContent value="time" className="h-full">
                <ScrollArea
                  className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
                  type="always"
                >
                  <div className="grid gap-4 p-1 w-full">
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="start"
                        className={cn(
                          "pl-2 text-muted-foreground transition-colors",
                          state.start !==
                            timer.start.toLocaleString("sv").replace(" ", "T")
                            ? "text-blue-500"
                            : "",
                        )}
                      >
                        {t("Dialogs.Edit.start")}
                      </Label>
                      <Input
                        className="w-full font-mono border-2 appearance-none"
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
                          state.end !==
                            (timer.end
                              ? timer.end.toLocaleString("sv").replace(" ", "T")
                              : new Date()
                                  .toLocaleString("sv")
                                  .replace(" ", "T"))
                            ? "text-blue-500"
                            : "",
                        )}
                      >
                        {t("Dialogs.Edit.end")}
                      </Label>
                      <Input
                        className="w-full font-mono border-2 appearance-none"
                        type="datetime-local"
                        name="End"
                        id="end"
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
                        {t("Dialogs.Edit.startedWith")}
                      </Label>
                      <Input
                        disabled
                        className="w-full font-mono appearance-none"
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

            <div className="w-full gap-2 flex flex-row justify-end">
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
