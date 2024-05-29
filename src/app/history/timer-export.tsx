"use client";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getTotalTime } from "@/lib/utils";

import type { Prisma } from "@prisma/client";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { Check, ChevronsUpDown, Download, FileDown } from "lucide-react";
import { useEffect, useMemo, useReducer, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const umlautMap: Record<string, string> = {
	"\u00dc": "UE",
	"\u00c4": "AE",
	"\u00d6": "OE",
	"\u00fc": "ue",
	"\u00e4": "ae",
	"\u00f6": "oe",
	"\u00df": "ss",
};

function replaceUmlaute(str: string) {
	return str
		.replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
			const big = umlautMap[a.slice(0, 1)];
			return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
		})
		.replace(
			new RegExp(`[${Object.keys(umlautMap).join("|")}]`, "g"),
			(a) => umlautMap[a],
		);
}

type Timer = Prisma.TimeGetPayload<{
	include: { project: true };
}>;
interface Data {
	[yearMonth: string]: Timer[];
}

interface exportFilterState {
	project: string | null | undefined;
	yearMonth: string;
}
interface visualisationState {
	showProject: boolean;
	showDateColumn: boolean;
	structurizeDateTree: boolean;
}

export default function TimerExportDialog({
	history,
	yearMonth,
	projects,
}: {
	history: Data;
	yearMonth: string;
	projects: Prisma.ProjectGetPayload<{ [k: string]: never }>[];
}) {
	const [filters, setFilters] = useReducer(
		(prev: exportFilterState, next: Partial<exportFilterState>) => ({
			...prev,
			...next,
		}),
		{
			project: undefined,
			yearMonth: yearMonth,
		},
	);
	const [visualisation, setVisualisation] = useReducer(
		(prev: visualisationState, next: Partial<visualisationState>) => {
			if (next.showProject !== undefined)
				localStorage.setItem(
					"export-visualisation-showProject",
					`${next.showProject}`,
				);
			if (next.showDateColumn !== undefined)
				localStorage.setItem(
					"export-visualisation-showDateColumn",
					`${next.showDateColumn}`,
				);
			if (next.structurizeDateTree !== undefined)
				localStorage.setItem(
					"export-visualisation-structurizeDateTree",
					`${next.structurizeDateTree}`,
				);

			return {
				...prev,
				...next,
			};
		},
		{
			showProject: true,
			showDateColumn: true,
			structurizeDateTree: true,
		},
	);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const localShowProject = localStorage.getItem(
			"export-visualisation-showProject",
		);
		const localShowDateColumn = localStorage.getItem(
			"export-visualisation-showDateColumn",
		);
		const localStructurizeDateTree = localStorage.getItem(
			"export-visualisation-structurizeDateTree",
		);

		setVisualisation({
			showProject: Boolean(localShowProject ?? "true"),
			showDateColumn: Boolean(localShowDateColumn ?? "true"),
			structurizeDateTree: Boolean(localStructurizeDateTree ?? "true"),
		});
	}, []);

	const exportData = useMemo(() => {
		// Prepare data for export
		let data = history[filters.yearMonth];

		if (filters.project !== undefined)
			data = data.filter((entry) => entry.projectName === filters.project);

		return data;
	}, [history, filters]);

	const downloadCSV = () => {
		// Prepare Data
		const timeStrings = (exportData || [])
			.map((data) => data.time)
			.filter(Boolean); // Remove all undefined or null
		const totalTime =
			timeStrings.length === 0
				? "00:00:00"
				: getTotalTime(timeStrings as string[]);

		// Prepare CSV
		let result = "";
		if (visualisation.showDateColumn) result = `${result}Date;`;
		result = `${result}Start;End;Duration;`;
		if (visualisation.showProject) result = `${result}Project;`;
		result = `${result}Notes`;

		if (visualisation.structurizeDateTree) {
			const structurized: Data = {};

			for (const item of exportData.reverse()) {
				const date = new Date(item.start);

				if (!structurized[date.toLocaleDateString()])
					structurized[date.toLocaleDateString()] = [];
				structurized[date.toLocaleDateString()].push(item);
			}

			for (const date of Object.keys(structurized)) {
				result = `${result}\n${date}`;
				for (const time of structurized[date]) {
					if (!time.end) continue;
					result = `${result}\n`;

					result = `${result};${time.start.toLocaleTimeString()};${time.end?.toLocaleTimeString()};${
						time.time
					}`;
					if (visualisation.showProject)
						result = `${result};${time.project?.name ?? ""}`;
					if (time.notes)
						result = `${result};"${
							time.notes.startsWith("-")
								? time.notes.replace("-", " -")
								: time.notes
						}"`;
				}
			}
		} else {
			for (const time of exportData.reverse()) {
				if (!time.end) continue;

				result = `${result}\n`;
				if (visualisation.showDateColumn)
					result = `${result}${time.start.toLocaleDateString()};${time.start.toLocaleTimeString()};${time.end?.toLocaleTimeString()};${
						time.time
					}`;
				else
					result = `${result}${time.start.toLocaleString()};${time.end?.toLocaleString()};${
						time.time
					}`;
				if (visualisation.showProject)
					result = `${result};${time.project?.name ?? ""}`;
				if (time.notes)
					result = `${result};"${
						time.notes.startsWith("-")
							? time.notes.replace("-", " -")
							: time.notes
					}"`;
			}
		}

		result = `${result}\n\n`;
		if (visualisation.showDateColumn) result = `${result};`;
		result = `${result};;${totalTime};`;
		if (visualisation.showProject) result = `${result};`;

		result = replaceUmlaute(result);

		// Download CSV
		const element = document.createElement("a");
		const file = new Blob([result], {
			type: "text/plain",
		});
		element.href = URL.createObjectURL(file);
		element.download = `Time ${filters.yearMonth}.csv`;
		document.body.appendChild(element);
		element.click();
	};

	return (
		<>
			<Tooltip delayDuration={500}>
				<TooltipTrigger asChild>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setVisible(true)}
					>
						<FileDown className="h-5 w-5" />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					<p className="text-center">
						Download a <code>.csv</code> containing all
						<br /> the current visible entries
					</p>
				</TooltipContent>
			</Tooltip>

			<Dialog
				key={"exportModal"}
				open={visible}
				onOpenChange={(e) => setVisible(e)}
			>
				<DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
					<DialogHeader>
						<DialogTitle>
							<div>Export History</div>
						</DialogTitle>
					</DialogHeader>

					<div className="rounded-md border p-4">
						<div className="flex items-center space-x-4">
							<div className="flex-1 space-y-1">
								<p className="text-sm font-medium leading-none">Filters</p>
								<p className="text-sm text-muted-foreground">
									Filter the data to download.
								</p>
							</div>
						</div>

						<Separator className="my-5" orientation="horizontal" />

						<div className="w-full flex flex-col sm:flex-row items-center justify-evenly gap-4">
							<div className="w-full flex flex-col gap-2">
								<Popover>
									<Label
										htmlFor="yearMonth-button"
										className="pl-2 text-muted-foreground"
									>
										Year / Month
									</Label>
									<PopoverTrigger asChild>
										<Button
											id="yearMonth-button"
											variant="outline"
											role="combobox"
										>
											{filters.yearMonth}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="p-2">
										<Command>
											<CommandInput placeholder="Search..." className="h-8" />
											<CommandGroup>
												{Object.keys(history).map((yearMonth) => (
													<CommandItem
														key={`yearMonth-filter-${yearMonth}`}
														value={yearMonth}
														onSelect={() => {
															setFilters({
																yearMonth: yearMonth,
															});
														}}
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																filters.yearMonth === yearMonth
																	? "opacity-100"
																	: "opacity-0",
															)}
														/>
														{yearMonth}
													</CommandItem>
												))}
											</CommandGroup>
										</Command>
									</PopoverContent>
								</Popover>
							</div>
							<Separator
								className="h-10 hidden sm:block"
								orientation="vertical"
							/>
							<div className="w-full flex flex-col gap-2">
								<Popover>
									<Label
										htmlFor="project-button"
										className="pl-2 text-muted-foreground"
									>
										Project
									</Label>
									<PopoverTrigger asChild>
										<Button
											id="project-button"
											variant="outline"
											role="combobox"
										>
											{filters.project !== undefined
												? filters.project ?? "Without a Project"
												: "All Projects"}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="p-2">
										<Command>
											<CommandInput
												placeholder="Search project..."
												className="h-8"
											/>
											<CommandGroup>
												<CommandGroup>
													<CommandItem
														key={"project-filter-none"}
														onSelect={() => {
															setFilters({
																project:
																	filters.project !== null ? null : undefined,
															});
														}}
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																filters.project === null
																	? "opacity-100"
																	: "opacity-0",
															)}
														/>
														Without a Project
													</CommandItem>
												</CommandGroup>
												<CommandGroup heading="Projects">
													{projects.map((project) => (
														<CommandItem
															key={`project-filter-${project.name}`}
															value={project.name}
															onSelect={() => {
																setFilters({
																	project:
																		filters.project !== project.name
																			? project.name
																			: undefined,
																});
															}}
														>
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	filters.project === project.name
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
															{project.name}
														</CommandItem>
													))}
												</CommandGroup>
											</CommandGroup>
										</Command>
									</PopoverContent>
								</Popover>
							</div>
						</div>
					</div>

					<div className="rounded-md border p-4">
						<div className="flex items-center space-x-4">
							<div className="flex-1 space-y-1">
								<p className="text-sm font-medium leading-none">
									Visualisation
								</p>
								<p className="text-sm text-muted-foreground">
									Customize the table to export.
								</p>
							</div>
						</div>

						<Separator className="my-5" orientation="horizontal" />

						<div className="flex flex-col gap-2">
							<div className="flex items-center space-x-2">
								<Switch
									id="date-toggle"
									checked={visualisation.showDateColumn}
									onCheckedChange={(value) => {
										setVisualisation({
											showDateColumn: value,
											structurizeDateTree: false,
										});
									}}
								/>
								<Label
									htmlFor="date-toggle"
									className="pl-2 text-muted-foreground"
								>
									Show the Date in a specific column
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="date-tree-toggle"
									checked={visualisation.structurizeDateTree}
									onCheckedChange={(value) => {
										setVisualisation({
											structurizeDateTree: value,
											showDateColumn: true,
										});
									}}
								/>
								<Label
									htmlFor="date-tree-toggle"
									className="pl-2 text-muted-foreground"
								>
									Structure by date in the tree
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="project-toggle"
									checked={visualisation.showProject}
									onCheckedChange={(value) => {
										setVisualisation({
											showProject: value,
										});
									}}
								/>
								<Label
									htmlFor="project-toggle"
									className="pl-2 text-muted-foreground"
								>
									Show the Project in a specific column
								</Label>
							</div>
						</div>
					</div>

					<Button onClick={downloadCSV}>
						<Download className="mr-2 h-4 w-4" /> Download
					</Button>
				</DialogContent>
			</Dialog>
		</>
	);
}
