"use client";

//#region Imports
import type { TicketPriority } from "@prisma/client";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  ChevronDown,
  ChevronsUp,
  ChevronsUpDown,
  ListPlus,
} from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import { useCallback, useReducer, useState } from "react";
import { useTranslations } from "next-intl";
import useRequest from "@/lib/hooks/useRequest";

import { cn } from "@/lib/utils";
import { ProjectSelection } from "@/components/project-select";
//#endregion

interface ticketAddState {
  priority: TicketPriority;

  task: string;
  description: string;

  deadline: string;
  deadlineEnabled: boolean;

  assignees: string[];
  projects: string[];
}

export function TicketAdd({
  users,
  projects,
}: {
  users: Users;
  projects: Projects;
}) {
  const router = useRouter();
  const t = useTranslations("Tickets");

  const [visible, setVisible] = useState(false);
  const [data, setData] = useReducer(
    (prev: ticketAddState, next: Partial<ticketAddState>) => ({
      ...prev,
      ...next,
    }),
    {
      priority: "MEDIUM",

      task: "",
      description: "",
      deadline: new Date().toISOString().split("T")[0] ?? "",
      deadlineEnabled: false,

      assignees: [],
      projects: [],
    },
    undefined,
  );

  const { status, send } = useRequest(
    useCallback(
      () =>
        fetch("/api/ticket", {
          method: "POST",
          body: JSON.stringify({
            task: data.task,
            description:
              data.description.trim() === ""
                ? undefined
                : data.description.trim(),
            priority: data.priority,
            deadline: data.deadlineEnabled ? data.deadline : undefined,
            assignees: data.assignees.length !== 0 ? data.assignees : undefined,
            projects: data.projects.length !== 0 ? data.projects : undefined,
          }),
        }),
      [data],
    ),
    (_result) => {
      toast.success(t("created"), {
        duration: 3000,
      });

      setVisible(false);

      setData({
        priority: "MEDIUM",

        task: "",
        description: "",
        deadline: new Date().toISOString().split("T")[0] ?? "",
        deadlineEnabled: false,

        assignees: [],
        projects: [],
      });

      router.refresh();
    },
  );

  const company = process.env.NEXT_PUBLIC_COMPANY ?? "";

  return (
    <>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setVisible(true)}
          >
            <ListPlus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-center">{t("Dialogs.Add.buttonToolTip")}</p>
        </TooltipContent>
      </Tooltip>

      <Dialog
        key={"userAddModal"}
        open={visible}
        onOpenChange={(e) => setVisible(e)}
      >
        <DialogContent
          className="flex w-[95vw] max-w-xl flex-col justify-between rounded-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              <div>{t("Dialogs.Add.title")}</div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex w-full flex-col gap-2">
            <ScrollArea
              className="h-[60svh] w-full overflow-hidden rounded-sm p-2.5"
              type="always"
            >
              <div className="grid w-full gap-4 p-1">
                <Label asChild className="pl-2 text-muted-foreground">
                  <legend>{t("priority")}</legend>
                </Label>
                <RadioGroup
                  id="priority-radio"
                  className="flex flex-row items-center justify-evenly pt-1"
                  value={data.priority}
                  onValueChange={(state) =>
                    setData({ priority: state as TicketPriority })
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
                  <Label htmlFor="task" className="pl-2 text-muted-foreground">
                    {t("task")}
                  </Label>
                  <Input
                    className="!w-full border-2"
                    type="text"
                    spellCheck
                    name="Task"
                    id="task"
                    autoComplete="off"
                    maxLength={100}
                    value={data.task}
                    onChange={(e) => setData({ task: e.target.value })}
                  />
                </div>

                <div id="divider" className="h-1" />

                <div className="grid w-full items-center gap-1.5">
                  <Label
                    htmlFor="description"
                    className="pl-2 text-muted-foreground"
                  >
                    {t("description")}
                  </Label>
                  <Textarea
                    className="!w-full border-2"
                    name="Name"
                    id="description"
                    autoComplete="off"
                    maxLength={10e6}
                    value={data.description}
                    onChange={(e) => setData({ description: e.target.value })}
                  />
                </div>

                <div id="divider" className="h-1" />

                <div className="grid h-full w-full gap-1.5 p-1">
                  <Label
                    htmlFor="projects-button"
                    className="pl-2 text-muted-foreground"
                  >
                    {t("Dialogs.Add.projects")}
                  </Label>
                  <ProjectSelection
                    multiSelect
                    project={data.projects}
                    projects={projects}
                    button={
                      <Button
                        id="projects-button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between overflow-hidden border-2 transition duration-300"
                      >
                        <div className="flex flex-row gap-1">
                          {data.projects.length === 0
                            ? t("Dialogs.Add.noRelatedProjects")
                            : data.projects.map((value, index) =>
                                index >= 3 ? undefined : (
                                  <Badge
                                    key={`projects-select-show-${value}`}
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
                          {data.projects.length > 3 && (
                            <Badge variant="secondary">
                              +{data.projects.length - 3}
                            </Badge>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    }
                    changeProject={(project) => {
                      if (!project)
                        throw new Error("Project is undefined in selection");

                      const currentProjects = data.projects;
                      if (currentProjects.includes(project))
                        currentProjects.splice(
                          currentProjects.indexOf(project),
                          1,
                        );
                      else currentProjects.push(project);

                      setData({
                        projects: currentProjects,
                      });
                    }}
                  />
                </div>

                <div className="grid h-full w-full gap-1.5 p-1">
                  <Popover modal>
                    <Label
                      htmlFor="assignees-button"
                      className="pl-2 text-muted-foreground"
                    >
                      {t("assignees")}
                    </Label>
                    <PopoverTrigger asChild>
                      <Button
                        id="assignees-button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between overflow-hidden border-2 transition duration-300"
                      >
                        <div className="flex flex-row gap-1">
                          {data.assignees.length === 0
                            ? t("Dialogs.Add.noAssignees")
                            : data.assignees.map((value, index) =>
                                index >= 3 ? undefined : (
                                  <Badge
                                    key={`assignees-select-show-${value}`}
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
                          {
                            // TODO: Amount based on width
                            data.assignees.length > 3 && (
                              <Badge variant="secondary">
                                +{data.assignees.length - 3}
                              </Badge>
                            )
                          }
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
                                heading={group == "" ? company : group}
                              >
                                {customer.map((user) => (
                                  <CommandItem
                                    key={`user-selection-add-${user.username}`}
                                    className="text-nowrap"
                                    value={user.username}
                                    onSelect={() => {
                                      const value = user.username;
                                      const currentAssignees = data.assignees;
                                      if (currentAssignees.includes(value))
                                        currentAssignees.splice(
                                          currentAssignees.indexOf(value),
                                          1,
                                        );
                                      else currentAssignees.push(value);

                                      setData({
                                        assignees: currentAssignees,
                                      });
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        data.assignees.includes(user.username)
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
                      className="pl-2 text-muted-foreground"
                    >
                      {t("deadline")}
                    </Label>
                    <Switch
                      checked={data.deadlineEnabled}
                      onCheckedChange={(checked) =>
                        setData({ deadlineEnabled: checked })
                      }
                    />
                  </div>
                  <Input
                    className={`!w-full appearance-none border-2 opacity-0 transition-opacity duration-150 ${
                      data.deadlineEnabled ? "opacity-100" : ""
                    }`}
                    disabled={!data.deadlineEnabled}
                    name="Name"
                    id="deadline"
                    type="date"
                    value={data.deadline}
                    onChange={(e) =>
                      setData({
                        deadline: e.target.value,
                        deadlineEnabled: true,
                      })
                    }
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="flex w-full flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => send()}
                disabled={status.loading}
              >
                <ListPlus className="mr-2 h-4 w-4" />
                {t("Dialogs.Add.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
