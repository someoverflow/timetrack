"use client";

//#region Imports
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  FilterX,
  Folder,
  Mail,
  Plus,
  User,
} from "lucide-react";

import TimerAdd from "./timer-add";
import TimerExportDialog from "./timer-export";
import { ProjectSelection } from "@/components/project-select";

import type { $Enums, Prisma } from "@prisma/client";
import type { CheckedState } from "@radix-ui/react-checkbox";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Separator } from "@/components/ui/separator";
//#endregion

const TimerInfo = dynamic(() => import("./timer-info"), { ssr: false });

type Timer = Prisma.TimeGetPayload<{
  include: { project: true };
}>;
type Data = Record<string, Timer[]>;

export default function TimerSection({
  user,
  users,
  history,
  currentHistory,
  projects,
  yearMonth,
  totalTime,
  filters,
}: {
  user: {
    id: string;
    username: string;
    role: $Enums.Role;
  };
  users: { id: string; username: string; name: string | null }[] | undefined;

  history: Data;
  currentHistory: Timer[];
  totalTime: string;

  yearMonth: {
    current: string;
    all: string[];
  };

  projects: Projects;

  filters: {
    projects: string[] | undefined;
    users: string[] | undefined;
    invoiced: boolean | undefined;
  };
}) {
  const t = useTranslations("History");

  const router = useRouter();
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const editTime = searchParams.get("edit");

  const [addVisible, setAddVisible] = useState(false);

  useEffect(() => {
    router.refresh();
  }, [router]);

  const changeYearMonth = (change: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("ym", change);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
    startTransition(() => {
      router.refresh();
    });
  };
  const updateFilter = (data: {
    usersFilter?: string[];
    projectsFilter?: string[];
    invoiced?: boolean;

    reset?: boolean;
  }) => {
    if (typeof document !== "undefined") {
      let cookie = "undefined";
      let maxAge = "31536000";

      // Invoiced
      if (data.invoiced === true) {
        cookie = "undefined";
        maxAge = "31536000";

        if (filters.invoiced === undefined) cookie = "true";
        if (filters.invoiced === true) cookie = "false";
        if (filters.invoiced === false) cookie = "undefined";

        if (cookie == "undefined") maxAge = "0";
        document.cookie = `history-filter-invoiced=${cookie};max-age=${maxAge};path=/`;
      }

      // Projects
      if (data.projectsFilter) {
        cookie = "undefined";
        maxAge = "31536000";

        if (data.projectsFilter.length !== 0)
          cookie = JSON.stringify(data.projectsFilter);

        if (cookie == "undefined") maxAge = "0";
        document.cookie = `history-filter-projects=${cookie};max-age=${maxAge};path=/`;
      }

      // Users
      if (data.usersFilter) {
        cookie = "undefined";
        maxAge = "31536000";

        if (user.role == "ADMIN" && data.usersFilter.length !== 0)
          cookie = JSON.stringify(data.usersFilter);

        if (cookie == "undefined") maxAge = "0";
        document.cookie = `history-filter-users=${cookie};max-age=${maxAge};path=/`;
      }

      if (data.reset === true) {
        cookie = "undefined";
        maxAge = "0";
        document.cookie = `history-filter-users=${cookie};max-age=${maxAge};path=/`;
        document.cookie = `history-filter-projects=${cookie};max-age=${maxAge};path=/`;
        document.cookie = `history-filter-invoiced=${cookie};max-age=${maxAge};path=/`;
      }
    }

    if (editTime) {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.delete("edit");
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.replace(`${pathname}${query}`);
    }

    startTransition(() => {
      router.refresh();
    });
  };

  const historyDays = currentHistory
    .map((entry) => entry.start)
    .filter(
      (item, index, array) =>
        array.indexOf(
          array.find((v) => item.toDateString() === v.toDateString()) ??
            new Date(),
        ) === index,
    );

  const usersFilter = filters.users ?? [];
  const projectsFilter = filters.projects ?? [];

  const yearMonthString = `${yearMonth.current.slice(0, 4)} ${t(`Miscellaneous.Months.${yearMonth.current.replace(`${yearMonth.current.slice(0, 4)} `, "")}`)}`;
  const timeString =
    (currentHistory.find((e) => e.end === null) ? "~" : "") + totalTime;

  return (
    <>
      <div
        className={cn(
          "animate-pulse w-[10%] h-0.5 bg-primary rounded-xl transition-all duration-700 opacity-0",
          isPending && "opacity-100",
        )}
      />

      <section
        className="w-full max-w-xl max-h-[90svh] flex flex-col items-start"
        key={yearMonth.current}
      >
        <div className="p-2 px-4 font-bold w-full flex flex-row items-center justify-stretch gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between relative"
              >
                <div className="flex flex-row items-center justify-start gap-2">
                  {yearMonthString}
                  <p className="font-mono text-muted-foreground">
                    ({timeString})
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />

                {(filters.projects != undefined ||
                  filters.users != undefined ||
                  filters.invoiced != undefined) && (
                  <span className="absolute text-xs -top-6 -right-2 flex flex-row gap-2 border bg-background p-2 rounded-sm">
                    {filters.projects != undefined && (
                      <Folder className="size-4" />
                    )}
                    {filters.users != undefined && <User className="size-4" />}
                    {filters.invoiced != undefined && (
                      <Mail className="size-4" />
                    )}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="grid grid-flow-col gap-2 p-2 w-[95vw] max-w-lg border-2">
              <Command className="w-full col-span-5">
                <CommandInput
                  placeholder={t("Miscellaneous.searchYearMonth")}
                  className="h-8 w-max"
                />
                <CommandEmpty>{t("Miscellaneous.nothingFound")}</CommandEmpty>
                <CommandGroup>
                  {yearMonth.all.map((key) => (
                    <CommandItem
                      key={`history-${key}`}
                      onSelect={() => changeYearMonth(key)}
                      value={key}
                      className="font-mono"
                    >
                      {`${key.slice(0, 4)} ${t(`Miscellaneous.Months.${key.replace(`${key.slice(0, 4)} `, "")}`)}`}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          yearMonth.current === key
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>

              <div className="grid gap-2 p-1 w-full ">
                <div className="grid p-1 gap-1.5">
                  <Label
                    htmlFor="projects-button"
                    className="pl-2 text-muted-foreground"
                  >
                    {t("Miscellaneous.projects")}
                  </Label>
                  <ProjectSelection
                    project={projectsFilter}
                    changeProject={(project) => {
                      if (!project)
                        throw new Error("Project is undefined in selection");
                      const tempProjectsFilter = projectsFilter;

                      if (tempProjectsFilter.includes(project))
                        tempProjectsFilter.splice(
                          tempProjectsFilter.indexOf(project),
                          1,
                        );
                      else tempProjectsFilter.push(project);

                      updateFilter({
                        projectsFilter: tempProjectsFilter,
                      });
                    }}
                    projects={projects}
                    multiSelect
                    button={
                      <Button
                        id="projects-button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        <div className="flex flex-row gap-1">
                          {filters.projects === undefined &&
                            t("Miscellaneous.noFilter")}
                          {filters.projects?.length === 0 &&
                            t("Miscellaneous.projectsEmpty")}
                          {filters.projects?.length !== 0 &&
                            projectsFilter.map((value, index) => {
                              if (index !== 0) return undefined;
                              return (
                                <Badge
                                  key={`project-${value}`}
                                  variant="outline"
                                >
                                  {value}
                                </Badge>
                              );
                            })}

                          {projectsFilter.length > 1 && (
                            <Badge variant="secondary">
                              +{projectsFilter.length - 1}
                            </Badge>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    }
                  />
                </div>
                {user.role === "ADMIN" && users && (
                  <div className="h-full w-full grid p-1 gap-1.5">
                    <Popover>
                      <Label
                        htmlFor="userFilter-button"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Miscellaneous.users")}
                      </Label>
                      <PopoverTrigger asChild>
                        <Button
                          id="userFilter-button"
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          <div className="flex flex-row gap-1">
                            {filters.users === undefined &&
                              t("Miscellaneous.noFilter")}

                            {usersFilter?.map((value, index) => {
                              if (index !== 0) return undefined;
                              const user = users.find(
                                (u) => u.username === value,
                              );
                              if (!user) return undefined;

                              return (
                                <Badge
                                  key={`userFiltered-${value}`}
                                  variant="outline"
                                >
                                  {user.name ?? user.username}
                                </Badge>
                              );
                            })}
                            {usersFilter.length > 1 && (
                              <Badge variant="secondary">
                                +{usersFilter.length - 1}
                              </Badge>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-2">
                        <Command>
                          <CommandInput
                            placeholder={t("Miscellaneous.search")}
                            className="h-8"
                          />
                          <CommandGroup>
                            {users.map((user) => (
                              <CommandItem
                                key={`user-${user.username}`}
                                className="text-nowrap"
                                value={user.username}
                                onSelect={() => {
                                  const value = user.username;

                                  const tempUsersFilter = usersFilter;

                                  if (tempUsersFilter.includes(value))
                                    tempUsersFilter.splice(
                                      tempUsersFilter.indexOf(value),
                                      1,
                                    );
                                  else tempUsersFilter.push(value);

                                  updateFilter({
                                    usersFilter: tempUsersFilter,
                                  });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    usersFilter.includes(user.username)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <div className="w-full flex flex-row items-center">
                                  <p>{user.name}</p>
                                  <Badge variant="default" className="scale-75">
                                    @{user.username}
                                  </Badge>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <Separator />

                <div className="flex flex-row items-center gap-4">
                  <Checkbox
                    id="invoicedFilter"
                    checked={
                      {
                        true: true,
                        false: "indeterminate",
                        undefined: false,
                      }[`${filters.invoiced}`] as CheckedState
                    }
                    onCheckedChange={() => updateFilter({ invoiced: true })}
                  />
                  <Label
                    htmlFor="invoicedFilter"
                    className="flex flex-col text-nowrap"
                  >
                    {t("Miscellaneous.invoiced")}
                    <span className="text-muted-foreground">
                      {t("Miscellaneous.invoicedDescription", {
                        invoiced: filters.invoiced,
                      })}
                    </span>
                  </Label>
                </div>

                <Separator />

                <div className="flex flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => updateFilter({ reset: true })}
                    className="w-full"
                  >
                    <FilterX className="size-4 mr-4" />
                    {t("Miscellaneous.reset")}
                  </Button>

                  <TimerExportDialog
                    history={history}
                    yearMonth={yearMonth.current}
                    users={users}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <ScrollArea
          className="h-[calc(95svh-82px-56px-40px)] w-full rounded-sm border-2 p-1.5 overflow-hidden"
          type="scroll"
        >
          <div className="sticky top-1 z-50 w-full grid place-items-center mt-4 mb-6">
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setAddVisible(true)}
                  className="rounded-full !border-2 border-white/20"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-center">{t("Miscellaneous.newEntry")}</p>
              </TooltipContent>
            </Tooltip>
            <TimerAdd
              user={user.id}
              projects={projects}
              visible={addVisible}
              setVisible={setAddVisible}
            />
          </div>

          {historyDays.map((day, index) => {
            if (currentHistory.length == 0) return <></>;

            return (
              <section
                key={`day-${day}`}
                className={index === 0 ? "mt-2" : "mt-6"}
              >
                <div className="flex flex-row items-center justify-center gap-2 mb-2 transition-all duration-300 animate__animated animate__slideInLeft">
                  <div className="w-1/2" />
                  <Badge className="justify-center w-full font-semibold text-sm">
                    {`${day.getDate().toString().padStart(2, "0")}.${(
                      day.getMonth() + 1
                    )
                      .toString()
                      .padStart(
                        2,
                        "0",
                      )} ${t(`Miscellaneous.Days.${day.getDay()}`)}`}
                  </Badge>
                  <div className="w-1/2" />
                </div>

                {currentHistory
                  .filter((v) => v.start.toDateString() === day.toDateString())
                  .map((time) => (
                    <TimerInfo
                      key={`timerHistory-${yearMonth}-${time.id}`}
                      edit={editTime === time.id}
                      projects={projects}
                      timer={time}
                      user={
                        filters.users && user.id !== time.userId
                          ? (users?.find((u) => u.id == time.userId)?.name ??
                            "?")
                          : undefined
                      }
                    />
                  ))}
              </section>
            );
          })}
        </ScrollArea>
      </section>
    </>
  );
}
