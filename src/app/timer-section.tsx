"use client";

//#region Imports
import type { Time } from "@prisma/client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
} from "@/components/ui/command";

import {
  Check,
  ChevronsUpDown,
  PlayCircle,
  RefreshCw,
  StopCircle,
} from "lucide-react";

import { useTranslations } from "next-intl";
import { useState } from "react";
import useLiveTimer from "@/lib/hooks/useLiveTimer";

import { cn } from "@/lib/utils";
import Link from "next/link";
//#endregion

export default function TimerSection({
  projects,
}: {
  projects: {
    name: string;
  }[];
}) {
  const { timer, state, project, changeProject, toggle } = useLiveTimer();

  const onClick = () => {
    if (!state.loading && !state.error) toggle(!state.running);
  };

  return (
    <>
      <div>
        <Card className="w-[95vw] max-w-[350px] border-2 shadow-2xl">
          <CardContent>
            <div
              className={cn(
                "w-full rounded-lg bg-secondary/5 shadow-md hover:shadow-lg border border-border/50 hover:border-border transition-all duration-300 cursor-pointer pt-2 mt-6 pb-6 mb-4",
                state.error && "blur-sm",
                state.loading && "!cursor-wait"
              )}
              onClick={onClick}
              onKeyUp={onClick}
            >
              <CardHeader className="pt-4">
                <div className="w-full flex justify-center items-center flex-row gap-2">
                  <ToggleSection
                    running={state.running}
                    loading={state.loading}
                    startType={timer?.startType ?? "loading..."}
                  />
                </div>
              </CardHeader>
              <div className="w-full h-full flex flex-col items-center gap-6">
                <h1 className="text-5xl font-bold font-mono select-none animate__animated animate__fadeIn">
                  {state.running && timer?.time ? timer.time : "00:00:00"}
                </h1>
                <TimeSection timer={timer} running={state.running} />
              </div>
            </div>

            <ProjectSelection
              error={state.error}
              loading={state.loading}
              projects={projects}
              project={project}
              changeProject={changeProject}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

const ToggleSection = ({
  loading,
  running,
  startType,
}: {
  loading: boolean;
  running: boolean;
  startType: string | null | undefined;
}) => {
  const t = useTranslations("Timer.Miscellaneous");

  if (loading) {
    return (
      <Button variant="default" className="font-mono" disabled>
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        {t("updating")}
      </Button>
    );
  }

  if (running) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="destructive" className="font-mono">
            <StopCircle className="mr-2 h-4 w-4" />
            <p>{t("stop")}</p>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {startType && <p>{t("startedWith", { startType: startType })}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" className="font-mono">
          <PlayCircle className="mr-2 h-4 w-4" />
          <p>{t("start")}</p>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t("startWithWebsite")}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const TimeSection = ({
  timer,
  running,
}: {
  timer: Time | undefined;
  running: boolean;
}) => {
  if (running && timer) {
    return (
      <div className="flex w-full justify-center items-center gap-4">
        <p className="text-muted-foreground text-center tabular-nums h-6 w-1/4 rounded-md animate__animated animate__fadeIn">
          {timer.start.toLocaleTimeString()}
        </p>
        <Separator orientation="horizontal" className="w-5" />
        <p className="text-muted-foreground text-center tabular-nums h-6 w-1/4 rounded-md animate__animated animate__fadeIn select-none">
          {(timer.end ?? new Date()).toLocaleTimeString()}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center items-center gap-4">
      <Skeleton className="h-6 w-1/4 rounded-md animate__animated animate__fadeIn" />
      <Separator orientation="horizontal" className="w-5" />
      <Skeleton className="h-6 w-1/4 rounded-md animate__animated animate__fadeIn" />
    </div>
  );
};

const ProjectSelection = ({
  loading,
  error,
  projects,
  project,
  changeProject,
}: {
  loading: boolean;
  error: boolean;
  projects: {
    name: string;
  }[];
  project: string | undefined;
  changeProject: (project: string | undefined) => void;
}) => {
  const t = useTranslations("Timer.Miscellaneous");
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={(open) => setOpen(open)}>
      <PopoverTrigger asChild>
        <Button
          id="projects-button"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          disabled={error || loading}
          className="shadow-xl w-full justify-between transition duration-300 border border-border/50 hover:border-border hover:bg-background"
        >
          <div className="flex flex-row gap-1">
            {!project ? t("projects.none") : project}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2">
        <Command>
          <CommandInput placeholder={t("projects.search")} className="h-8" />
          {projects.length === 0 ? (
            <div className="items-center justify-center text-center text-sm text-muted-foreground pt-4">
              <p>{t("projects.noneFound")}</p>
              <Link
                href="/projects"
                prefetch={false}
                className={buttonVariants({
                  variant: "link",
                  className: "flex-col items-start",
                })}
              >
                <p>{t("projects.noneFoundDescription")}</p>
              </Link>
            </div>
          ) : (
            <CommandGroup>
              {projects.map((proj) => (
                <CommandItem
                  key={`project-select-${proj.name}`}
                  value={proj.name}
                  onSelect={() => {
                    changeProject(
                      project !== proj.name ? proj.name : undefined
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      project === proj.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {proj.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
