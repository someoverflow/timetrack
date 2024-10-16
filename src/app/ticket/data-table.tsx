"use client";

//#region Imports
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import { TicketAdd } from "./ticket-add";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Ticket } from "@prisma/client";
//#endregion

interface DataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];

  projects: Projects;
  users: Users;

  paginationData: {
    pages: number;
    page: number;
    pageSize: number;
  };

  filters: {
    archived: boolean;
  };
}

export function DataTable<TData, TValue>({
  data,
  columns,
  projects,
  users,
  paginationData,
  filters,
}: DataTableProps<TData, TValue>) {
  //#region Hooks
  const router = useRouter();
  const t = useTranslations("Tickets");

  const [isPending, startTransition] = useTransition();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      data: {
        projects,
        users,
      },
    },
    initialState: {
      pagination: paginationData,
      columnVisibility: ["createdAt", "creator", "archived", "hidden"].reduce(
        (acc: Record<string, boolean>, item) => {
          acc[item] = false;
          return acc;
        },
        {},
      ),
    },
  });
  //#endregion

  const changePage = async (page: number) => {
    if (page > paginationData.pages) return;
    if (page <= 0) return;

    const current = new URLSearchParams(window.location.search);
    current.set("page", `${page}`);
    const search = current.toString();
    const query = search ? `?${search}` : "";

    startTransition(() => {
      router.replace(`/ticket${query}`);
    });
  };

  const updateFilter = (data: {
    archived?: boolean;

    reset?: boolean;
  }) => {
    if (typeof document !== "undefined") {
      let cookie = "undefined";
      let maxAge = "31536000";

      // Archived
      if (data.archived === true) {
        maxAge = "31536000";
        document.cookie = `ticket-filter-archived=${!filters.archived};max-age=${maxAge};path=/`;
      }

      if (data.reset === true) {
        cookie = "undefined";
        maxAge = "0";
        document.cookie = `ticket-filter-archived=${cookie};max-age=${maxAge};path=/`;
      }
    }

    startTransition(() => {
      router.refresh();
    });
  };

  const updateSearch = useDebouncedCallback((value: string) => {
    const current = new URLSearchParams(window.location.search);

    if (value.trim() === "") current.delete("search");
    else current.set("search", value);

    const search = current.toString();
    const query = search ? `?${search}` : "";

    startTransition(() => {
      router.replace(`/ticket${query}`);
    });
  }, 300);

  return (
    <>
      <div
        className={cn(
          "animate-pulse w-[10%] h-0.5 bg-primary rounded-xl transition-all duration-700 opacity-0",
          isPending && "opacity-100",
        )}
      />

      <div>
        <div className="w-full flex flex-row items-center justify-between gap-2 p-2">
          <div className="w-full">
            <Input
              id="searchTaskInput"
              placeholder={t("search")}
              onChange={(e) => updateSearch(e.target.value)}
              defaultValue={
                typeof window !== "undefined"
                  ? (new URLSearchParams(window.location.search).get(
                      "search",
                    ) ?? "")
                  : ""
              }
            />
          </div>
          <div className="flex flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 sm:w-fit sm:px-3"
                >
                  <Filter className="sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:block">{t("filter")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full">
                <div className="grid gap-2 p-2">
                  <div className="flex flex-row items-center gap-4">
                    <Checkbox
                      id="archivedSwitch"
                      checked={filters.archived}
                      onCheckedChange={() => updateFilter({ archived: true })}
                      disabled={isPending}
                    />
                    <Label htmlFor="archivedSwitch" className="text-nowrap">
                      {t("archived")}
                    </Label>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <TicketAdd users={users} projects={projects} />
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
                table.getRowModel().rows.map((row) => {
                  const ticket = row.original as Ticket;

                  return (
                    <Popover key={row.id}>
                      <PopoverTrigger asChild>
                        <TableRow
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
                      </PopoverTrigger>
                      <PopoverContent
                        side="bottom"
                        className="text-muted-foreground w-96 max-w-[95vw]"
                      >
                        {ticket.archived && (
                          <div className="flex flex-row gap-2 pb-2">
                            {ticket.archived && (
                              <Badge variant="destructive">
                                {t("archived")}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex flex-row items-center gap-2">
                          <Label className="flex flex-row">
                            {t("deadline")}:
                          </Label>
                          <p className="text-foreground">
                            {ticket.deadline
                              ? new Intl.DateTimeFormat().format(
                                  ticket.deadline,
                                )
                              : t("none")}
                          </p>
                        </div>
                        <>
                          <Separator className="w-full my-2" />
                          <div className="flex flex-col">
                            <Label className="pr-2">{t("description")}:</Label>
                            <p className="text-foreground whitespace-pre-line">
                              {ticket.description ?? t("none")}
                            </p>
                          </div>
                        </>
                      </PopoverContent>
                    </Popover>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="flex items-center justify-evenly sm:justify-end space-x-4 p-2 sm:py-4 w-full">
          <div className="flex flex-col sm:flex-row items-center space-x-2">
            <p className="text-sm font-medium">{t("rowsPerPage")}</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
                if (typeof document !== "undefined")
                  document.cookie = `pageSize=${value};max-age=31536000;path=/`;
                router.refresh();
              }}
            >
              <SelectTrigger className="h-9 w-[65px]">
                <SelectValue
                  defaultValue={paginationData.page}
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[15, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center sm:gap-2">
            <p className="flex w-full sm:w-[100px] justify-center text-center text-sm font-medium">
              {t("currentPage", {
                page: paginationData.page,
                pages: paginationData.pages,
              })}
            </p>
            <div className="flex flex-row items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9"
                onClick={() => {
                  changePage(1);
                }}
                disabled={paginationData.page === 1 || isPending}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9"
                onClick={() => {
                  changePage(paginationData.page - 1);
                }}
                disabled={paginationData.page === 1 || isPending}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9"
                onClick={() => {
                  changePage(paginationData.page + 1);
                }}
                disabled={
                  paginationData.page >= paginationData.pages || isPending
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9"
                onClick={() => {
                  changePage(paginationData.pages);
                }}
                disabled={
                  paginationData.page >= paginationData.pages || isPending
                }
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
