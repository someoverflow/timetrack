"use client";

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
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Check,
	ChevronDown,
	ChevronUp,
	ChevronsUp,
	ChevronsUpDown,
	ListPlus,
	UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { TodoPriority } from "@prisma/client";
import { useTranslations } from "next-intl";

interface todoAddState {
	loading: boolean;

	priority: TodoPriority;

	task: string;
	description: string;

	deadline: string;
	deadlineEnabled: boolean;

	assignees: string[];
	assigneesSelectionOpen: boolean;

	projects: string[];
	projectsSelectionOpen: boolean;
}
export function TodoAdd({
	users,
	projects,
}: {
	users: { name: string | null; username: string }[];
	projects: {
		name: string;
		description: string | null;
	}[];
}) {
	const [data, setData] = useReducer(
		(prev: todoAddState, next: Partial<todoAddState>) => ({
			...prev,
			...next,
		}),
		{
			loading: false,
			task: "",
			description: "",
			assignees: [],
			assigneesSelectionOpen: false,
			projects: [],
			projectsSelectionOpen: false,
			deadline: new Date().toISOString().split("T")[0],
			deadlineEnabled: false,
			priority: "MEDIUM",
		},
	);

	const [visible, setVisible] = useState(false);

	const t = useTranslations("Todo");

	const router = useRouter();

	async function sendRequest() {
		setData({
			loading: true,
		});

		const result = await fetch("/api/todo", {
			method: "POST",
			body: JSON.stringify({
				task: data.task,
				description:
					data.description.trim() === "" ? undefined : data.description.trim(),
				priority: data.priority,
				deadline: data.deadlineEnabled ? data.deadline : undefined,
				assignees: data.assignees.length !== 0 ? data.assignees : undefined,
				projects: data.projects.length !== 0 ? data.projects : undefined,
			}),
		});

		setData({
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

			setData({
				task: "",
				description: "",
			});

			toast.success("Successfully created todo", {
				duration: 3000,
			});
			router.refresh();
			return;
		}

		switch (resultData.type) {
			case "duplicate-found":
				toast.warning(`An error occurred (${resultData.type})`, {
					description: resultData.result.message,
					important: true,
					duration: 5000,
				});
				break;
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
			<Tooltip delayDuration={500}>
				<TooltipTrigger asChild>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setVisible(true)}
					>
						<ListPlus className="h-5 w-5" />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					<p className="text-center">{t("Dialogs.Add.buttonToolTip")}</p>
				</TooltipContent>
			</Tooltip>

			<Dialog
				key={"userAddModal"}
				open={visible}
				onOpenChange={(e) => setVisible(e)}
			>
				<DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
					<DialogHeader>
						<DialogTitle>
							<div>{t("Dialogs.Add.title")}</div>
						</DialogTitle>
					</DialogHeader>

					<div className="w-full flex flex-col gap-2">
						<ScrollArea
							className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
							type="always"
						>
							<div className="grid gap-4 p-1 w-full">
								<RadioGroup
									className="flex flex-row items-center justify-between pt-1"
									value={data.priority}
									onValueChange={(state) =>
										setData({ priority: state as TodoPriority })
									}
								>
									<div className="flex flex-col items-center gap-2">
										<RadioGroupItem value="HIGH" id="r1" />
										<Label htmlFor="r1">
											<ChevronsUp className="h-5 w-5 text-red-500 inline-block" />{" "}
											{t("Miscellaneous.priorities.high")}
										</Label>
									</div>
									<div className="flex flex-col items-center gap-2">
										<RadioGroupItem value="MEDIUM" id="r2" />
										<Label htmlFor="r2">
											<ChevronUp className="h-5 w-5 text-emerald-500 inline-block" />{" "}
											{t("Miscellaneous.priorities.medium")}
										</Label>
									</div>
									<div className="flex flex-col items-center gap-2">
										<RadioGroupItem value="LOW" id="r3" />
										<Label htmlFor="r3">
											<ChevronDown className="h-5 w-5 text-blue-500 inline-block" />{" "}
											{t("Miscellaneous.priorities.low")}
										</Label>
									</div>
								</RadioGroup>

								<div id="divider" className="h-1" />

								<div className="grid w-full items-center gap-1.5">
									<Label htmlFor="task" className="pl-2 text-muted-foreground">
										{t("Miscellaneous.task")}
									</Label>
									<Input
										className="!w-full border-2"
										type="text"
										spellCheck
										name="Task"
										id="task"
										maxLength={100}
										value={data.task}
										onChange={(e) => setData({ task: e.target.value })}
									/>
								</div>

								<div id="divider" className="h-1" />

								<div className="grid w-full items-center gap-1.5">
									<Label
										htmlFor="description"
										className="pl-2 text-muted-foreground"
									>
										{t("Miscellaneous.description")}
									</Label>
									<Textarea
										className="!w-full border-2"
										name="Name"
										id="description"
										maxLength={800}
										value={data.description}
										onChange={(e) => setData({ description: e.target.value })}
									/>
								</div>

								<div id="divider" className="h-1" />

								<div className="h-full w-full grid p-1 gap-1.5">
									<Popover
										open={data.projectsSelectionOpen}
										onOpenChange={(open) =>
											setData({ projectsSelectionOpen: open })
										}
									>
										<Label
											htmlFor="projects-button"
											className="pl-2 text-muted-foreground"
										>
											{t("Dialogs.Add.projects")}
										</Label>
										<PopoverTrigger asChild>
											<Button
												id="projects-button"
												variant="outline"
												role="combobox"
												aria-expanded={data.projectsSelectionOpen}
												className="w-full justify-between border-2 transition duration-300"
											>
												<div className="flex flex-row gap-1">
													{data.projects.length === 0
														? t("Dialogs.Add.noRelatedProjects")
														: data.projects.map((value, index) =>
																index >= 3 ? undefined : (
																	<Badge
																		key={`projects-select-show-${value}`}
																		variant="outline"
																	>
																		{value}
																	</Badge>
																),
															)}
													{data.projects.length > 3 && (
														<Badge variant="secondary">
															+{data.projects.length - 3}
														</Badge>
													)}
												</div>
												<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="p-2">
											<Command>
												<CommandInput
													placeholder={t("Dialogs.Add.searchProject")}
													className="h-8"
												/>
												{projects.length === 0 ? (
													<div className="items-center justify-center text-center text-sm text-muted-foreground pt-4">
														<p>{t("Dialogs.Add.noProjectsFound")}</p>
														<Link
															href="/projects"
															prefetch={false}
															className={buttonVariants({
																variant: "link",
																className: "flex-col items-start",
															})}
														>
															<p>{t("Dialogs.Add.projectsManage")}</p>
														</Link>
													</div>
												) : (
													<CommandGroup>
														{projects.map((project) => (
															<CommandItem
																key={`project-selection-add-${project.name}`}
																value={project.name}
																onSelect={() => {
																	const value = project.name;
																	const currentProjects = data.projects;
																	if (currentProjects.includes(value))
																		currentProjects.splice(
																			currentProjects.indexOf(value),
																			1,
																		);
																	else currentProjects.push(value);

																	setData({
																		projects: currentProjects,
																	});
																}}
															>
																<Check
																	className={cn(
																		"mr-2 h-4 w-4",
																		data.projects.includes(project.name)
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
								<div className="h-full w-full grid p-1 gap-1.5">
									<Popover
										open={data.assigneesSelectionOpen}
										onOpenChange={(open) =>
											setData({ assigneesSelectionOpen: open })
										}
									>
										<Label
											htmlFor="assignees-button"
											className="pl-2 text-muted-foreground"
										>
											{t("Miscellaneous.assignees")}
										</Label>
										<PopoverTrigger asChild>
											<Button
												id="assignees-button"
												variant="outline"
												role="combobox"
												aria-expanded={data.assigneesSelectionOpen}
												className="w-full justify-between border-2 transition duration-300"
											>
												<div className="flex flex-row gap-1">
													{data.assignees.length === 0
														? t("Dialogs.Add.noAssignees")
														: data.assignees.map((value, index) =>
																index >= 3 ? undefined : (
																	<Badge
																		key={`assignees-select-show-${value}`}
																		variant="outline"
																	>
																		{
																			users.find(
																				(user) => user.username === value,
																			)?.name
																		}
																	</Badge>
																),
															)}
													{data.assignees.length > 3 && (
														<Badge variant="secondary">
															+{data.assignees.length - 3}
														</Badge>
													)}
												</div>
												<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="p-2 max-h-60">
											<Command>
												<CommandInput
													placeholder={t("Dialogs.Add.searchUser")}
													className="h-8"
												/>
												<CommandGroup>
													{users.map((user) => (
														<CommandItem
															key={`user-selection-add-${user.username}`}
															className="text-nowrap"
															value={user.username}
															onSelect={() => {
																const value = user.username;
																const currentAssignees = data.assignees;
																if (currentAssignees.includes(value))
																	currentAssignees.splice(
																		currentAssignees.indexOf(value),
																		1,
																	);
																else currentAssignees.push(value);

																setData({
																	assignees: currentAssignees,
																});
															}}
														>
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	data.assignees.includes(user.username)
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
															<div className="w-full flex flex-row items-center">
																<p>{user.name}</p>
																<Badge variant="default" className="scale-75">
																	@{user.username}
																</Badge>
															</div>
														</CommandItem>
													))}
												</CommandGroup>
											</Command>
										</PopoverContent>
									</Popover>
								</div>

								<div id="divider" className="h-1" />

								<div className="grid w-full items-center gap-1.5">
									<div className="flex flex-row items-center justify-between">
										<Label
											htmlFor="todo-add-deadline"
											className="pl-2 text-muted-foreground"
										>
											{t("Miscellaneous.deadline")}
										</Label>
										<Switch
											checked={data.deadlineEnabled}
											onCheckedChange={(checked) =>
												setData({ deadlineEnabled: checked })
											}
										/>
									</div>
									<Input
										className={`!w-full border-2 transition-opacity duration-150 opacity-0 ${
											data.deadlineEnabled ? "opacity-100" : ""
										}`}
										disabled={!data.deadlineEnabled}
										name="Name"
										id="todo-add-deadline"
										type="date"
										value={data.deadline}
										onChange={(e) =>
											setData({
												deadline: e.target.value,
												deadlineEnabled: true,
											})
										}
									/>
								</div>
							</div>
						</ScrollArea>

						<div className="w-full gap-2 flex flex-row justify-end">
							<Button
								variant="outline"
								onClick={() => sendRequest()}
								disabled={data.loading}
							>
								<ListPlus className="mr-2 h-4 w-4" />
								{t("Dialogs.Add.create")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
