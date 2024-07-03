"use client";

// Types
import type { Time } from "@prisma/client";

// UI
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { PlayCircle, RefreshCw, StopCircle, X } from "lucide-react";

// Utils
import { useTranslations } from "next-intl";

import useLiveTimer from "@/lib/hooks/useLiveTimer";

export default function TimerSection() {
	const { timer, state, toggle } = useLiveTimer();

	return (
		<>
			<div>
				<Card className="w-[95vw] max-w-[400px]">
					<CardHeader>
						<div className="w-full flex justify-center items-center flex-row gap-2">
							<ToggleSection
								loaded={!state.loading}
								running={state.running}
								startType={`${timer?.startType}`}
								toggleTimer={toggle}
							/>
						</div>
					</CardHeader>
					<CardContent>
						<div className="w-full h-full flex flex-col items-center gap-6 pb-2">
							<h1 className="text-5xl font-bold font-mono select-none animate__animated animate__fadeIn">
								{state.running && timer?.time ? timer.time : "00:00:00"}
							</h1>
							<TimeSection running={state.running} timer={timer} />
						</div>
					</CardContent>
					{/* TODO: Project Selection */}
				</Card>
			</div>
		</>
	);
}

function ToggleSection({
	loaded,
	running,
	startType,
	toggleTimer,
}: {
	loaded: boolean;
	running: boolean;
	startType: string;
	toggleTimer: (toggle: boolean) => void;
}) {
	const t = useTranslations("Timer.Miscellaneous");

	if (!loaded) {
		return (
			<Button
				variant="default"
				className="font-mono text-2xl h-32 rounded-md w-full"
				disabled
			>
				<RefreshCw className="mr-2 h-6 w-6 animate-spin" />
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
						className="font-mono text-2xl h-32 rounded-md w-full"
						onClick={() => toggleTimer(false)}
					>
						<StopCircle className="mr-2 h-6 w-6" />
						<p>{t("stop")}</p>
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>{t("startedWith", { startType: startType })}</p>
				</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="secondary"
					className="font-mono text-2xl h-32 rounded-md w-full"
					onClick={() => toggleTimer(true)}
				>
					<PlayCircle className="mr-2 h-6 w-6" />
					<p>{t("start")}</p>
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>{t("startWithWebsite")}</p>
			</TooltipContent>
		</Tooltip>
	);
}

function TimeSection({
	running,
	timer,
}: {
	running: boolean;
	timer: Time | undefined;
}) {
	if (running && timer) {
		return (
			<div className="flex w-full justify-center items-center gap-4">
				<p className="text-muted-foreground text-center tabular-nums h-6 w-1/4 rounded-md animate__animated animate__fadeIn">
					{`${timer.start.toLocaleTimeString()}`}
				</p>
				<Separator orientation="horizontal" className="w-5" />
				<p className="text-muted-foreground text-center tabular-nums h-6 w-1/4 rounded-md animate__animated animate__fadeIn select-none">
					{`${timer.end?.toLocaleTimeString()}`}
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
}
