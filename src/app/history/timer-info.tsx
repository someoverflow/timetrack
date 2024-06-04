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
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import type { Prisma } from "@prisma/client";

// Navigation
import { useRouter } from "next/navigation";

// React
import { useEffect, useReducer, useState } from "react";
import Link from "next/link";

import { cn, days } from "@/lib/utils";

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

	const [blockVisible, setBlockVisible] = useState(false);

	const [dragProgress, setDragProgress] = useState(0);

	const router = useRouter();

	// TODO: Make it editable
	if (!data.end) {
		return (
			<div className="w-full font-mono bg-backgroundSecondary rounded-md text-center mt-2 mb-2 pt-1 pb-1 animate__animated animate__fadeIn">
				<p className="text-sm text-muted-foreground">
					Running Timer since {data.start.toLocaleTimeString()}
				</p>
			</div>
		);
	}

	async function sendRequest() {
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
		const endChanged =
			state.end !== data.end?.toLocaleString("sv").replace(" ", "T");

		if (startChanged || endChanged) {
			request.startType = "Website";
			request.endType = "Website";

			if (state.start.trim() === "" || state.end.trim() === "") {
				toast.warning("Missing data", {
					description: "Start or End time not set",
				});
				setState({
					loading: false,
				});
				return;
			}

			request.start = new Date(state.start).toISOString();
			request.end = new Date(state.end).toISOString();
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

			toast.success("Successfully deleted entry", {
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
					className="w-full font-mono p-4 pb-5 select-none rounded-sm border border-border hover:border-ring cursor-pointer transition-all duration-300 animate__animated animate__slideInLeft"
					onClick={() => {
						if (!blockVisible) setVisible(true);
					}}
				>
					<div className="flex items-center justify-between pb-2">
						<p className="flex flex-row items-center font-semibold text-xs text-muted-foreground text-left">
							{`${data.start.getDate().toString().padStart(2, "0")}.${(
								data.start.getMonth() + 1
							)
								.toString()
								.padStart(2, "0")} ${days[data.start.getDay()]}`}
						</p>
						<Breadcrumb>
							<BreadcrumbList className="flex-nowrap">
								{data.project && (
									<>
										<BreadcrumbItem>
											<BreadcrumbLink asChild>
												<p className="text-xs truncate">{data.project.name}</p>
											</BreadcrumbLink>
										</BreadcrumbItem>
										<BreadcrumbSeparator />
									</>
								)}
								{data.notes && (
									<BreadcrumbItem>
										<BreadcrumbLink asChild>
											<p className="text-xs text-muted-foreground/75 truncate max-w-32 text-start">
												{data.notes?.split("\n")[0].startsWith("- ")
													? `${data.notes?.split("\n")[0].replace("- ", "")} …`
													: data.notes?.split("\n")[0]}
											</p>
										</BreadcrumbLink>
									</BreadcrumbItem>
								)}
							</BreadcrumbList>
						</Breadcrumb>
					</div>

					<div className="flex flex-row justify-evenly items-center text-lg">
						<p>{data.start.toLocaleTimeString()}</p>
						<div className="relative flex flex-col items-center">
							<Separator orientation="horizontal" className="w-10" />
							<p className="text-xs text-muted-foreground/80 absolute -bottom-5">
								{data.time ?? ""}
							</p>
						</div>
						<p>{data.end.toLocaleTimeString()}</p>
					</div>
				</button>
			</SwipeableListItem>

			<Dialog
				key={`timerModal-${data.id}`}
				open={visible}
				onOpenChange={(e) => setVisible(e)}
			>
				<DialogContent
					className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between"
					onPointerDownOutside={(e) => e.preventDefault()}
					onInteractOutside={(e) => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>
							<div>Edit entry</div>
						</DialogTitle>
					</DialogHeader>

					<div className="w-full flex flex-col gap-2">
						<Tabs defaultValue="details">
							<TabsList className="flex w-full">
								<TabsTrigger className="w-full" value="details">
									Details
								</TabsTrigger>
								<TabsTrigger className="w-full" value="time">
									Time
								</TabsTrigger>
								<TabsTrigger className="w-full" value="breaks">
									Breaks
								</TabsTrigger>
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
												className="pl-2 text-muted-foreground"
											>
												Project
											</Label>
											<PopoverTrigger asChild>
												<Button
													id="project-button"
													variant="outline"
													role="combobox"
													aria-expanded={state.projectSelectionOpen}
													className={`w-full justify-between border-2 transition duration-300 ${
														state.projectName !== data.projectName &&
														"border-sky-700"
													}`}
												>
													{state.projectName
														? projects.find(
																(project) => project.name === state.projectName,
															)?.name
														: "No related project"}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent className="p-2">
												<Command>
													<CommandInput
														placeholder="Search project..."
														className="h-8"
													/>
													{projects.length === 0 ? (
														<div className="items-center justify-center text-center text-sm text-muted-foreground pt-4">
															<p>No projects found.</p>
															<Link
																href="http://localhost:3000/settings?page=projects"
																className={buttonVariants({
																	variant: "link",
																	className: "flex-col items-start",
																})}
															>
																<p>Click to create one now</p>
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
											htmlFor="distance-button"
											className="pl-2 text-muted-foreground"
										>
											Distance traveled (km)
										</Label>
										<Input
											id="distance-button"
											type="number"
											min={0}
											className={`w-full border-2 transition duration-300 ${
												state.traveledDistance !== data.traveledDistance &&
												"border-sky-700"
											}`}
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

									<div id="divider" className="h-4" />

									<div className="h-full w-full grid p-1 gap-1.5">
										<Label
											htmlFor={`timerModal-notes-${data.id}`}
											className="text-muted-foreground pl-2"
										>
											Notes
										</Label>
										<Textarea
											id={`timerModal-notes-${data.id}`}
											className={`h-full min-h-[30svh] max-h-[50svh] border-2 transition duration-300 ${
												state.notes !== (data.notes ?? "") && "border-sky-700"
											}`}
											spellCheck={true}
											value={state.notes}
											onChange={(e) => setState({ notes: e.target.value })}
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
												Start
											</Label>
											<Input
												className={`!w-full font-mono border-2 transition-all duration-300 ${
													state.start !==
														data.start.toLocaleString("sv").replace(" ", "T") &&
													"border-sky-700"
												}`}
												type="datetime-local"
												name="Updated"
												id="updated"
												step={1}
												value={state.start}
												onChange={(e) => setState({ start: e.target.value })}
											/>
										</div>
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="username"
												className="pl-2 text-muted-foreground"
											>
												End
											</Label>
											<Input
												className={`w-full font-mono border-2 transition-all duration-300 ${
													state.end !==
														(data.end
															? data.end.toLocaleString("sv").replace(" ", "T")
															: new Date()
																	.toLocaleString("sv")
																	.replace(" ", "T")) && "border-sky-700"
												}`}
												type="datetime-local"
												name="Created"
												id="created"
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
												Started with
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
												Stopped with
											</Label>
											<Input
												disabled
												className="w-full font-mono"
												type="text"
												name="stopped-with"
												id="stopped-w"
												value={`${data.endType}`}
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
								Delete
							</Button>
							<Button
								variant="outline"
								onClick={() => sendRequest()}
								disabled={state.loading}
							>
								<SaveAll className="mr-2 h-4 w-4" />
								Save Changes
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
