"use client";

// UI
import {
	SwipeableListItem,
	SwipeAction,
	TrailingActions,
} from "react-swipeable-list";
import "react-swipeable-list/dist/styles.css";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown, SaveAll, Trash, Trash2 } from "lucide-react";

// Database
import type { Prisma, Time, Todo } from "@prisma/client";

// Navigation
import { useRouter } from "next/navigation";

// React
import { useEffect, useReducer, useState } from "react";
import Link from "next/link";

import { cn, getTimePassed } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

type Timer = Prisma.TimeGetPayload<{
	include: { project: true };
}>;
interface timerInfoState {
	notes: string;
	start: string;
	end: string;
	loading: boolean;

	traveledDistance: number | null;

	projectSelectionOpen: boolean;
	projectName: string | null;
}
export default function TimerInfo({
	data,
	projects,
	edit,
}: {
	data: Timer;
	projects: Prisma.ProjectGetPayload<{ [k: string]: never }>[];
	edit: boolean;
}) {
	const t = useTranslations("History");
	const router = useRouter();

	const [state, setState] = useReducer(
		(prev: timerInfoState, next: Partial<timerInfoState>) => ({
			...prev,
			...next,
		}),
		{
			loading: false,

			notes: data.notes ?? "",
			start: data.start.toLocaleString("sv").replace(" ", "T"),
			end: data.end
				? data.end.toLocaleString("sv").replace(" ", "T")
				: new Date().toLocaleString("sv").replace(" ", "T"),

			traveledDistance: data.traveledDistance ?? null,

			projectSelectionOpen: false,
			projectName: data.projectName,
		},
	);

	const [blockVisible, setBlockVisible] = useState(false);
	const [dragProgress, setDragProgress] = useState(0);
	const [visible, setVisible] = useState(edit);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Only run when visibility changed
	useEffect(() => {
		if (visible) {
			// Reset everything when opening/closing
			setState({
				notes: data.notes ?? "",
				start: data.start.toLocaleString("sv").replace(" ", "T"),
				end: data.end
					? data.end.toLocaleString("sv").replace(" ", "T")
					: new Date().toLocaleString("sv").replace(" ", "T"),
				traveledDistance: data.traveledDistance ?? null,
			});
		}
	}, [visible]);

	useEffect(() => {
		if (data.end === null && !visible) {
			const interval = setInterval(
				() =>
					setState({ end: new Date().toLocaleString("sv").replace(" ", "T") }),
				1000,
			);
			return () => clearInterval(interval);
		}
	});

	async function sendRequest(updateEndTime: boolean) {
		setState({
			loading: true,
		});

		const request: Partial<{
			id: string;
			notes: string;
			startType: string;
			start: string;
			endType: string;
			end: string;
			project: string | null;
			traveledDistance: number | null;
		}> = {
			id: data.id,
			notes: state.notes,
		};

		const startChanged =
			state.start !== data.start.toLocaleString("sv").replace(" ", "T");
		if (startChanged) {
			request.startType = "Website";
			request.start = new Date(state.start).toISOString();
		}

		if (updateEndTime) {
			const endChanged =
				state.end !== data.end?.toLocaleString("sv").replace(" ", "T");

			if (endChanged) {
				request.endType = "Website";
				request.end = new Date(state.end).toISOString();
			}
		}

		if (state.projectName !== data.projectName)
			request.project = state.projectName;

		if (state.traveledDistance !== data.traveledDistance)
			request.traveledDistance = state.traveledDistance;

		const result = await fetch("/api/times", {
			method: "PUT",
			body: JSON.stringify(request),
		});

		setState({
			loading: false,
		});

		const resultData: APIResult = await result.json().catch(() => {
			toast.error("An error occurred", {
				description: "Result could not be proccessed",
				important: true,
				duration: 8000,
			});
			return;
		});

		if (resultData.success) {
			setVisible(false);

			toast.success("Successfully updated entry", {
				duration: 3000,
			});
			router.refresh();
			return;
		}

		switch (resultData.type) {
			case "validation":
				toast.warning(`An error occurred (${resultData.result[0].code})`, {
					description: resultData.result[0].message,
					important: true,
					duration: 5000,
				});
				break;
			default:
				toast.error(`An error occurred (${resultData.type ?? "unknown"})`, {
					description: "Error could not be identified. You can try again.",
					important: true,
					duration: 8000,
				});
				break;
		}
	}
	async function sendDeleteRequest() {
		setState({
			loading: true,
		});

		const result = await fetch("/api/times", {
			method: "DELETE",
			body: JSON.stringify({
				id: data.id,
			}),
		});

		setState({
			loading: false,
		});

		const resultData: APIResult = await result.json().catch(() => {
			toast.error("An error occurred", {
				description: "Result could not be proccessed",
				important: true,
				duration: 8000,
			});
			return;
		});

		if (resultData.success) {
			setVisible(false);

			console.log(resultData.result);
			const undoTime: Time = resultData.result;

			toast.success("Successfully deleted entry", {
				duration: 3000,
				action: undoTime.end
					? {
							label: "Undo",
							onClick: async () => {
								const result = await fetch("/api/times", {
									method: "POST",
									body: JSON.stringify({
										userId: data.userId,
										notes: undoTime.notes,
										traveledDistance:
											undoTime.traveledDistance === 0
												? null
												: undoTime.traveledDistance,
										start: undoTime.start,
										end: undoTime.end,
										startType: undoTime.startType ?? undefined,
										endType: undoTime.endType ?? undefined,
										project: undoTime.projectName ?? undefined,
									}),
								});
								console.log("Undo:", result);
								router.refresh();
							},
						}
					: undefined,
			});
			router.refresh();
			return;
		}

		switch (resultData.type) {
			case "validation":
				toast.warning(`An error occurred (${resultData.result[0].code})`, {
					description: resultData.result[0].message,
					important: true,
					duration: 5000,
				});
				break;
			default:
				toast.error(`An error occurred (${resultData.type ?? "unknown"})`, {
					description: "Error could not be identified. You can try again.",
					important: true,
					duration: 8000,
				});
				break;
		}
	}

	const preventClosing = () => {
		let prevent = false;

		if (state.loading) prevent = true;

		if (state.notes !== (data.notes ?? "")) prevent = true;

		if (
			state.start !== data.start.toLocaleString("sv").replace(" ", "T") ||
			state.end !==
				(data.end
					? data.end.toLocaleString("sv").replace(" ", "T")
					: new Date().toLocaleString("sv").replace(" ", "T"))
		)
			prevent = true;

		if (state.traveledDistance !== data.traveledDistance ?? null)
			prevent = true;

		if (state.projectName !== data.projectName || state.projectSelectionOpen)
			prevent = true;

		return prevent;
	};

	return (
		<>
			<SwipeableListItem
				onSwipeStart={() => setBlockVisible(true)}
				onSwipeEnd={() => {
					setDragProgress(0);
					setTimeout(() => setBlockVisible(false), 500);
				}}
				onSwipeProgress={(progress) => setDragProgress(progress)}
				trailingActions={
					<TrailingActions>
						<SwipeAction
							destructive={true}
							onClick={() => setTimeout(() => sendDeleteRequest(), 500)}
						>
							<div className="flex flex-row items-center justify-between w-full h-full p-2">
								<Trash2
									className={`text-destructive h-1/2 w-1/2 transition-all duration-200 ${
										dragProgress > 50 ? "text-error" : "text-warning scale-50"
									}`}
								/>
							</div>
						</SwipeAction>
					</TrailingActions>
				}
				threshold={0.5}
				className="p-1"
			>
				<button
					type="button"
					className="w-full font-mono p-2 select-none rounded-sm border border-border hover:border-ring cursor-pointer transition-all duration-300 animate__animated animate__slideInLeft"
					onClick={() => {
						if (!blockVisible) setVisible(true);
					}}
				>
					<div className="flex items-center justify-between pb-2">
						{data.project ? (
							<Badge variant="secondary" className="text-xs">
								{data.project.name}
							</Badge>
						) : (
							<div className="pb-4" />
						)}
					</div>

					<div className="flex flex-row justify-evenly items-center text-lg">
						<p>{data.start.toLocaleTimeString()}</p>
						<div className="relative flex flex-col items-center">
							<Separator orientation="horizontal" className="w-10" />
							<p className="text-xs text-muted-foreground/80 absolute -bottom-5">
								{data.time ?? getTimePassed(data.start, new Date(state.end))}
							</p>
						</div>
						<p className={data.end ? "" : "opacity-50"}>
							{new Date(state.end).toLocaleTimeString()}
						</p>
					</div>

					<p
						className={cn(
							"text-xs text-muted-foreground/90 truncate max-w-52 text-start p-2 pt-4",
						)}
					>
						{data.notes &&
							(data.notes?.split("\n")[0].startsWith("- ")
								? `${data.notes?.split("\n")[0].replace("- ", "")} …`
								: data.notes?.split("\n")[0])}
					</p>
				</button>
			</SwipeableListItem>

			<Dialog
				key={`timer-modal-${data.id}`}
				open={visible}
				onOpenChange={(e) => setVisible(e)}
			>
				<DialogContent
					className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between"
					onPointerDownOutside={(e) => {
						if (preventClosing()) e.preventDefault();
					}}
					onInteractOutside={(e) => {
						if (preventClosing()) e.preventDefault();
					}}
				>
					<DialogHeader>
						<DialogTitle>
							<div>{t("Dialogs.Edit.title")}</div>
						</DialogTitle>
					</DialogHeader>

					<div className="w-full flex flex-col gap-2">
						<Tabs defaultValue="details">
							<TabsList className="flex w-full">
								<TabsTrigger className="w-full" value="details">
									{t("Dialogs.Edit.details")}
								</TabsTrigger>
								<TabsTrigger className="w-full" value="time">
									{t("Dialogs.Edit.time")}
								</TabsTrigger>
								{/* <TabsTrigger className="w-full" value="breaks">
									{t("Dialogs.Edit.breaks")}
								</TabsTrigger> */}
							</TabsList>
							<TabsContent value="details">
								<ScrollArea
									className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="h-full w-full grid p-1 gap-1.5">
										<Popover
											open={state.projectSelectionOpen}
											onOpenChange={(open) =>
												setState({ projectSelectionOpen: open })
											}
										>
											<Label
												htmlFor="project-button"
												className={cn(
													"pl-2 text-muted-foreground transition-colors",
													state.projectName !== data.projectName
														? "text-blue-500"
														: "",
												)}
											>
												{t("Dialogs.Edit.project.project")}
											</Label>
											<PopoverTrigger asChild>
												<Button
													id="project-button"
													variant="outline"
													role="combobox"
													aria-expanded={state.projectSelectionOpen}
													className="w-full justify-between border-2"
												>
													{state.projectName
														? projects.find(
																(project) => project.name === state.projectName,
															)?.name
														: t("Dialogs.Edit.project.noRelated")}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="p-2">
												<Command>
													<CommandInput
														placeholder={t("Dialogs.Edit.project.search")}
														className="h-8"
													/>
													{projects.length === 0 ? (
														<div className="items-center justify-center text-center text-sm text-muted-foreground pt-4">
															<p>{t("Dialogs.Edit.project.noProjects")}</p>
															<Link
																href="http://localhost:3000/settings?page=projects"
																className={buttonVariants({
																	variant: "link",
																	className: "flex-col items-start",
																})}
															>
																<p>
																	{t(
																		"Dialogs.Edit.project.noProjectsDescription",
																	)}
																</p>
															</Link>
														</div>
													) : (
														<CommandGroup>
															{projects.map((project) => (
																<CommandItem
																	key={`project-selection-${project.name}`}
																	value={`${project.name}`}
																	onSelect={() => {
																		setState({
																			projectName:
																				state.projectName !== project.name
																					? project.name
																					: null,
																			projectSelectionOpen: false,
																		});
																	}}
																>
																	<Check
																		className={cn(
																			"mr-2 h-4 w-4",
																			state.projectName === project.name
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
											htmlFor={`timerModal-notes-${data.id}`}
											className={cn(
												"pl-2 text-muted-foreground transition-colors",
												state.notes !== (data.notes ?? "")
													? "text-blue-500"
													: "",
											)}
										>
											{t("Dialogs.Edit.notes")}
										</Label>
										<Textarea
											id={`timerModal-notes-${data.id}`}
											className="h-full min-h-[30svh] max-h-[50svh] border-2"
											spellCheck={true}
											value={state.notes}
											onChange={(e) => setState({ notes: e.target.value })}
										/>
									</div>

									<div id="divider" className="h-4" />

									<div className="h-full w-full grid p-1 gap-1.5">
										<Label
											htmlFor="distance-button"
											className={cn(
												"pl-2 text-muted-foreground transition-colors",
												state.traveledDistance !== data.traveledDistance
													? "text-blue-500"
													: "",
											)}
										>
											{t("Dialogs.Edit.distance")}
										</Label>
										<Input
											id="distance-button"
											type="number"
											min={0}
											className="w-full border-2"
											onChange={(change) => {
												const target = change.target.valueAsNumber;
												setState({
													traveledDistance: Number.isNaN(target)
														? null
														: target,
												});
											}}
											value={state.traveledDistance ?? ""}
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
												htmlFor="start"
												className={cn(
													"pl-2 text-muted-foreground transition-colors",
													state.start !==
														data.start.toLocaleString("sv").replace(" ", "T")
														? "text-blue-500"
														: "",
												)}
											>
												{t("Dialogs.Edit.start")}
											</Label>
											<Input
												className="w-full font-mono border-2"
												type="datetime-local"
												name="Start"
												id="start"
												step={1}
												value={state.start}
												onChange={(e) => setState({ start: e.target.value })}
											/>
										</div>
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="end"
												className={cn(
													"pl-2 text-muted-foreground transition-colors",
													state.end !==
														(data.end
															? data.end.toLocaleString("sv").replace(" ", "T")
															: new Date()
																	.toLocaleString("sv")
																	.replace(" ", "T"))
														? "text-blue-500"
														: "",
												)}
											>
												{t("Dialogs.Edit.end")}
											</Label>
											<Input
												className="w-full font-mono border-2"
												type="datetime-local"
												name="End"
												id="end"
												step={1}
												value={state.end}
												onChange={(e) => setState({ end: e.target.value })}
											/>
										</div>

										<div id="divider" className="h-1" />

										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="start-w"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Edit.startedWith")}
											</Label>
											<Input
												disabled
												className="w-full font-mono appearance-none"
												type="text"
												name="started-with"
												id="start-w"
												value={`${data.startType}`}
											/>
										</div>
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="stopped-w"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Edit.stoppedWith")}
											</Label>
											<Input
												disabled
												className="w-full font-mono"
												type="text"
												name="stopped-with"
												id="stopped-w"
												value={data.endType ?? "not stopped"}
											/>
										</div>

										<div id="divider" className="h-1" />

										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="id"
												className="pl-2 text-muted-foreground"
											>
												ID
											</Label>
											<Input
												disabled
												className="w-full font-mono"
												type="text"
												name="Id"
												id="id"
												value={data.id}
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
								variant="destructive"
								onClick={() => sendDeleteRequest()}
								disabled={state.loading}
							>
								<Trash className="mr-2 h-4 w-4" />
								{t("Dialogs.Edit.delete")}
							</Button>
							{!data.end && (
								<Button
									variant="outline"
									onClick={() => sendRequest(false)}
									disabled={state.loading}
								>
									<SaveAll className="mr-2 h-4 w-4" />
									{t("Dialogs.Edit.save")}
								</Button>
							)}
							<Button
								variant="outline"
								onClick={() => sendRequest(true)}
								disabled={state.loading}
							>
								<SaveAll className="mr-2 h-4 w-4" />
								{t(
									!data.end ? "Dialogs.Edit.saveDetails" : "Dialogs.Edit.save",
								)}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
