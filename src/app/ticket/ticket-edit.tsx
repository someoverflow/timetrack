//#region Imports
import type { todoUpdateApiValidationType } from "@/lib/zod";
import type { Prisma, TicketPriority, TicketStatus } from "@prisma/client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Step, Stepper, type StepItem } from "@/components/ui/stepper";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DialogTitle } from "@radix-ui/react-dialog";
import {
  Check,
  ChevronDown,
  ChevronsUp,
  ChevronsUpDown,
  CircleCheckBig,
  CircleDot,
  CircleDotDashed,
  File,
  LoaderCircle,
  SaveAll,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import axois, { type AxiosProgressEvent } from "axios";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { cn, formatDuration, humanFileSize } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import useRequest from "@/lib/hooks/useRequest";
import { ProjectSelection } from "@/components/project-select";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "framer-motion";
//#endregion

const steps = [
  { id: "todo", label: "Todo", icon: CircleDot },
  { id: "in_progress", label: "In Progress", icon: CircleDotDashed },
  { id: "done", label: "Done", icon: CircleCheckBig },
] satisfies StepItem[];

interface ticketInfoState {
  task: string;
  description: string;

  deadline: string;
  deadlineEnabled: boolean;

  assignees: string[];
  projects: string[];

  status: TicketStatus;
  statusState: undefined | "error" | "loading";
  priority: TicketPriority;
}

export function TicketTableEdit({
  ticket,
  projects,
  users,
  children,
}: {
  ticket: Prisma.TicketGetPayload<TicketPagePayload>;
  projects: Projects;
  users: Users;
  children: JSX.Element;
}) {
  const router = useRouter();
  const t = useTranslations("Tickets");

  const [visible, setVisible] = useState(false);

  const [uploadProgress, onUploadProgress] = useState<
    AxiosProgressEvent | undefined
  >();
  const [uploadDrag, setUploadDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);

  const getDefaultReducerState = useCallback((): ticketInfoState => {
    return {
      task: ticket.task,
      description: ticket.description ?? "",

      deadline:
        (ticket.deadline ?? new Date()).toISOString().split("T")[0] ?? "",
      deadlineEnabled: ticket.deadline !== null,

      projects: ticket.projects.map((project) => project.name),
      assignees: ticket.assignees.map((assignee) => assignee.username),

      status: ticket.status,
      statusState: undefined,
      priority: ticket.priority,
    };
  }, [ticket]);

  const [state, setState] = useReducer(
    (prev: ticketInfoState, next: Partial<ticketInfoState>) => ({
      ...prev,
      ...next,
    }),
    getDefaultReducerState(),
  );

  const searchParams = useSearchParams();
  const linkedTodo = searchParams.get("link");

  const updateLink = useCallback(
    (t?: boolean) => {
      const current = new URLSearchParams(window.location.search);
      if (t) current.delete("link");
      else current.set("link", ticket.id);
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.replace(`/ticket${query}`);
    },
    [router, ticket.id],
  );

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.code == "Escape") updateLink(true);
    };
    document.addEventListener("keydown", keyDownHandler);
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [updateLink]);

  const { status, send } = useRequest(
    useCallback(() => {
      const assigneesToRemove = ticket.assignees
        .filter((assignee) => !state.assignees.includes(assignee.username))
        .map((assignee) => assignee.username);
      const assigneesToAdd = state.assignees.filter(
        (username) => !ticket.assignees.some((a) => a.username === username),
      );

      const projectsToRemove = ticket.projects
        .filter((project) => !state.projects.includes(project.name))
        .map((project) => project.name);
      const projectsToAdd = state.projects.filter(
        (name) => !ticket.projects.some((p) => p.name === name),
      );

      const request = {
        id: ticket.id,

        task: ticket.task !== state.task ? state.task : undefined,
        description:
          (ticket.description ?? "" !== state.description)
            ? state.description
            : undefined,

        deadline:
          (ticket.deadline
            ? ticket.deadline.toISOString().split("T")[0]
            : null) !== (state.deadlineEnabled ? state.deadline : null)
            ? state.deadlineEnabled
              ? state.deadline
              : null
            : undefined,

        assignees: {
          add:
            assigneesToAdd.length !== 0 ? (assigneesToAdd as any) : undefined,
          remove:
            assigneesToRemove.length !== 0
              ? (assigneesToRemove as any)
              : undefined,
        },

        projects: {
          add: projectsToAdd.length !== 0 ? (projectsToAdd as any) : undefined,
          remove:
            projectsToRemove.length !== 0
              ? (projectsToRemove as any)
              : undefined,
        },

        priority:
          ticket.priority !== state.priority ? state.priority : undefined,
      } satisfies todoUpdateApiValidationType;

      return fetch("/api/ticket", {
        method: "PUT",
        body: JSON.stringify(request),
      });
    }, [state, ticket]),
    (_result) => {
      toast.success(t("updated"), {
        duration: 3_000,
      });
      setVisible(false);
      router.refresh();
    },
  );

  const { status: stepStatus, send: sendStep } = useRequest(
    (
      passed:
        | {
            step: number;
            setStep: (step: number) => void;
          }
        | undefined,
    ) => {
      if (passed) passed.setStep(passed.step);
      return fetch("/api/ticket", {
        method: "PUT",
        body: JSON.stringify({
          id: ticket.id,
          status: ["TODO", "IN_PROGRESS", "DONE"][passed?.step ?? 0],
        }),
      });
    },
    (_result) => {
      updateLink(true);

      toast.success(t("changed"), {
        duration: 3_000,
      });
      router.refresh();
    },
  );

  const fileInput = useRef<HTMLInputElement>(null);

  const loading = stepStatus.loading || status.loading;

  useEffect(() => {
    if (visible) setState(getDefaultReducerState());
  }, [ticket, visible, getDefaultReducerState]);

  useEffect(() => {
    setVisible(linkedTodo === ticket.id);
    setState(getDefaultReducerState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedTodo, stepStatus.loading]);

  const company = process.env.NEXT_PUBLIC_COMPANY ?? "";

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setVisible(true);
        }}
      >
        {children}
      </div>

      <Dialog
        key={`todoModal-${ticket.id}`}
        open={visible}
        onOpenChange={(e) => setVisible(e)}
      >
        <VisuallyHidden>
          <DialogTitle>Title</DialogTitle>
        </VisuallyHidden>
        <DialogContent
          className="flex w-[95vw] max-w-xl flex-col justify-between rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute left-2 top-2 flex flex-row gap-1">
            {ticket.archived && (
              <Badge variant="destructive">{t("archived")}</Badge>
            )}
          </div>

          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full flex-col gap-4 pb-4 pt-6">
              <Stepper
                initialStep={
                  ticket.archived
                    ? 3
                    : ticket.status === "TODO"
                      ? 0
                      : ticket.status === "IN_PROGRESS"
                        ? 1
                        : 2
                }
                steps={steps}
                onClickStep={
                  ticket.archived || loading
                    ? undefined
                    : (step, setStep) => {
                        sendStep({
                          step: step,
                          setStep: setStep,
                        });
                      }
                }
                state={state.statusState}
                variant="circle-alt"
                orientation="horizontal"
                responsive={false}
                styles={{
                  "step-button-container": cn(
                    "transition-all duration-300",
                    "data-[active=true]:bg-muted data-[active=true]:border-primary dark:data-[active=true]:text-primary-foreground",
                    "data-[current=true]:bg-muted data-[current=true]:border-primary data-[current=true]:text-primary-foreground",
                    ticket.status === "TODO"
                      ? "data-[current=true]:border-blue-500"
                      : "",
                    ticket.status === "IN_PROGRESS"
                      ? "data-[current=true]:border-amber-500"
                      : "",
                    ticket.status === "DONE"
                      ? "data-[current=true]:border-green-500"
                      : "",
                  ),
                  "horizontal-step":
                    "data-[completed=true]:[&:not(:last-child)]:after:bg-primary",
                }}
              >
                <Step
                  key={steps[0]?.id}
                  id={steps[0]?.id}
                  label={t("steps.todo")}
                  icon={steps[0]?.icon}
                  checkIcon={steps[0]?.icon}
                  className="!text-blue-500"
                />
                <Step
                  key={steps[1]?.id}
                  id={steps[1]?.id}
                  label={t("steps.inProgress")}
                  icon={steps[1]?.icon}
                  checkIcon={steps[1]?.icon}
                  className="!text-amber-500"
                />
                <Step
                  key={steps[2]?.id}
                  id={steps[2]?.id}
                  label={t("steps.done")}
                  icon={steps[2]?.icon}
                  checkIcon={steps[2]?.icon}
                  className="!text-green-500"
                />
              </Stepper>
            </div>

            <Tabs defaultValue="status">
              <TabsList className="flex w-full">
                <TabsTrigger className="w-full" value="status">
                  {t("Dialogs.Edit.status")}
                </TabsTrigger>
                <TabsTrigger className="w-full" value="details">
                  {t("Dialogs.Edit.details")}
                </TabsTrigger>
                <TabsTrigger className="w-full" value="uploads">
                  Uploads
                </TabsTrigger>
              </TabsList>
              <TabsContent value="status" className="h-full">
                <ScrollArea
                  className="h-[50svh] w-full overflow-hidden rounded-sm p-2.5"
                  type="always"
                >
                  <div className="grid w-full gap-2 p-1">
                    <Label className="pl-2 text-muted-foreground" asChild>
                      <legend>{t("priority")}</legend>
                    </Label>
                    <RadioGroup
                      id="priority"
                      className={cn(
                        "flex flex-row items-center justify-evenly border-l-2 px-2 pt-1 transition-all",
                        ticket.priority !== state.priority
                          ? "border-blue-500"
                          : "",
                      )}
                      value={state.priority}
                      onValueChange={(state) =>
                        setState({
                          priority: state as TicketPriority,
                        })
                      }
                    >
                      <div className="flex flex-col items-center gap-2">
                        <RadioGroupItem value="HIGH" id="r1" />
                        <Label
                          htmlFor="r1"
                          className="flex h-5 flex-row items-center"
                        >
                          <ChevronsUp className="h-5 w-5 text-red-500" />{" "}
                          {t("priorities.high")}
                        </Label>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <RadioGroupItem value="MEDIUM" id="r2" />
                        <Label
                          htmlFor="r2"
                          className="flex h-5 flex-row items-center"
                        >
                          {t("priorities.medium")}
                        </Label>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <RadioGroupItem value="LOW" id="r3" />
                        <Label
                          htmlFor="r3"
                          className="flex h-5 flex-row items-center"
                        >
                          <ChevronDown className="h-5 w-5 text-blue-500" />{" "}
                          {t("priorities.low")}
                        </Label>
                      </div>
                    </RadioGroup>
                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="task"
                        className={cn(
                          "pl-2 text-muted-foreground transition-colors",
                          ticket.task !== state.task ? "text-blue-500" : "",
                        )}
                      >
                        {t("task")}
                      </Label>
                      <Input
                        className="!w-full border-2"
                        type="text"
                        spellCheck
                        autoComplete="off"
                        name="Task"
                        id="task"
                        maxLength={100}
                        value={state.task}
                        onChange={(e) => setState({ task: e.target.value })}
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="description"
                        className={cn(
                          "pl-2 text-muted-foreground transition-colors",
                          (ticket.description ?? "") !== state.description
                            ? "text-blue-500"
                            : "",
                        )}
                      >
                        {t("description")}
                      </Label>
                      <Textarea
                        className="min-h-32 !w-full border-2"
                        name="Description"
                        id="description"
                        autoComplete="off"
                        spellCheck
                        maxLength={800}
                        value={state.description}
                        onChange={(e) =>
                          setState({ description: e.target.value })
                        }
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid h-full w-full gap-1.5 p-1">
                      <Label
                        htmlFor="projects-button"
                        className={cn(
                          "pl-2 text-muted-foreground transition-colors",
                          state.projects.sort().toString() !==
                            ticket.projects
                              .map((project) => project.name)
                              .sort()
                              .toString()
                            ? "text-blue-500"
                            : "",
                        )}
                      >
                        {t("Dialogs.Edit.projects")}
                      </Label>
                      <ProjectSelection
                        multiSelect
                        project={state.projects}
                        projects={projects}
                        changeProject={(project) => {
                          if (!project)
                            throw new Error(
                              "Project is undefined in selection",
                            );

                          const stateProjects = state.projects;

                          if (stateProjects.includes(project))
                            stateProjects.splice(
                              stateProjects.indexOf(project),
                              1,
                            );
                          else stateProjects.push(project);

                          setState({
                            projects: stateProjects,
                          });
                        }}
                        button={
                          <Button
                            id="projects-button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between border-2 transition duration-300"
                          >
                            <div className="flex flex-row gap-1">
                              {state.projects.length === 0
                                ? t("Dialogs.Edit.noRelatedProjects")
                                : state.projects.map((value, index) =>
                                    index >= 3 ? undefined : (
                                      <Badge
                                        key={`project-${value}`}
                                        variant="outline"
                                        className="gap-1"
                                      >
                                        {projects.single.find(
                                          (p) => p.name == value,
                                        )?.customerName && (
                                          <span className="text-muted-foreground">
                                            {
                                              projects.single.find(
                                                (p) => p.name == value,
                                              )?.customerName
                                            }
                                          </span>
                                        )}
                                        {value}
                                      </Badge>
                                    ),
                                  )}
                              {state.projects.length > 3 && (
                                <Badge variant="secondary">
                                  +{state.projects.length - 3}
                                </Badge>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        }
                      />
                    </div>
                    <div className="grid h-full w-full gap-1.5 p-1">
                      <Popover modal>
                        <Label
                          htmlFor="assignees-button"
                          className={cn(
                            "pl-2 text-muted-foreground transition-colors",
                            state.assignees.sort().toString() !==
                              ticket.assignees
                                .map((assignee) => assignee.username)
                                .sort()
                                .toString()
                              ? "text-blue-500"
                              : "",
                          )}
                        >
                          {t("assignees")}
                        </Label>
                        <PopoverTrigger asChild>
                          <Button
                            id="assignees-button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between border-2 transition duration-300"
                          >
                            <div className="flex flex-row gap-1">
                              {state.assignees.length === 0
                                ? t("Dialogs.Edit.noAssignees")
                                : state.assignees.map((value, index) =>
                                    index >= 3 ? undefined : (
                                      <Badge
                                        key={`assignees-${value}`}
                                        variant="outline"
                                      >
                                        {
                                          users.single.find(
                                            (user) => user.username === value,
                                          )?.name
                                        }
                                      </Badge>
                                    ),
                                  )}
                              {state.assignees.length > 3 && (
                                <Badge variant="secondary">
                                  +{state.assignees.length - 3}
                                </Badge>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-2">
                          <Command className="max-h-[calc(32px+25svh)]">
                            <CommandInput
                              placeholder={t("search")}
                              className="h-8"
                            />

                            <CommandList>
                              {Object.keys(users.grouped).map((group) => {
                                const customer = users.grouped[group];
                                if (!customer)
                                  throw new Error("Customer is undefined?");

                                return (
                                  <CommandGroup
                                    key={group}
                                    heading={
                                      group == "" ? (company ?? "") : group
                                    }
                                  >
                                    {customer.map((user) => (
                                      <CommandItem
                                        key={`user-selection-add-${user.username}`}
                                        className="text-nowrap"
                                        value={user.username}
                                        onSelect={() => {
                                          const value = user.username;
                                          const stateAssignees =
                                            state.assignees;

                                          if (stateAssignees.includes(value))
                                            stateAssignees.splice(
                                              stateAssignees.indexOf(value),
                                              1,
                                            );
                                          else stateAssignees.push(value);

                                          setState({
                                            assignees: stateAssignees,
                                          });
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            state.assignees.includes(
                                              user.username,
                                            )
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        <div className="flex w-full flex-row items-center">
                                          {user.name}
                                          <Badge
                                            variant="default"
                                            className="scale-75"
                                          >
                                            @{user.username}
                                          </Badge>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                );
                              })}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <div className="flex flex-row items-center justify-between">
                        <Label
                          htmlFor="deadline"
                          className={cn(
                            "pl-2 text-muted-foreground",
                            (ticket.deadline
                              ? ticket.deadline.toISOString().split("T")[0]
                              : null) !==
                              (state.deadlineEnabled ? state.deadline : null)
                              ? "text-blue-500"
                              : "",
                          )}
                        >
                          {t("deadline")}
                        </Label>
                        <Switch
                          id="deadline"
                          checked={state.deadlineEnabled}
                          onCheckedChange={(checked) =>
                            setState({ deadlineEnabled: checked })
                          }
                        />
                      </div>
                      <Input
                        className={`!w-full border-2 transition-opacity duration-150 ${
                          state.deadlineEnabled ? "opacity-100" : ""
                        }`}
                        disabled={!state.deadlineEnabled}
                        name="Deadline"
                        id="deadline-input"
                        type="date"
                        value={state.deadline}
                        onChange={(e) =>
                          setState({
                            deadline: e.target.value,
                            deadlineEnabled: true,
                          })
                        }
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="details" className="h-full">
                <ScrollArea
                  className="h-[50svh] w-full overflow-hidden rounded-sm p-2.5"
                  type="always"
                >
                  <div className="grid w-full gap-4 p-1">
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="creator"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Edit.creator")}
                      </Label>
                      <Input
                        disabled
                        className="w-full font-mono"
                        type="text"
                        name="creator"
                        id="creator"
                        value={ticket.creator.name ?? ticket.creator.username}
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="updatedAt"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Edit.updated")}
                      </Label>
                      <Input
                        disabled
                        className="w-full font-mono"
                        type="datetime-local"
                        name="Updated At"
                        id="updatedAt"
                        value={ticket.updatedAt
                          .toLocaleString("sv")
                          .replace(" ", "T")}
                      />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="createdAt"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Edit.created")}
                      </Label>
                      <Input
                        disabled
                        className="w-full font-mono"
                        type="datetime-local"
                        name="Created At"
                        id="createdAt"
                        value={ticket.createdAt
                          .toLocaleString("sv")
                          .replace(" ", "T")}
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
                        value={ticket.id}
                      />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="uploads" className="h-full">
                <ScrollArea
                  className="h-[50svh] w-full overflow-hidden rounded-sm p-2.5"
                  type="always"
                  onDrop={(e) => {
                    e.preventDefault();
                    setUploadDrag(false);

                    const file = e.dataTransfer.files[0];

                    const list = new DataTransfer();
                    if (file) list.items.add(file);

                    setFiles(file ? list.files : null);
                    fileInput.current!.files = file ? list.files : null;
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setUploadDrag(true);
                  }}
                  onDragLeave={() => {
                    setUploadDrag(false);
                  }}
                  onDragEnd={(e) => {
                    e.preventDefault();
                    setUploadDrag(false);
                  }}
                >
                  <div className="grid h-full w-full">
                    <AnimatePresence>
                      {uploadDrag && (
                        <motion.div
                          exit={{
                            opacity: 0,
                            backdropFilter: "blur(0px)",
                          }}
                          initial={{
                            opacity: 0,
                            backdropFilter: "blur(0px)",
                          }}
                          animate={{
                            opacity: 1,
                            backdropFilter: "blur(20px)",
                          }}
                          className="z-50 grid h-full w-full place-items-center rounded-md border-2 border-dashed border-red-500 bg-transparent [grid-column:1;] [grid-row:1]"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Upload className="size-12" />
                            <h1 className="text-2xl">Drop Files</h1>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="h-full w-full overflow-hidden p-2 [grid-column:1;] [grid-row:1]">
                      <ScrollArea type="always">
                        <div className="flex w-max space-x-4 p-4">
                          {ticket.uploads.map((upload) => (
                            <div
                              key={upload.id}
                              className="grid w-full place-items-center gap-2 rounded-md border border-border p-2"
                            >
                              <File className="size-6" />
                              <p className="">{humanFileSize(upload.size)}</p>
                              <p className="text-xs text-muted-foreground">
                                {upload.name}
                              </p>
                            </div>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>

                      <form
                        action={async (formData) => {
                          setUploading(true);

                          axois
                            .post("/api/files/upload", formData, {
                              onUploadProgress,
                            })
                            .then(() => {
                              fileInput.current!.value = "";
                              fileInput.current!.files = null;
                              setFiles(null);

                              toast.success("Upload complete.");

                              setUploading(false);
                              router.refresh();
                            });
                        }}
                        className="mt-4 flex flex-col gap-4 p-4"
                      >
                        <label className="hidden">
                          <input
                            type="text"
                            name="ticket"
                            value={ticket.id}
                            readOnly
                          />
                        </label>

                        <div className="space-y-2 text-sm">
                          <Label htmlFor="file" className="text-sm font-medium">
                            File
                            <span className="block text-xs text-muted-foreground">
                              Click to select a file or drag and drop it here
                            </span>
                          </Label>
                          <Input
                            id="file"
                            name="file"
                            type="file"
                            ref={fileInput}
                            onChange={(e) => setFiles(e.target.files)}
                          />
                        </div>

                        <Button
                          type="submit"
                          size="lg"
                          disabled={uploading || !files}
                        >
                          {uploading && (
                            <LoaderCircle className="mr-2 size-4 animate-spin" />
                          )}
                          Upload
                        </Button>

                        <AnimatePresence>
                          {uploadProgress?.progress && (
                            <motion.div
                              initial={{
                                opacity: 0,
                              }}
                              animate={{
                                opacity: 1,
                              }}
                              className="flex flex-col items-center justify-center font-mono tabular-nums"
                            >
                              <div className="flex w-full flex-row items-center gap-4">
                                <Progress
                                  value={Math.round(
                                    uploadProgress.progress * 100,
                                  )}
                                />
                                <p>
                                  {Math.round(uploadProgress!.progress * 100)}%
                                </p>
                              </div>

                              <p className="text-sm">
                                {`${humanFileSize(BigInt(uploadProgress!.loaded ?? 0))} / ${humanFileSize(BigInt(uploadProgress!.total ?? 0))} `}
                                ({" "}
                                {formatDuration(
                                  (uploadProgress?.estimated ?? 0) * 1000,
                                  { ms: false },
                                )}{" "}
                                )
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </form>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="flex w-full flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => send()}
                disabled={loading}
              >
                <SaveAll className="mr-2 h-4 w-4" />
                {t("Dialogs.Edit.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
