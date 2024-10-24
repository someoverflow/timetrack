"use client";

//#region Imports
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  type RowData,
  type ColumnDef,
} from "@tanstack/react-table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import UserAdd from "./user-add";

import React, { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { cn } from "@/lib/utils";
//#endregion

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  customers: string[];

  paginationData: {
    pages: number;
    page: number;
    pageSize: number;
  };
}

declare module "@tanstack/table-core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    data: {
      projects?: Projects;
      users?: Users;
      customers?: string[];
    };
  }
}

export function DataTable<TData, TValue>({
  columns,
  data,
  customers,
  paginationData,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const t = useTranslations("Admin.Users");

  const [isPending, startTransition] = useTransition();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    isMultiSortEvent: () => true,
    meta: {
      data: {
        customers,
      },
    },
    initialState: {
      pagination: {
        pageSize: paginationData.pageSize,
      },
    },
  });

  const changePage = async (page: number) => {
    if (page > paginationData.pages) return;
    if (page <= 0) return;

    const current = new URLSearchParams(window.location.search);
    current.set("page", `${page}`);
    const search = current.toString();
    const query = search ? `?${search}` : "";

    startTransition(() => {
      router.replace(`/admin/user${query}`);
    });
  };
  const updateSearch = useDebouncedCallback((value: string) => {
    const current = new URLSearchParams(window.location.search);

    if (value.trim() === "") current.delete("search");
    else current.set("search", value);

    const search = current.toString();
    const query = search ? `?${search}` : "";

    startTransition(() => {
      router.replace(`/admin/user${query}`);
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
              id="searchInput"
              placeholder={t("searchName")}
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
            <UserAdd customers={customers} />
          </div>
        </div>
        <ScrollArea
          className="relative w-[95vw] max-w-2xl h-[calc(95svh-82px-68px-56px-40px)] rounded-md border"
          type="always"
        >
          <Table className="table-auto w-full">
            <TableHeader className="sticky top-0 bg-secondary/40 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
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
                  let borderColor;
                  switch ((row.original as any).role) {
                    case "USER":
                      borderColor = "!border-l-green-500";
                      break;
                    case "ADMIN":
                      borderColor = "!border-l-red-500";
                      break;
                    case "CUSTOMER":
                      borderColor = "!border-l-blue-500";
                      break;
                  }
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn("!border-l-2", borderColor)}
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
                onClick={async () => {
                  await changePage(1);
                }}
                disabled={paginationData.page === 1 || isPending}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9"
                onClick={async () => {
                  await changePage(paginationData.page - 1);
                }}
                disabled={paginationData.page === 1 || isPending}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9"
                onClick={async () => {
                  await changePage(paginationData.page + 1);
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
                onClick={async () => {
                  await changePage(paginationData.pages);
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
