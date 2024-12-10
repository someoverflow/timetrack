"use client";

//#region Imports
import type { Time } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { ProjectSelection } from "@/components/project-select";

import { Coffee, PlayCircle, RefreshCw, StopCircle } from "lucide-react";

import { useTranslations } from "next-intl";
import useLiveTimer from "@/lib/hooks/useLiveTimer";

import { cn } from "@/lib/utils";
//#endregion

export default function TimerSection({ projects }: { projects: Projects }) {
  const { timer, state, project, changeProject, toggle } = useLiveTimer({
    projects: projects,
  });

  const onClick = () => {
    if (!state.loading && !state.error && !state.running)
      toggle(!state.running);
  };

  return (
    <Card className="w-[90vw] max-w-[350px] border-2 shadow-2xl">
      <CardContent>
        <div
          className={cn(
            "mb-4 mt-6 w-full rounded-lg border border-border/50 bg-secondary/5 pb-6 pt-2 shadow-md transition-all duration-300 hover:shadow-lg",
            !state.running && "cursor-pointer hover:border-border",
            state.error && "blur-sm",
            state.loading && "!cursor-wait",
          )}
          onClick={onClick}
          onKeyUp={onClick}
        >
          <CardHeader className="pt-4">
            <div className="flex w-full flex-row items-center justify-center gap-2">
              <ToggleSection
                running={state.running}
                loading={state.loading}
                startType={timer?.startType ?? "loading..."}
                toggle={toggle}
              />
            </div>
          </CardHeader>
          <div className="flex h-full w-full flex-col items-center gap-6">
            <h1 className="animate__animated animate__fadeIn select-none font-mono text-5xl font-bold">
              {state.running && timer?.time ? timer.time : "00:00:00"}
            </h1>
            <TimeSection timer={timer} running={state.running} />
          </div>
        </div>

        <ProjectSelection
          project={project}
          changeProject={changeProject}
          projects={projects}
          buttonDisabled={state.error || state.loading}
        />
      </CardContent>
    </Card>
  );
}

const ToggleSection = ({
  loading,
  running,
  startType,
  toggle,
}: {
  loading: boolean;
  running: boolean;
  startType: string | null | undefined;
  toggle: (start: boolean) => Promise<void>;
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
          <Button
            variant="destructive"
            className="font-mono"
            onClick={(e) => {
              e.stopPropagation();
              toggle(false);
            }}
          >
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
      <>
        <div className="relative flex w-full items-center justify-center gap-4">
          <p className="animate__animated animate__fadeIn h-6 w-1/4 rounded-md text-center tabular-nums text-muted-foreground">
            {timer.start.toLocaleTimeString()}
          </p>
          <div className="relative">
            <Separator orientation="horizontal" className="w-5" />
          </div>
          <p className="animate__animated animate__fadeIn h-6 w-1/4 select-none rounded-md text-center tabular-nums text-muted-foreground">
            {(timer.end ?? new Date()).toLocaleTimeString()}
          </p>

          {!!timer.breakTime && (
            <div className="absolute -bottom-4 text-xs tabular-nums text-muted-foreground">
              <div className="flex flex-row items-center justify-center">
                <Coffee className="mr-1 size-4" />
                {timer.breakTime.toLocaleString()}
                <sub className="ml-0.5">min</sub>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="flex w-full items-center justify-center gap-4">
      <Skeleton className="animate__animated animate__fadeIn h-6 w-1/4 rounded-md" />
      <Separator orientation="horizontal" className="w-5" />
      <Skeleton className="animate__animated animate__fadeIn h-6 w-1/4 rounded-md" />
    </div>
  );
};
