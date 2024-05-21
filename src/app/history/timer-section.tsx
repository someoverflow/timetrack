"use client";

// UI
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
import { Check, ChevronDown, FileDown, ListPlus } from "lucide-react";
import TimerAdd from "./timer-add";

// Database
import type { Prisma } from "@prisma/client";

// Navigation
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// React
import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import dynamic from "next/dynamic";
import TimerExportDialog from "./timer-export";
const TimerInfo = dynamic(() => import("./timer-info"), { ssr: false });

type Timer = Prisma.TimeGetPayload<{
	include: { project: { select: { id: true; name: true } } };
}>;
interface Data {
	[yearMonth: string]: Timer[];
}

export default function TimerSection({
	username,
	history,
	projects,
	yearMonth,
	totalTime,
}: {
	username: string;
	history: Data;
	projects: {
		id: string;
		name: string;
	}[];
	yearMonth: string;
	totalTime: string;
}) {
	const historyKeys = Object.keys(history);

	const router = useRouter();
	const pathname = usePathname();

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
		router.refresh();
	};

	return (
		<section
			className="w-full max-w-md max-h-[90svh] overflow-hidden flex flex-col items-start animate__animated animate__fadeIn"
			key={yearMonth}
		>
			<div className="w-full flex flex-row items-center justify-stretch gap-2 p-2">
				<div className="font-bold w-full">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								className="w-full justify-between"
							>
								<div className="flex flex-row items-center justify-start gap-2">
									{yearMonth}
									<p className="font-mono text-muted-foreground">
										({totalTime})
									</p>
								</div>
								<ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="p-2">
							<Command>
								<CommandInput
									placeholder="Search year/month..."
									className="h-8"
								/>
								<CommandEmpty>Nothing found.</CommandEmpty>
								<CommandGroup>
									{historyKeys.map((key) => (
										<CommandItem
											key={`history-${key}`}
											onSelect={() => changeYearMonth(key)}
											value={key}
											className="font-mono"
										>
											{key}
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
						</PopoverContent>
					</Popover>
				</div>
				<div className="w-max">
					<TimerExportDialog
						history={history}
						yearMonth={yearMonth}
						projects={projects}
					/>
				</div>
				<div className="w-max">
					<Tooltip delayDuration={500}>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								onClick={() => setAddVisible(true)}
							>
								<ListPlus className="h-5 w-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							<p className="text-center">Add a new entry</p>
						</TooltipContent>
					</Tooltip>
					<TimerAdd
						username={username}
						projects={projects}
						visible={addVisible}
						setVisible={setAddVisible}
					/>
				</div>
			</div>
			<ScrollArea
				className="h-[calc(80svh-80px)] w-full rounded-sm border p-1.5 overflow-hidden"
				type="scroll"
			>
				{history[yearMonth].map((time) => (
					<TimerInfo
						key={`timerHistory-${yearMonth}-${time.id}`}
						edit={editTime === time.id}
						projects={projects}
						data={time}
					/>
				))}
			</ScrollArea>
		</section>
	);
}
