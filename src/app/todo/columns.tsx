"use client";

import type { Prisma } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ArrowDownAZ,
	ArrowUpDown,
	ArrowUpZA,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	ChevronsUp,
	CircleCheckBig,
	CircleDot,
	CircleDotDashed,
	ListFilter,
	MoreHorizontal,
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
		header: ({ column }) => (
			<div className="flex items-center space-x-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="-ml-3 h-8 data-[state=open]:bg-accent w-full"
						>
							<span>Task</span>
							{column.getIsSorted() === "desc" ? (
								<ArrowUpZA className="ml-2 h-4 w-4" />
							) : column.getIsSorted() === "asc" ? (
								<ArrowDownAZ className="ml-2 h-4 w-4" />
							) : (
								<ListFilter className="ml-2 h-4 w-4" />
							)}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
							<ArrowDownAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
							Asc
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
							<ArrowUpZA className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
							Desc
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		),
		cell: ({ row }) => {
			const todo = row.original;
			return (
				<div className="flex flex-row items-center gap-2">
					<div className="flex flex-col justify-between gap-1 h-10">
						<Tooltip>
							<TooltipTrigger>
								{row.original.status === "TODO" && (
									<CircleDot className="h-4 w-4 text-blue-500" />
								)}
								{row.original.status === "IN_PROGRESS" && (
									<CircleDotDashed className="h-4 w-4 text-amber-500" />
								)}
								{row.original.status === "DONE" && (
									<CircleCheckBig className="h-4 w-4 text-emerald-500" />
								)}
							</TooltipTrigger>
							<TooltipContent side="right">
								{row.original.status === "TODO" && "Todo"}
								{row.original.status === "IN_PROGRESS" && "In Progress"}
								{row.original.status === "DONE" && "Done"}
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger>
								{row.original.priority === "HIGH" && (
									<ChevronsUp className="h-4 w-4 text-red-500" />
								)}
								{row.original.priority === "MEDIUM" && (
									<ChevronUp className="h-4 w-4 text-emerald-500" />
								)}
								{row.original.priority === "LOW" && (
									<ChevronDown className="h-4 w-4 text-blue-500" />
								)}
							</TooltipTrigger>
							<TooltipContent side="right">
								{row.original.priority === "HIGH" && "High Priority"}
								{row.original.priority === "MEDIUM" && "Medium Priority"}
								{row.original.priority === "LOW" && "Low Priority"}
							</TooltipContent>
						</Tooltip>
					</div>

					<Separator orientation="vertical" className="ml-2 h-10" />

					<p className="flex flex-col justify-center text-xs text-muted-foreground/80 space-x-2 w-full">
						{todo.relatedProjects.map(
							(project, index) =>
								project.name +
								(index !== todo.relatedProjects.length - 1 ? " / " : ""),
						)}
						<span className="text-primary text-base">
							<ChevronRight className="inline-block size-3 text-muted-foreground" />
							{todo.task}
						</span>
					</p>
				</div>
			);
		},
	},
	{
		id: "status",
		accessorKey: "status",
		enableHiding: false,
	},
	{
		id: "priority",
		accessorKey: "priority",
		enableHiding: false,
	},
	{
		id: "assignees",
		accessorKey: "assignees",
		header: "Assignees",
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
							{assignee.name}
						</Badge>
					))}
				</div>
			);
		},
	},
	{
		id: "creator",
		accessorKey: "creator",
		header: "Creator",
		cell: ({ row }) => (
			<div className="text-center">{row.original.creator.name}</div>
		),
	},
	{
		id: "createdAt",
		accessorKey: "createdAt",
		sortingFn: "datetime",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					className="text-right"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Created at
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const todo = row.original;
			return (
				<div className=" font-medium">{todo.createdAt.toLocaleString()}</div>
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
					<DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
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
			const payment = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() => navigator.clipboard.writeText(payment.id)}
						>
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>Archive</DropdownMenuItem>
						<DropdownMenuItem>Hide</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
