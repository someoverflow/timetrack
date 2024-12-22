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
import { Separator } from "@/components/ui/separator";
import { TimerInfo } from "./timer-info";
//#endregion

type Timer = Prisma.TimeGetPayload<{
  include: { project: true };
}>;

export default function TimerSection({
  user,
  users,
  history,
  historyDays,
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

  history: Timer[];
  historyDays: Date[];
  totalTime: string;

  yearMonth: {
    current: string;
    all: string[];
    grouped: Partial<
      Record<
        string,
        {
          index: number;
          yearMonth: string;
          year: string;
          month: string | undefined;
        }[]
      >
    >;
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
    const current = new URLSearchParams(searchParams);
    current.set("ym", change);

    const query = current.toString();
    router.push(query ? `${pathname}?${query}` : pathname);

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
      const setCookie = (name: string, value = "undefined", maxAge = "0") => {
        document.cookie = encodeURI(
          `${name}=${value};max-age=${maxAge};path=/`,
        );
      };

      if (data.reset) {
        setCookie("history-filter-users");
        setCookie("history-filter-projects");
        setCookie("history-filter-invoiced");
      } else {
        // Invoiced
        if (data.invoiced !== undefined) {
          let invoicedCookie = "undefined";
          if (filters.invoiced === undefined) invoicedCookie = "true";
          if (filters.invoiced === true) invoicedCookie = "false";
          if (filters.invoiced === false) invoicedCookie = "undefined";
          const invoicedMaxAge =
            invoicedCookie === "undefined" ? "0" : "31536000";
          setCookie("history-filter-invoiced", invoicedCookie, invoicedMaxAge);
        }

        // Projects
        if (data.projectsFilter) {
          const projectsCookie =
            data.projectsFilter.length > 0
              ? JSON.stringify(data.projectsFilter)
              : "undefined";
          const projectsMaxAge =
            projectsCookie === "undefined" ? "0" : "31536000";
          setCookie("history-filter-projects", projectsCookie, projectsMaxAge);
        }

        // Users
        if (data.usersFilter && user.role === "ADMIN") {
          const usersCookie =
            data.usersFilter.length > 0
              ? JSON.stringify(data.usersFilter)
              : "undefined";
          const usersMaxAge = usersCookie === "undefined" ? "0" : "31536000";
          setCookie("history-filter-users", usersCookie, usersMaxAge);
        }
      }
    }

    // Remove 'edit' parameter if needed and update router
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

  const yearMonthString = `${yearMonth.current.slice(0, 4)} ${t(`Miscellaneous.Months.${yearMonth.current.replace(`${yearMonth.current.slice(0, 4)} `, "")}`)}`;
  const timeString =
    (history.find((e) => e.end === null) ? "~" : "") + totalTime;

  const usersFilter = filters.users ?? [];
  const projectsFilter = filters.projects ?? [];

  return (
    <>
      <div
        className={cn(
          "h-0.5 w-[10%] animate-pulse rounded-xl bg-primary opacity-0 transition-all duration-700",
          isPending && "opacity-100",
        )}
      />

      <section
        className="flex max-h-[90svh] w-full max-w-xl flex-col items-start"
        key={yearMonth.current}
      >
        <div className="flex w-full flex-row items-center justify-stretch gap-2 p-2 px-4 font-bold">
          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="relative w-full justify-between"
              >
                <div className="flex flex-row items-center justify-start gap-2">
                  {yearMonthString}
                  <p className="font-mono text-muted-foreground">
                    ({timeString})
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />

                {(filters.projects ?? filters.users ?? filters.invoiced) && (
                  <span className="absolute -right-2 -top-6 flex flex-row gap-2 rounded-sm border bg-background p-2 text-xs">
                    {[
                      filters.projects ? (
                        <Folder key="folder" className="size-4" />
                      ) : null,
                      filters.users ? (
                        <User key="user" className="size-4" />
                      ) : null,
                      filters.invoiced ? (
                        <Mail key="mail" className="size-4" />
                      ) : null,
                    ]}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="grid w-[95vw] max-w-lg grid-flow-col gap-2 border-2 p-2">
              <Command className="col-span-5 w-full">
                <CommandInput
                  placeholder={t("Miscellaneous.searchYearMonth")}
                  className="h-8 w-max"
                />
                <CommandEmpty>{t("Miscellaneous.nothingFound")}</CommandEmpty>
                {Object.keys(yearMonth.grouped)
                  .sort()
                  .reverse()
                  .map((year) => (
                    <CommandGroup
                      key={year}
                      heading={year}
                      className="space-x-2"
                    >
                      {yearMonth.grouped[year]!.map((key) => (
                        <CommandItem
                          key={`historyMonth-${key.index}`}
                          onSelect={() => changeYearMonth(key.yearMonth)}
                          value={key.yearMonth}
                          className="text-sm"
                        >
                          {t(`Miscellaneous.Months.${key.month}`)}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              yearMonth.current === key.yearMonth
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
              </Command>

              <div className="grid w-full gap-2 p-1">
                <div className="grid gap-1.5 p-1">
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

                      const updatedProjectsFilter = [...projectsFilter];
                      const projectIndex =
                        updatedProjectsFilter.indexOf(project);

                      if (projectIndex > -1) {
                        updatedProjectsFilter.splice(projectIndex, 1);
                      } else {
                        updatedProjectsFilter.push(project);
                      }

                      updateFilter({
                        projectsFilter: updatedProjectsFilter,
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
                          {!filters.projects && t("Miscellaneous.noFilter")}
                          {filters.projects?.length === 0 &&
                            t("Miscellaneous.projectsEmpty")}
                          {filters.projects?.length !== 0 &&
                            projectsFilter.length > 0 && (
                              <Badge
                                key={`project-${projectsFilter[0]}`}
                                variant="outline"
                              >
                                {projectsFilter[0]}
                              </Badge>
                            )}
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
                  <div className="grid h-full w-full gap-1.5 p-1">
                    <Popover modal>
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
                            {filters.users === undefined ? (
                              t("Miscellaneous.noFilter")
                            ) : (
                              <>
                                {usersFilter.length > 0 && (
                                  <Badge
                                    key={`userFiltered-${usersFilter[0]}`}
                                    variant="outline"
                                  >
                                    {users.find(
                                      (u) => u.username === usersFilter[0],
                                    )?.name ?? usersFilter[0]}
                                  </Badge>
                                )}
                                {usersFilter.length > 1 && (
                                  <Badge variant="secondary">
                                    +{usersFilter.length - 1}
                                  </Badge>
                                )}
                              </>
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

                                  const tempUsersFilter = [...usersFilter];

                                  const index = tempUsersFilter.indexOf(value);
                                  if (index > -1) {
                                    tempUsersFilter.splice(index, 1);
                                  } else {
                                    tempUsersFilter.push(value);
                                  }

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
                                <div className="flex w-full flex-row items-center">
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
                    <FilterX className="mr-4 size-4" />
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
          className="h-[calc(95svh-82px-56px-40px)] w-full overflow-hidden rounded-sm border-2 p-1.5"
          type="scroll"
        >
          <div className="sticky top-1 z-50 mb-6 mt-4 grid w-full place-items-center">
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setAddVisible(true)}
                  className="rounded-full !border-2 border-white/20 bg-primary-foreground/20 backdrop-blur-md"
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
            if (history.length == 0) return <></>;

            return (
              <section
                key={`day-${day}`}
                className={index === 0 ? "mt-2" : "mt-6"}
              >
                <div className="animate__animated animate__slideInLeft mb-2 flex flex-row items-center justify-center gap-2 transition-all duration-300">
                  <div className="w-1/2" />
                  <Badge className="w-full justify-center text-sm font-semibold">
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

                {history
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
