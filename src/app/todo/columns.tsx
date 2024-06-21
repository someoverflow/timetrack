"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ArrowDownAZ,
	ArrowDownZA,
	ChevronDown,
	ChevronUp,
	ChevronsUp,
	CircleCheckBig,
	CircleDot,
	CircleDotDashed,
	ListFilter,
	MoreHorizontal,
	MousePointerClick,
	Settings2,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent } from "@/components/ui/hover-card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import type { Prisma, Todo } from "@prisma/client";
import { TodoTableEdit } from "./todo-edit";
import { useTranslations } from "next-intl";

export const columns: ColumnDef<
	Prisma.TodoGetPayload<{
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
	}>
>[] = [
	{
		id: "task",
		accessorKey: "task",
		enableHiding: false,
		sortingFn: "alphanumericCaseSensitive",
		header: ({ column }) => {
			const t = useTranslations("Todo.Miscellaneous");
			return (
				<div className="flex items-center space-x-2">
					<Button
						onClick={
							() => {}
							// TODO: Sorting
							// column.toggleSorting(column.getIsSorted() === "asc", true)
						}
						variant="ghost"
						size="sm"
						className="-ml-3 h-8 data-[state=open]:bg-accent w-full"
					>
						<span>{t("task")}</span>
						{column.getIsSorted() === "desc" ? (
							<ArrowDownZA className="ml-2 h-4 w-4" />
						) : column.getIsSorted() === "asc" ? (
							<ArrowDownAZ className="ml-2 h-4 w-4" />
						) : (
							<ListFilter className="ml-2 h-4 w-4" />
						)}
					</Button>
				</div>
			);
		},
		cell: ({ row, table }) => {
			const t = useTranslations("Todo.Miscellaneous");
			const router = useRouter();
			const todo = row.original;

			async function stepChange() {
				const request: Partial<Todo> = {
					id: todo.id,
				};

				switch (todo.status) {
					case "TODO":
						request.status = "IN_PROGRESS";
						break;
					case "IN_PROGRESS":
						request.status = "DONE";
						break;
					case "DONE":
						request.status = "TODO";
						break;
				}

				const result = await fetch("/api/todo", {
					method: "PUT",
					body: JSON.stringify(request),
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
					toast.success("Successfully changed", {
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

			return (
				<div className="flex flex-row items-center gap-2">
					<div className="flex flex-col justify-between gap-1 h-10">
						<Tooltip>
							<TooltipTrigger onClick={stepChange}>
								{todo.status === "TODO" && (
									<CircleDot className="h-4 w-4 text-blue-500" />
								)}
								{todo.status === "IN_PROGRESS" && (
									<CircleDotDashed className="h-4 w-4 text-amber-500" />
								)}
								{todo.status === "DONE" && (
									<CircleCheckBig className="h-4 w-4 text-emerald-500" />
								)}
							</TooltipTrigger>
							<TooltipContent side="right">
								{todo.status === "TODO" && (
									<div className="text-muted-foreground">
										{t("steps.todo")}
										<br />
										<span className="text-primary flex flex-row items-center gap-1">
											<MousePointerClick className="h-4 w-4 inline-flex" />{" "}
											{t("stepsNext.todo")}
										</span>
									</div>
								)}
								{todo.status === "IN_PROGRESS" && (
									<div className="text-muted-foreground">
										{t("steps.inProgress")}
										<br />
										<span className="text-primary flex flex-row items-center gap-1">
											<MousePointerClick className="h-4 w-4 inline-flex" />{" "}
											{t("stepsNext.todo")}
										</span>
									</div>
								)}
								{todo.status === "DONE" && (
									<div className="text-muted-foreground">
										{t("steps.done")}
										<br />
										<span className="text-primary flex flex-row items-center gap-1">
											<MousePointerClick className="h-4 w-4 inline-flex" />{" "}
											{t("stepsNext.todo")}
										</span>
									</div>
								)}
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger onClick={() => {}}>
								{todo.priority === "HIGH" && (
									<ChevronsUp className="h-4 w-4 text-red-500" />
								)}
								{todo.priority === "MEDIUM" && (
									<ChevronUp className="h-4 w-4 text-emerald-500" />
								)}
								{todo.priority === "LOW" && (
									<ChevronDown className="h-4 w-4 text-blue-500" />
								)}
							</TooltipTrigger>
							<TooltipContent side="right">
								{todo.priority === "HIGH" && t("priorities.high")}
								{todo.priority === "MEDIUM" && t("priorities.medium")}
								{todo.priority === "LOW" && t("priorities.low")}
							</TooltipContent>
						</Tooltip>
					</div>

					<Separator orientation="vertical" className="ml-2 h-10" />

					<HoverCard>
						<TodoTableEdit
							todo={todo}
							projects={table.options.meta?.todo.projects ?? []}
							users={table.options.meta?.todo.users ?? []}
						/>
						<HoverCardContent className="text-muted-foreground w-96">
							{(todo.hidden || todo.archived) && (
								<div className="flex flex-row gap-2 pb-2">
									{todo.archived && (
										<Badge variant="destructive">{t("archived")}</Badge>
									)}
									{todo.hidden && <Badge>{t("hidden")}</Badge>}
								</div>
							)}

							<div className="flex flex-row items-center gap-2">
								<Label className="flex flex-row">{t("deadline")}:</Label>
								<p className="text-foreground">
									{todo.deadline
										? new Intl.DateTimeFormat().format(todo.deadline)
										: t("none")}
								</p>
							</div>
							{todo.description && (
								<>
									<Separator className="w-full my-2" />
									<div className="flex flex-col">
										<Label className="pr-2">{t("description")}:</Label>
										<p className="text-foreground whitespace-pre-line">
											{todo.description}
										</p>
									</div>
								</>
							)}

							<Separator className="w-full my-2" />
							<p className="text-muted-foreground/80">{t("hoverInfo")}</p>
						</HoverCardContent>
					</HoverCard>
				</div>
			);
		},
	},
	{
		id: "assignees",
		accessorKey: "assignees",
		header: () => useTranslations("Todo.Miscellaneous")("assignees"),
		cell: ({ row }) => {
			const todo = row.original;
			return (
				<div className="flex flex-col flex-wrap gap-1">
					{todo.assignees.map((assignee) => (
						<Badge
							variant="secondary"
							key={assignee.id}
							className="px-4 text-center text-xs text-nowrap w-full"
						>
							<p className="w-full">{assignee.name}</p>
						</Badge>
					))}
				</div>
			);
		},
	},
	{
		id: "creator",
		accessorKey: "creator",
		header: () => useTranslations("Todo.Miscellaneous")("creator"),
		cell: ({ row }) => (
			<div className="text-center">{row.original.creator.name}</div>
		),
	},
	{
		id: "createdAt",
		accessorKey: "createdAt",
		sortingFn: "datetime",
		header: () => useTranslations("Todo.Miscellaneous")("createdAt"),
		cell: ({ row }) => {
			const todo = row.original;
			return (
				<div className="font-medium text-nowrap">
					{todo.createdAt.toLocaleString()}
				</div>
			);
		},
	},
	{
		id: "archived",
		accessorKey: "archived",
		enableHiding: false,
	},
	{
		id: "archived",
		accessorKey: "archived",
		enableHiding: false,
	},
	{
		id: "hidden",
		accessorKey: "hidden",
		enableHiding: false,
	},
	{
		id: "actions",
		enableHiding: false,
		header: ({ table }) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0">
						<Settings2 className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>
						{useTranslations("Todo.Miscellaneous")("visibleColumns")}
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{table
						.getAllColumns()
						.filter((column) => column.getCanHide())
						.map((column) => {
							return (
								<DropdownMenuCheckboxItem
									key={column.id}
									className="capitalize"
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(!!value)}
								>
									{column.id}
								</DropdownMenuCheckboxItem>
							);
						})}
				</DropdownMenuContent>
			</DropdownMenu>
		),
		cell: ({ row }) => {
			const t = useTranslations("Todo.Miscellaneous");

			const router = useRouter();
			const todo = row.original;

			async function archive() {
				const result = await fetch("/api/todo?type=ARCHIVE", {
					method: "PUT",
					body: JSON.stringify({ id: todo.id }),
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
					toast.success("Successfully archived", {
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
			async function visibiltyToggle() {
				const result = await fetch("/api/todo?type=VISIBILITY", {
					method: "PUT",
					body: JSON.stringify({ id: todo.id }),
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
					toast.success("Successfully changed visibility", {
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

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() =>
								navigator.clipboard.writeText(
									`${window.location.host}/todo?link=${todo.id}`,
								)
							}
						>
							{t("copyLink")}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem disabled={todo.archived} onClick={archive}>
							{t("archive")}
						</DropdownMenuItem>
						{!todo.hidden && (
							<DropdownMenuItem onClick={() => visibiltyToggle()}>
								{t("hide")}
							</DropdownMenuItem>
						)}
						{todo.hidden && (
							<DropdownMenuItem onClick={() => visibiltyToggle()}>
								{t("show")}
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
