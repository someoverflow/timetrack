"use client";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	type ColumnFiltersState,
	getFilteredRowModel,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import React from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export function DataTable<TData, TValue>({
	columns,
	data,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([
		{ id: "status", desc: true },
		{ id: "priority", desc: false },
		{ id: "task", desc: false },
	]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
		{ id: "archived", value: false },
		{ id: "hidden", value: false },
	]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnFiltersChange: setColumnFilters,
		state: {
			sorting,
			columnFilters,
		},
		initialState: {
			pagination: {
				pageSize: 15,
			},
			columnVisibility: [
				"createdAt",
				"creator",
				"status",
				"priority",
				"archived",
				"hidden",
			].reduce((acc: Record<string, boolean>, item) => {
				acc[item] = false;
				return acc;
			}, {}),
		},
		isMultiSortEvent: (e) => true,
	});

	return (
		<div>
			<div className="w-full flex flex-row items-center justify-between gap-2 p-2">
				<div className="w-full">
					<Input
						placeholder="Search for tasks..."
						value={(table.getColumn("task")?.getFilterValue() as string) ?? ""}
						onChange={(event) =>
							table.getColumn("task")?.setFilterValue(event.target.value)
						}
						className="max-w-xs"
					/>
				</div>
				<div className="w-max">
					<div className="w-8 h-8 bg-white" />
				</div>
			</div>
			<ScrollArea
				className="relative w-[95vw] max-w-2xl h-[calc(95svh-82px-68px-56px-40px)] rounded-md border"
				type="always"
			>
				<Table>
					<TableHeader className="sticky top-0 bg-secondary/40 z-10">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											style={{
												minWidth:
													header.getSize() === 150
														? "auto"
														: `${header.getSize()}px`,
											}}
											className="w-full"
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell className="relative" key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</ScrollArea>
			<div className="flex items-center justify-end space-x-4 py-4">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Rows per page</p>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="h-9 w-[65px]">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{[15, 25, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[80px] items-center justify-center text-sm font-medium">
					Page {table.getState().pagination.pageIndex + 1} of{" "}
					{table.getPageCount()}
				</div>
				<div className="flex flex-row items-center space-x-1">
					<Button
						variant="outline"
						size="icon"
						className="w-9 h-9"
						onClick={() => table.firstPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<ChevronsLeft className="w-4 h-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="w-9 h-9"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<ChevronLeft className="w-4 h-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="w-9 h-9"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<ChevronRight className="w-4 h-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="w-9 h-9"
						onClick={() => table.lastPage()}
						disabled={!table.getCanNextPage()}
					>
						<ChevronsRight className="w-4 h-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
