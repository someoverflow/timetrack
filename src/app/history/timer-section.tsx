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
  Plus,
} from "lucide-react";

import TimerAdd from "./timer-add";
import TimerExportDialog from "./timer-export";

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
  projects: Prisma.ProjectGetPayload<Record<string, never>>[];
  yearMonth: string;
  totalTime: string;
  filters: {
    active: number;
    projects: string[] | undefined;
    users: string[] | undefined;
    invoiced: boolean | undefined;
  };
}) {
  const t = useTranslations("History");

  const historyKeys = Object.keys(history);

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

  const historyDays = (history[yearMonth] ?? [])
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

  const yearMonthString = `${yearMonth.slice(0, 4)} ${t(`Miscellaneous.Months.${yearMonth.replace(`${yearMonth.slice(0, 4)} `, "")}`)}`;
  const timeString =
    ((history[yearMonth] ?? []).find((e) => e.end === null) ? "~" : "") +
    totalTime;

  return (
    <>
      <div
        className={cn(
          "animate-pulse w-[10%] h-0.5 bg-primary rounded-xl transition-all duration-700 opacity-0",
          isPending && "opacity-100",
        )}
      />

      <section
        className="w-full max-w-md max-h-[90svh] flex flex-col items-start"
        key={yearMonth}
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

                {filters.active !== 0 && (
                  <span className="absolute text-xs -top-2 right-0 font-mono">
                    {filters.active}
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
                  {historyKeys.map((key) => (
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
                          yearMonth === key ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>

              <div className="grid gap-2 p-1 w-full ">
                <div className="grid p-1 gap-1.5">
                  <Popover>
                    <Label
                      htmlFor="projects-button"
                      className="pl-2 text-muted-foreground"
                    >
                      {t("Miscellaneous.projects")}
                    </Label>
                    <PopoverTrigger asChild>
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
                    </PopoverTrigger>
                    <PopoverContent className="p-2">
                      <Command>
                        <CommandInput
                          placeholder={t("Miscellaneous.search")}
                          className="h-8"
                        />
                        {projects.length !== 0 && (
                          <CommandGroup>
                            {projects.map((project) => (
                              <CommandItem
                                key={`project-${project.name}`}
                                value={project.name}
                                onSelect={() => {
                                  const value = project.name;

                                  const tempProjectsFilter = projectsFilter;

                                  if (tempProjectsFilter.includes(value))
                                    tempProjectsFilter.splice(
                                      tempProjectsFilter.indexOf(value),
                                      1,
                                    );
                                  else tempProjectsFilter.push(value);

                                  updateFilter({
                                    projectsFilter: tempProjectsFilter,
                                  });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    projectsFilter.includes(project.name)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {project.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                              return (
                                <Badge
                                  key={`userFiltered-${value}`}
                                  variant="outline"
                                >
                                  {
                                    users.find(
                                      (user) => user.username === value,
                                    )?.name
                                  }
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

                  <TimerExportDialog history={history} yearMonth={yearMonth} />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <ScrollArea
          className="h-[calc(95svh-82px-56px-40px)] w-full rounded-sm border-2 p-1.5 overflow-hidden"
          type="scroll"
        >
          <div className="w-full grid place-items-center mt-4 mb-6">
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAddVisible(true)}
                  className="rounded-full"
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
            if (!history[yearMonth]) return <></>;

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

                {history[yearMonth]
                  .filter((v) => v.start.toDateString() === day.toDateString())
                  .reverse()
                  .map((time) => (
                    <TimerInfo
                      key={`timerHistory-${yearMonth}-${time.id}`}
                      edit={editTime === time.id}
                      projects={projects}
                      data={time}
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
