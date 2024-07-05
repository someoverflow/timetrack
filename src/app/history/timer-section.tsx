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
import { Check, ChevronDown, ListPlus, Loader } from "lucide-react";

import TimerAdd from "./timer-add";
import TimerExportDialog from "./timer-export";

import type { Prisma } from "@prisma/client";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
//#endregion

const TimerInfo = dynamic(() => import("./timer-info"), { ssr: false });

type Timer = Prisma.TimeGetPayload<{
	include: { project: true };
}>;
interface Data {
	[yearMonth: string]: Timer[];
}

export default function TimerSection({
	user,
	history,
	projects,
	yearMonth,
	totalTime,
}: {
	user: string;
	history: Data;
	projects: Prisma.ProjectGetPayload<{ [k: string]: never }>[];
	yearMonth: string;
	totalTime: string;
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

	const historyDays = history[yearMonth]
		.map((entry) => entry.start)
		.filter(
			(item, index, array) =>
				array.indexOf(
					array.find((v) => item.toDateString() === v.toDateString()) ??
						new Date(),
				) === index,
		);

	return (
		<section
			className="w-full max-w-md max-h-[90svh] overflow-hidden flex flex-col items-start"
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
									{`${yearMonth.slice(0, 4)} ${t(`Miscellaneous.Months.${yearMonth.replace(`${yearMonth.slice(0, 4)} `, "")}`)}`}
									<p className="font-mono text-muted-foreground">
										(
										{(history[yearMonth].find((e) => e.end === null)
											? "~"
											: "") + totalTime}
										)
									</p>
								</div>
								<ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="p-2">
							<Command>
								<CommandInput
									placeholder={t("Miscellaneous.searchYearMonth")}
									className="h-8"
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
						</PopoverContent>
					</Popover>
				</div>
				<div className="grid place-items-center">
					<Loader
						className={cn(
							"h-5 w-0 transition-all",
							isPending && "w-5 animate-spin",
						)}
					/>
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
							<p className="text-center">{t("Miscellaneous.newEntry")}</p>
						</TooltipContent>
					</Tooltip>
					<TimerAdd
						user={user}
						projects={projects}
						visible={addVisible}
						setVisible={setAddVisible}
					/>
				</div>
			</div>
			<ScrollArea
				className="h-[calc(95svh-82px-56px-40px)] w-full rounded-sm border p-1.5 overflow-hidden"
				type="scroll"
			>
				{historyDays.map((day, index) => {
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
									/>
								))}
						</section>
					);
				})}
			</ScrollArea>
		</section>
	);
}
