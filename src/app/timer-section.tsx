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
            "w-full rounded-lg bg-secondary/5 shadow-md hover:shadow-lg border border-border/50 transition-all duration-300 pt-2 mt-6 pb-6 mb-4",
            !state.running && "hover:border-border cursor-pointer",
            state.error && "blur-sm",
            state.loading && "!cursor-wait",
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
                toggle={toggle}
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
              toggle(true);
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
        <div className="relative flex w-full justify-center items-center gap-4">
          <p className="text-muted-foreground text-center tabular-nums h-6 w-1/4 rounded-md animate__animated animate__fadeIn">
            {timer.start.toLocaleTimeString()}
          </p>
          <div className="relative">
            <Separator orientation="horizontal" className="w-5" />
          </div>
          <p className="text-muted-foreground text-center tabular-nums h-6 w-1/4 rounded-md animate__animated animate__fadeIn select-none">
            {(timer.end ?? new Date()).toLocaleTimeString()}
          </p>

          {!!timer.breakTime && (
            <div className="absolute -bottom-4 tabular-nums text-muted-foreground text-xs">
              <div className="flex flex-row items-center justify-center">
                <Coffee className="size-4 mr-1" />
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
    <div className="flex w-full justify-center items-center gap-4">
      <Skeleton className="h-6 w-1/4 rounded-md animate__animated animate__fadeIn" />
      <Separator orientation="horizontal" className="w-5" />
      <Skeleton className="h-6 w-1/4 rounded-md animate__animated animate__fadeIn" />
    </div>
  );
};
