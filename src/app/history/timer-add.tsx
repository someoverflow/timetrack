"use client";

//#region Imports
import type { Prisma } from "@prisma/client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown, ListPlus, SaveAll } from "lucide-react";
import { toast } from "sonner";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import useRequest from "@/lib/hooks/useRequest";

import { cn } from "@/lib/utils";
import Link from "next/link";
//#endregion

interface timerAddState {
	start: string;
	end: string;
	notes: string;
	traveledDistance: number | null;
	projectSelectionOpen: boolean;
	project: string | null;
}

export default function TimerAdd({
	user,
	projects,
	visible,
	setVisible,
}: {
	user: string;
	projects: Prisma.ProjectGetPayload<{ [k: string]: never }>[];
	visible: boolean;
	setVisible: (visible: boolean) => void;
}) {
	const router = useRouter();
	const t = useTranslations("History");

	const [data, setData] = useReducer(
		(prev: timerAddState, next: Partial<timerAddState>) => ({
			...prev,
			...next,
		}),
		{
			start: new Date().toLocaleString("sv").replace(" ", "T"),
			end: new Date(new Date().setHours(new Date().getHours() + 2))
				.toLocaleString("sv")
				.replace(" ", "T"),
			traveledDistance: null,
			notes: "",
			projectSelectionOpen: false,
			project: null,
		},
	);

	const { status, send } = useRequest(
		() =>
			fetch("/api/times", {
				method: "POST",
				body: JSON.stringify({
					userId: user,
					notes: data.notes,
					traveledDistance:
						data.traveledDistance === 0 ? null : data.traveledDistance,
					start: new Date(data.start).toISOString(),
					end: new Date(data.end).toISOString(),
					startType: "Website",
					endType: "Website",
					project: data.project ?? undefined,
				}),
			}),
		(_result) => {
			setVisible(false);
			setData({
				start: new Date().toLocaleString("sv").replace(" ", "T"),
				end: new Date(new Date().setHours(new Date().getHours() + 2))
					.toLocaleString("sv")
					.replace(" ", "T"),
				notes: "",
			});

			toast.success(t("Miscellaneous.created"), {
				duration: 5_000,
			});
			router.refresh();
		},
	);

	return (
		<Dialog
			key="timerModal-add"
			open={visible}
			onOpenChange={(e) => setVisible(e)}
		>
			<DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
				<DialogHeader>
					<DialogTitle>
						<div>{t("Dialogs.Create.title")}</div>
					</DialogTitle>
				</DialogHeader>

				<div className="w-full flex flex-col gap-2">
					<Tabs defaultValue="details">
						<TabsList className="flex w-full">
							<TabsTrigger className="w-full" value="details">
								{t("Dialogs.Create.details")}
							</TabsTrigger>
							<TabsTrigger className="w-full" value="time">
								{t("Dialogs.Create.time")}
							</TabsTrigger>
						</TabsList>
						<TabsContent value="details">
							<ScrollArea
								className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
								type="always"
							>
								<div className="h-full w-full grid p-1 gap-1.5">
									<Popover
										open={data.projectSelectionOpen}
										onOpenChange={(open) =>
											setData({ projectSelectionOpen: open })
										}
									>
										<Label
											htmlFor="project-button"
											className="pl-2 text-muted-foreground"
										>
											{t("Dialogs.Create.project.project")}
										</Label>
										<PopoverTrigger asChild>
											<Button
												id="project-button"
												variant="outline"
												role="combobox"
												aria-expanded={data.projectSelectionOpen}
												className="w-full justify-between border-2 transition duration-300"
											>
												{data.project ?? t("Dialogs.Create.project.noRelated")}
												<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="p-2">
											<Command>
												<CommandInput
													placeholder={t("Dialogs.Create.project.search")}
													className="h-8"
												/>
												{projects.length === 0 ? (
													<div className="items-center justify-center text-center text-sm text-muted-foreground pt-4">
														<p>{t("Dialogs.Create.project.noProjects")}</p>
														<Link
															href="/projects"
															className={buttonVariants({
																variant: "link",
																className: "flex-col items-start",
															})}
														>
															<p>
																{t(
																	"Dialogs.Create.project.noProjectsDescription",
																)}
															</p>
														</Link>
													</div>
												) : (
													<CommandGroup>
														{projects.map((project) => (
															<CommandItem
																key={`project-selection-add-${project.name}`}
																value={`${project.name}`}
																onSelect={() => {
																	setData({
																		project:
																			data.project !== project.name
																				? project.name
																				: null,
																		projectSelectionOpen: false,
																	});
																}}
															>
																<Check
																	className={cn(
																		"mr-2 h-4 w-4",
																		data.project === project.name
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

								<div id="divider" className="h-4" />

								<div className="h-full w-full grid p-1 gap-1.5">
									<Label
										htmlFor="timerModal-notes-add"
										className="text-muted-foreground pl-2"
									>
										{t("Dialogs.Create.notes")}
									</Label>
									<Textarea
										id="timerModal-notes-add"
										className="h-full min-h-[30svh] max-h-[50svh] border-2 transition duration-300"
										spellCheck={true}
										onChange={(e) => setData({ notes: e.target.value })}
										value={data.notes}
									/>
								</div>

								<div id="divider" className="h-4" />

								<div className="h-full w-full grid p-1 gap-1.5">
									<Label
										htmlFor="distance-button"
										className="pl-2 text-muted-foreground"
									>
										{t("Dialogs.Create.distance")}
									</Label>
									<Input
										id="distance-button"
										type="number"
										min={0}
										className="w-full justify-between border-2 transition duration-300"
										onChange={(change) => {
											const target = change.target.valueAsNumber;
											setData({
												traveledDistance: Number.isNaN(target) ? null : target,
											});
										}}
										value={data.traveledDistance ?? ""}
									/>
								</div>
							</ScrollArea>
						</TabsContent>
						<TabsContent value="time" className="h-full">
							<ScrollArea
								className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
								type="always"
							>
								<div className="grid gap-4 p-1 w-full">
									<div className="grid w-full items-center gap-1.5">
										<Label
											htmlFor="name"
											className="pl-2 text-muted-foreground"
										>
											{t("Dialogs.Create.start")}
										</Label>
										<Input
											className="!w-full font-mono border-2 transition-all duration-300"
											type="datetime-local"
											name="Updated"
											id="updated"
											step={1}
											value={data.start}
											onChange={(e) => setData({ start: e.target.value })}
										/>
									</div>
									<div className="grid w-full items-center gap-1.5">
										<Label
											htmlFor="username"
											className="pl-2 text-muted-foreground"
										>
											{t("Dialogs.Create.end")}
										</Label>
										<Input
											className="w-full font-mono border-2 transition-all duration-300"
											type="datetime-local"
											name="Created"
											id="created"
											step={1}
											value={data.end}
											onChange={(e) => setData({ end: e.target.value })}
										/>
									</div>
								</div>
							</ScrollArea>
						</TabsContent>
						<TabsContent value="breaks" className="h-full">
							<ScrollArea
								className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
								type="always"
							>
								<div className="grid gap-4 p-1 w-full">
									<div className="grid w-full items-center gap-1.5">
										<Label
											htmlFor="name"
											className="pl-2 text-muted-foreground"
										>
											In work...
										</Label>
									</div>
								</div>
							</ScrollArea>
						</TabsContent>
					</Tabs>

					<div className="w-full gap-2 flex flex-row justify-end">
						<Button variant="outline" onClick={send} disabled={status.loading}>
							<SaveAll className="mr-2 h-4 w-4" />
							{t("Dialogs.Create.create")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function TimerAddServer({
	user,
	projects,
}: {
	user: string;
	projects: Prisma.ProjectGetPayload<{ [k: string]: never }>[];
}) {
	const router = useRouter();
	const t = useTranslations("History");

	const [visible, setVisible] = useState(false);
	const [data, setData] = useReducer(
		(prev: timerAddState, next: Partial<timerAddState>) => ({
			...prev,
			...next,
		}),
		{
			start: new Date().toLocaleString("sv").replace(" ", "T"),
			end: new Date(new Date().setHours(new Date().getHours() + 2))
				.toLocaleString("sv")
				.replace(" ", "T"),
			notes: "",
			traveledDistance: null,
			project: null,
			projectSelectionOpen: false,
		},
	);

	const { status, send } = useRequest(
		() =>
			fetch("/api/times", {
				method: "POST",
				body: JSON.stringify({
					userId: user,
					notes: data.notes,
					traveledDistance:
						data.traveledDistance === 0 ? null : data.traveledDistance,
					start: new Date(data.start).toISOString(),
					end: new Date(data.end).toISOString(),
					startType: "Website",
					endType: "Website",
					project: data.project ?? undefined,
				}),
			}),
		(_result) => {
			setVisible(false);
			setData({
				start: new Date().toLocaleString("sv").replace(" ", "T"),
				end: new Date(new Date().setHours(new Date().getHours() + 2))
					.toLocaleString("sv")
					.replace(" ", "T"),
				notes: "",
			});

			toast.success(t("Miscellaneous.created"), {
				duration: 5_000,
			});
			router.refresh();
		},
	);

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant="outline" onClick={() => setVisible(!visible)}>
						<ListPlus className="mr-2 h-5 w-5" />
						{t("Dialogs.Create.first.title")}
					</Button>
				</TooltipTrigger>

				<TooltipContent>
					<div
						className="text-center"
						dangerouslySetInnerHTML={{
							__html: t.raw("Dialogs.Create.first.description"),
						}}
					/>
				</TooltipContent>
			</Tooltip>
			<Dialog
				key="timerModal-add"
				open={visible}
				onOpenChange={(e) => setVisible(e)}
			>
				<DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
					<DialogHeader>
						<DialogTitle>
							<div>{t("Dialogs.Create.title")}</div>
						</DialogTitle>
					</DialogHeader>

					<div className="w-full flex flex-col gap-2">
						<Tabs defaultValue="details">
							<TabsList className="flex w-full">
								<TabsTrigger className="w-full" value="details">
									{t("Dialogs.Create.details")}
								</TabsTrigger>
								<TabsTrigger className="w-full" value="time">
									{t("Dialogs.Create.time")}
								</TabsTrigger>
							</TabsList>
							<TabsContent value="details">
								<ScrollArea
									className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="h-full w-full grid p-1 gap-1.5">
										<Popover
											open={data.projectSelectionOpen}
											onOpenChange={(open) =>
												setData({ projectSelectionOpen: open })
											}
										>
											<Label
												htmlFor="project-button"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Create.project.project")}
											</Label>
											<PopoverTrigger asChild>
												<Button
													id="project-button"
													variant="outline"
													role="combobox"
													aria-expanded={data.projectSelectionOpen}
													className="w-full justify-between border-2 transition duration-300"
												>
													{data.project ??
														t("Dialogs.Create.project.noRelated")}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="p-2">
												<Command>
													<CommandInput
														placeholder={t("Dialogs.Create.project.search")}
														className="h-8"
													/>
													{projects.length === 0 ? (
														<div className="items-center justify-center text-center text-sm text-muted-foreground pt-4">
															<p>{t("Dialogs.Create.project.noProjects")}</p>
															<Link
																href="/projects"
																className={buttonVariants({
																	variant: "link",
																	className: "flex-col items-start",
																})}
															>
																<p>
																	{t(
																		"Dialogs.Create.project.noProjectsDescription",
																	)}
																</p>
															</Link>
														</div>
													) : (
														<CommandGroup>
															{projects.map((project) => (
																<CommandItem
																	key={`project-selection-add-${project.name}`}
																	value={`${project.name}`}
																	onSelect={() => {
																		setData({
																			project:
																				data.project !== project.name
																					? project.name
																					: null,
																			projectSelectionOpen: false,
																		});
																	}}
																>
																	<Check
																		className={cn(
																			"mr-2 h-4 w-4",
																			data.project === project.name
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

									<div id="divider" className="h-4" />

									<div className="h-full w-full grid p-1 gap-1.5">
										<Label
											htmlFor="timerModal-notes-add"
											className="text-muted-foreground pl-2"
										>
											{t("Dialogs.Create.notes")}
										</Label>
										<Textarea
											id="timerModal-notes-add"
											className={`h-full min-h-[30svh] max-h-[50svh] border-2 transition duration-300 ${
												data.notes !== (data.notes ?? "") && "border-sky-700"
											}`}
											spellCheck={true}
											value={data.notes}
											onChange={(e) => setData({ notes: e.target.value })}
										/>
									</div>

									<div id="divider" className="h-4" />

									<div className="h-full w-full grid p-1 gap-1.5">
										<Label
											htmlFor="distance-button"
											className="pl-2 text-muted-foreground"
										>
											{t("Dialogs.Create.distance")}
										</Label>
										<Input
											id="distance-button"
											type="number"
											min={0}
											className="w-full justify-between border-2 transition duration-300"
											onChange={(change) => {
												const target = change.target.valueAsNumber;
												setData({
													traveledDistance: Number.isNaN(target)
														? null
														: target,
												});
											}}
											value={data.traveledDistance ?? ""}
										/>
									</div>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="time" className="h-full">
								<ScrollArea
									className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="grid gap-4 p-1 w-full">
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="name"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Create.start")}
											</Label>
											<Input
												className="!w-full font-mono border-2 transition-all duration-300"
												type="datetime-local"
												name="Updated"
												id="updated"
												step={1}
												value={data.start}
												onChange={(e) => setData({ start: e.target.value })}
											/>
										</div>
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="username"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Create.end")}
											</Label>
											<Input
												className="w-full font-mono border-2 transition-all duration-300"
												type="datetime-local"
												name="Created"
												id="created"
												step={1}
												value={data.end}
												onChange={(e) => setData({ end: e.target.value })}
											/>
										</div>
									</div>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="breaks" className="h-full">
								<ScrollArea
									className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="grid gap-4 p-1 w-full">
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="name"
												className="pl-2 text-muted-foreground"
											>
												In work...
											</Label>
										</div>
									</div>
								</ScrollArea>
							</TabsContent>
						</Tabs>

						<div className="w-full gap-2 flex flex-row justify-end">
							<Button
								variant="outline"
								onClick={send}
								disabled={status.loading}
							>
								<SaveAll className="mr-2 h-4 w-4" />
								{t("Dialogs.Create.create")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
