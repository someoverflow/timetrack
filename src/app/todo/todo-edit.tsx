import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Prisma, Todo, TodoPriority, TodoStatus } from "@prisma/client";
import { Step, Stepper, type StepItem } from "@/components/ui/stepper";
import {
	Check,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	ChevronsUp,
	ChevronsUpDown,
	CircleCheckBig,
	CircleDot,
	CircleDotDashed,
	SaveAll,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import Link from "next/link";
import type { todoUpdateApiValidationType } from "@/lib/zod";
import { useTranslations } from "next-intl";

const steps = [
	{ id: "todo", label: "Todo", icon: CircleDot },
	{ id: "in_progress", label: "In Progress", icon: CircleDotDashed },
	{ id: "done", label: "Done", icon: CircleCheckBig },
] satisfies StepItem[];

type UsersType = { name: string | null; username: string }[];
type ProjectsType = {
	name: string;
	description: string | null;
}[];
type TodoType = Prisma.TodoGetPayload<{
	include: {
		assignees: {
			select: {
				id: true;
				username: true;
				name: true;
			};
		};
		creator: {
			select: {
				id: true;
				username: true;
				name: true;
			};
		};
		relatedProjects: {
			select: {
				name: true;
			};
		};
	};
}>;

interface todoInfoState {
	loading: boolean;

	task: string;
	description: string;

	deadline: string;
	deadlineEnabled: boolean;

	assignees: string[];
	assigneesSelectionOpen: boolean;

	projects: string[];
	projectsSelectionOpen: boolean;

	status: TodoStatus;
	statusState: undefined | "error" | "loading";
	priority: TodoPriority;
}

export function TodoTableEdit({
	todo,
	projects,
	users,
}: {
	todo: TodoType;
	projects: ProjectsType;
	users: UsersType;
}) {
	const getDefaultReducerState = (): todoInfoState => {
		return {
			loading: false,

			task: todo.task,
			description: todo.description ?? "",

			deadline: (todo.deadline ?? new Date()).toISOString().split("T")[0],
			deadlineEnabled: todo.deadline !== null,

			projectsSelectionOpen: false,
			assigneesSelectionOpen: false,

			projects: todo.relatedProjects.map((project) => project.name),
			assignees: todo.assignees.map((assignee) => assignee.username),

			status: todo.status,
			statusState: undefined,
			priority: todo.priority,
		};
	};

	const [state, setState] = useReducer(
		(prev: todoInfoState, next: Partial<todoInfoState>) => ({
			...prev,
			...next,
		}),
		getDefaultReducerState(),
	);
	const [visible, setVisible] = useState(false);

	const t = useTranslations("Todo");

	const searchParams = useSearchParams();
	const linkedTodo = searchParams.get("link");

	const router = useRouter();
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setVisible(linkedTodo === todo.id);
		setState(getDefaultReducerState());
	}, [linkedTodo, todo]);

	const updateLink = () => {
		const current = new URLSearchParams(window.location.search);
		current.set("link", todo.id);
		const search = current.toString();
		const query = search ? `?${search}` : "";
		router.replace(`/todo${query}`);
	};

	async function sendRequest() {
		setState({
			loading: true,
		});

		const assigneesToAdd = [];
		const assigneesToRemove = [];

		for (const assignee of todo.assignees)
			if (!state.assignees.includes(assignee.username))
				assigneesToRemove.push(assignee.username);
		for (const username of state.assignees)
			if (todo.assignees.find((a) => a.username === username) === undefined)
				assigneesToAdd.push(username);

		const projectsToAdd = [];
		const projectsToRemove = [];

		for (const project of todo.relatedProjects)
			if (!state.projects.includes(project.name))
				projectsToRemove.push(project.name);
		for (const name of state.projects)
			if (todo.relatedProjects.find((p) => p.name === name) === undefined)
				projectsToAdd.push(name);

		const request: todoUpdateApiValidationType = {
			id: todo.id,

			task: todo.task !== state.task ? state.task : undefined,
			description:
				todo.description ?? "" !== state.description
					? state.description
					: undefined,

			deadline:
				(todo.deadline ? todo.deadline.toISOString().split("T")[0] : null) !==
				(state.deadlineEnabled ? state.deadline : null)
					? state.deadlineEnabled
						? state.deadline
						: null
					: undefined,

			assignees: {
				add:
					assigneesToAdd.length !== 0
						? (assigneesToAdd as [string, ...string[]])
						: undefined,
				remove:
					assigneesToRemove.length !== 0
						? (assigneesToRemove as [string, ...string[]])
						: undefined,
			},

			projects: {
				add:
					projectsToAdd.length !== 0
						? (projectsToAdd as [string, ...string[]])
						: undefined,
				remove:
					projectsToRemove.length !== 0
						? (projectsToRemove as [string, ...string[]])
						: undefined,
			},

			priority: todo.priority !== state.priority ? state.priority : undefined,
		};

		const result = await fetch("/api/todo", {
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
			toast.success("Successfully updated entry", {
				duration: 3000,
			});
			router.refresh();
			return;
		}

		switch (resultData.type) {
			case "error-message":
				toast.warning("An error occurred", {
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

	async function stepChange(step: number, setStep: (step: number) => void) {
		const request: Partial<Todo> = {
			id: todo.id,
		};

		if (step === 0) request.status = "TODO";
		if (step === 1) request.status = "IN_PROGRESS";
		if (step === 2) request.status = "DONE";

		if (todo.status === request.status || state.loading) return;

		setState({
			loading: true,
			statusState: "loading",
		});

		const result = await fetch("/api/todo", {
			method: "PUT",
			body: JSON.stringify(request),
		});

		setState({
			loading: false,
			statusState: undefined,
		});

		const resultData: APIResult = await result.json().catch(() => {
			setState({ statusState: "error" });
			toast.error("An error occurred", {
				description: "Result could not be proccessed",
				important: true,
				duration: 8000,
			});
			return;
		});

		if (resultData.success) {
			updateLink();
			setStep(step);

			toast.success("Successfully changed", {
				duration: 3000,
			});
			router.refresh();
			return;
		}

		setState({ statusState: "error" });
		switch (resultData.type) {
			case "error-message":
				toast.warning("An error occurred", {
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
			<HoverCardTrigger onClick={() => setVisible(true)}>
				<p className="flex flex-col justify-center text-xs text-muted-foreground/80 space-x-2 w-full bg-background/25 rounded-sm p-2">
					{todo.relatedProjects.map(
						(project, index) =>
							project.name +
							(index !== todo.relatedProjects.length - 1 ? " • " : ""),
					)}
					<span className="text-primary text-base">
						<ChevronRight className="inline-block size-3 text-muted-foreground" />
						{todo.task}
					</span>
				</p>
			</HoverCardTrigger>

			<Dialog
				key={`todoModal-${todo.id}`}
				open={visible}
				onOpenChange={(e) => setVisible(e)}
			>
				<DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
					<div className="flex flex-row gap-1 absolute top-2 left-2">
						{todo.archived && (
							<Badge variant="destructive">{t("Miscellaneous.archived")}</Badge>
						)}
						{todo.hidden && (
							<Badge variant="secondary">{t("Miscellaneous.hidden")}</Badge>
						)}
					</div>

					<div className="w-full flex flex-col gap-2">
						<div className="flex w-full flex-col gap-4 pb-4 pt-6">
							<Stepper
								initialStep={
									todo.archived
										? 3
										: todo.status === "TODO"
											? 0
											: todo.status === "IN_PROGRESS"
												? 1
												: 2
								}
								steps={steps}
								onClickStep={
									todo.archived
										? undefined
										: (step, setStep) => stepChange(step, setStep)
								}
								state={state.statusState}
								variant="circle-alt"
								orientation="horizontal"
								responsive={false}
								styles={{
									"step-button-container": cn(
										"transition-all duration-300",
										"data-[active=true]:bg-muted data-[active=true]:border-primary dark:data-[active=true]:text-primary-foreground",
										"data-[current=true]:bg-muted data-[current=true]:border-primary data-[current=true]:text-primary-foreground",
										todo.status === "TODO"
											? "data-[current=true]:border-blue-500"
											: "",
										todo.status === "IN_PROGRESS"
											? "data-[current=true]:border-amber-500"
											: "",
										todo.status === "DONE"
											? "data-[current=true]:border-green-500"
											: "",
									),
									"horizontal-step":
										"data-[completed=true]:[&:not(:last-child)]:after:bg-primary",
								}}
							>
								<Step
									key={steps[0].id}
									id={steps[0].id}
									label={t("Miscellaneous.steps.todo")}
									icon={steps[0].icon}
									checkIcon={steps[0].icon}
									className="!text-blue-500"
								/>
								<Step
									key={steps[1].id}
									id={steps[1].id}
									label={t("Miscellaneous.steps.inProgress")}
									icon={steps[1].icon}
									checkIcon={steps[1].icon}
									className="!text-amber-500"
								/>
								<Step
									key={steps[2].id}
									id={steps[2].id}
									label={t("Miscellaneous.steps.done")}
									icon={steps[2].icon}
									checkIcon={steps[2].icon}
									className="!text-green-500"
								/>
							</Stepper>
						</div>

						<Tabs defaultValue="status">
							<TabsList className="flex w-full">
								<TabsTrigger className="w-full" value="status">
									{t("Dialogs.Edit.status")}
								</TabsTrigger>
								<TabsTrigger className="w-full" value="details">
									{t("Dialogs.Edit.details")}
								</TabsTrigger>
							</TabsList>
							<TabsContent value="status" className="h-full">
								<ScrollArea
									className="h-[50svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="grid gap-4 p-1 w-full">
										<RadioGroup
											className={cn(
												"flex flex-row items-center justify-between pt-1 px-2 transition-all border-l-2",
												todo.priority !== state.priority
													? "border-blue-500"
													: "",
											)}
											value={state.priority}
											onValueChange={(state) =>
												setState({
													priority: state as TodoPriority,
												})
											}
										>
											<div className="flex flex-col items-center text-center gap-2">
												<RadioGroupItem value="HIGH" id="r1" />
												<Label htmlFor="r1">
													<ChevronsUp className="h-5 w-5 text-red-500 inline-block" />{" "}
													{t("Miscellaneous.priorities.high")}
												</Label>
											</div>
											<div className="flex flex-col items-center text-center gap-2">
												<RadioGroupItem value="MEDIUM" id="r2" />
												<Label htmlFor="r2">
													<ChevronUp className="h-5 w-5 text-emerald-500 inline-block" />{" "}
													{t("Miscellaneous.priorities.medium")}
												</Label>
											</div>
											<div className="flex flex-col items-center text-center gap-2">
												<RadioGroupItem value="LOW" id="r3" />
												<Label htmlFor="r3">
													<ChevronDown className="h-5 w-5 text-blue-500 inline-block" />{" "}
													{t("Miscellaneous.priorities.low")}
												</Label>
											</div>
										</RadioGroup>
										<div id="divider" className="h-1" />

										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="task"
												className={cn(
													"pl-2 text-muted-foreground transition-colors",
													todo.task !== state.task ? "text-blue-500" : "",
												)}
											>
												{t("Miscellaneous.task")}
											</Label>
											<Input
												className="!w-full border-2"
												type="text"
												spellCheck
												name="Task"
												id="task"
												maxLength={100}
												value={state.task}
												onChange={(e) => setState({ task: e.target.value })}
											/>
										</div>

										<div id="divider" className="h-1" />

										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="description"
												className={cn(
													"pl-2 text-muted-foreground transition-colors",
													(todo.description ?? "") !== state.description
														? "text-blue-500"
														: "",
												)}
											>
												{t("Miscellaneous.description")}
											</Label>
											<Textarea
												className="!w-full border-2 min-h-32"
												name="Description"
												id="description"
												maxLength={800}
												value={state.description}
												onChange={(e) =>
													setState({ description: e.target.value })
												}
											/>
										</div>

										<div id="divider" className="h-1" />

										<div className="grid w-full items-center gap-1.5">
											<div className="flex flex-row items-center justify-between">
												<Label
													htmlFor="deadline"
													className={cn(
														"pl-2 text-muted-foreground",
														(todo.deadline
															? todo.deadline.toISOString().split("T")[0]
															: null) !==
															(state.deadlineEnabled ? state.deadline : null)
															? "text-blue-500"
															: "",
													)}
												>
													{t("Miscellaneous.deadline")}
												</Label>
												<Switch
													id="deadline"
													checked={state.deadlineEnabled}
													onCheckedChange={(checked) =>
														setState({ deadlineEnabled: checked })
													}
												/>
											</div>
											<Input
												className={`!w-full border-2 transition-opacity duration-150 ${
													state.deadlineEnabled ? "opacity-100" : ""
												}`}
												disabled={!state.deadlineEnabled}
												name="Deadline"
												id="deadline-input"
												type="date"
												value={state.deadline}
												onChange={(e) =>
													setState({
														deadline: e.target.value,
														deadlineEnabled: true,
													})
												}
											/>
										</div>

										<div id="divider" className="h-1" />

										<div className="h-full w-full grid p-1 gap-1.5">
											<Popover
												open={state.assigneesSelectionOpen}
												onOpenChange={(open) =>
													setState({ assigneesSelectionOpen: open })
												}
											>
												<Label
													htmlFor="assignees-button"
													className={cn(
														"pl-2 text-muted-foreground transition-colors",
														state.assignees.sort().toString() !==
															todo.assignees
																.map((assignee) => assignee.username)
																.sort()
																.toString()
															? "text-blue-500"
															: "",
													)}
												>
													{t("Miscellaneous.assignees")}
												</Label>
												<PopoverTrigger asChild>
													<Button
														id="assignees-button"
														variant="outline"
														role="combobox"
														aria-expanded={state.assigneesSelectionOpen}
														className="w-full justify-between border-2 transition duration-300"
													>
														<div className="flex flex-row gap-1">
															{state.assignees.length === 0
																? t("Dialogs.Edit.noAssignees")
																: state.assignees.map((value, index) =>
																		index >= 3 ? undefined : (
																			<Badge
																				key={`assignees-${value}`}
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
															{state.assignees.length > 3 && (
																<Badge variant="secondary">
																	+{state.assignees.length - 3}
																</Badge>
															)}
														</div>
														<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
													</Button>
												</PopoverTrigger>
												<PopoverContent className="p-2 max-h-60">
													<Command>
														<CommandInput
															placeholder={t("Dialogs.Edit.searchUser")}
															className="h-8"
														/>
														<CommandGroup>
															{users.map((user) => (
																<CommandItem
																	key={`user-${user.username}`}
																	className="text-nowrap"
																	value={user.username}
																	onSelect={() => {
																		const value = user.username;
																		const stateAssignees = state.assignees;

																		if (stateAssignees.includes(value))
																			stateAssignees.splice(
																				stateAssignees.indexOf(value),
																				1,
																			);
																		else stateAssignees.push(value);

																		setState({
																			assignees: stateAssignees,
																		});
																	}}
																>
																	<Check
																		className={cn(
																			"mr-2 h-4 w-4",
																			state.assignees.includes(user.username)
																				? "opacity-100"
																				: "opacity-0",
																		)}
																	/>
																	<div className="w-full flex flex-row items-center">
																		<p>{user.name}</p>
																		<Badge
																			variant="default"
																			className="scale-75"
																		>
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
										<div className="h-full w-full grid p-1 gap-1.5">
											<Popover
												open={state.projectsSelectionOpen}
												onOpenChange={(open) =>
													setState({ projectsSelectionOpen: open })
												}
											>
												<Label
													htmlFor="projects-button"
													className={cn(
														"pl-2 text-muted-foreground transition-colors",
														state.projects.sort().toString() !==
															todo.relatedProjects
																.map((project) => project.name)
																.sort()
																.toString()
															? "text-blue-500"
															: "",
													)}
												>
													{t("Dialogs.Edit.projects")}
												</Label>
												<PopoverTrigger asChild>
													<Button
														id="projects-button"
														variant="outline"
														role="combobox"
														aria-expanded={state.projectsSelectionOpen}
														className="w-full justify-between border-2 transition duration-300"
													>
														<div className="flex flex-row gap-1">
															{state.projects.length === 0
																? t("Dialogs.Edit.noRelatedProjects")
																: state.projects.map((value, index) =>
																		index >= 3 ? undefined : (
																			<Badge
																				key={`project-${value}`}
																				variant="outline"
																			>
																				{value}
																			</Badge>
																		),
																	)}
															{state.projects.length > 3 && (
																<Badge variant="secondary">
																	+{state.projects.length - 3}
																</Badge>
															)}
														</div>
														<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
													</Button>
												</PopoverTrigger>
												<PopoverContent className="p-2 max-h-60">
													<Command>
														<CommandInput
															placeholder={t("Dialogs.Edit.searchProject")}
															className="h-8"
														/>
														{projects.length === 0 ? (
															<div className="items-center justify-center text-center text-sm text-muted-foreground pt-4">
																<p>{t("Dialogs.Edit.noProjectsFound")}</p>
																<Link
																	href="/settings?page=projects"
																	prefetch={false}
																	className={buttonVariants({
																		variant: "link",
																		className: "flex-col items-start",
																	})}
																>
																	<p>{t("Dialogs.Edit.projectsManage")}</p>
																</Link>
															</div>
														) : (
															<CommandGroup>
																{projects.map((project) => (
																	<CommandItem
																		key={`project-${project.name}`}
																		value={project.name}
																		onSelect={() => {
																			const value = project.name;
																			const stateProjects = state.projects;

																			if (stateProjects.includes(value))
																				stateProjects.splice(
																					stateProjects.indexOf(value),
																					1,
																				);
																			else stateProjects.push(value);

																			setState({
																				projects: stateProjects,
																			});
																		}}
																	>
																		<Check
																			className={cn(
																				"mr-2 h-4 w-4",
																				state.projects.includes(project.name)
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
									</div>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="details" className="h-full">
								<ScrollArea
									className="h-[50svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="grid gap-4 p-1 w-full">
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="creator"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Edit.creator")}
											</Label>
											<Input
												disabled
												className="w-full font-mono"
												type="text"
												name="creator"
												id="creator"
												value={todo.creator.name ?? todo.creator.username}
											/>
										</div>

										<div id="divider" className="h-1" />

										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="updatedAt"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Edit.updated")}
											</Label>
											<Input
												disabled
												className="w-full font-mono"
												type="datetime-local"
												name="Updated At"
												id="updatedAt"
												value={todo.updatedAt
													.toLocaleString("sv")
													.replace(" ", "T")}
											/>
										</div>
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="createdAt"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Edit.created")}
											</Label>
											<Input
												disabled
												className="w-full font-mono"
												type="datetime-local"
												name="Created At"
												id="createdAt"
												value={todo.createdAt
													.toLocaleString("sv")
													.replace(" ", "T")}
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
												value={todo.id}
											/>
										</div>
									</div>
								</ScrollArea>
							</TabsContent>
						</Tabs>

						<div className="w-full gap-2 flex flex-row justify-end">
							<Button
								variant="outline"
								onClick={() => sendRequest()}
								disabled={state.loading}
							>
								<SaveAll className="mr-2 h-4 w-4" />
								{t("Dialogs.Edit.save")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
