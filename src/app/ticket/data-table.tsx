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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  CircleCheckBig,
  CircleDot,
  CircleDotDashed,
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileVideo,
  Filter,
  FilterX,
  type LucideProps,
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
import type { Ticket, TicketUpload, User } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { mimeTypes } from "@/lib/file-utils";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProjectSelection } from "@/components/project-select";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
//#endregion

interface DataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];

  projects: Projects;
  users: Users;
  user: Partial<User>;

  paginationData: {
    pages: number;
    page: number;
    pageSize: number;
  };

  maxFileSize: number;

  filters: {
    archived: boolean;
    status: {
      todo: boolean;
      in_progress: boolean;
      done: boolean;
    };

    projects: string[] | undefined;
    assignees: string[] | undefined;
  };
}

export function DataTable<TData, TValue>({
  data,
  columns,
  projects,
  users,
  paginationData,
  filters,
  maxFileSize,
  user,
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
        maxFileSize,
        user,
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
    assigneesFilter?: string[];
    projectsFilter?: string[];
    status?: Partial<{
      todo: boolean;
      in_progress: boolean;
      done: boolean;
    }>;
    reset?: boolean;
  }) => {
    if (typeof document !== "undefined") {
      const setCookie = (name: string, value = "undefined", maxAge = "0") => {
        document.cookie = encodeURI(
          `${name}=${value};max-age=${maxAge};path=/`,
        );
      };

      // Reset Filter
      if (data.reset) {
        setCookie("ticket-filter-archived");
        setCookie("ticket-filter-status-todo");
        setCookie("ticket-filter-status-inProgress");
        setCookie("ticket-filter-status-done");
        setCookie("ticket-filter-assignees");
        setCookie("ticket-filter-projects");
      } else {
        // Archived
        if (data.archived !== undefined) {
          setCookie(
            "ticket-filter-archived",
            `${!filters.archived}`,
            "31536000",
          );
        }

        // Projects
        if (data.projectsFilter && user.role !== "CUSTOMER") {
          const projectsCookie = data.projectsFilter.length
            ? JSON.stringify(data.projectsFilter)
            : "undefined";
          setCookie(
            "ticket-filter-projects",
            projectsCookie,
            projectsCookie === "undefined" ? "0" : "31536000",
          );
        }

        // Assignees
        if (data.assigneesFilter && user.role !== "CUSTOMER") {
          const assigneesCookie = data.assigneesFilter.length
            ? JSON.stringify(data.assigneesFilter)
            : "undefined";
          setCookie(
            "ticket-filter-assignees",
            assigneesCookie,
            assigneesCookie === "undefined" ? "0" : "31536000",
          );
        }

        // Status
        if (data.status) {
          const statusKeys: Array<keyof typeof data.status> = [
            "todo",
            "in_progress",
            "done",
          ];
          statusKeys.forEach((key) => {
            if (data.status![key] !== undefined) {
              setCookie(
                `ticket-filter-status-${key}`,
                `${data.status![key]}`,
                "31536000",
              );
            }
          });
        }
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

  const assigneesFilter = filters.assignees ?? [];
  const projectsFilter = filters.projects ?? [];

  return (
    <>
      <div
        className={cn(
          "h-0.5 w-[10%] animate-pulse rounded-xl bg-primary opacity-0 transition-all duration-700",
          isPending && "opacity-100",
        )}
      />

      <div>
        <div className="flex w-full flex-row items-center justify-between gap-2 p-2">
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
            <Popover modal>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 sm:w-fit sm:px-3"
                >
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:block">{t("filter")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[90vw] max-w-72">
                <div className="grid gap-4 p-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() =>
                      updateFilter({
                        status: { todo: !filters.status.todo },
                      })
                    }
                  >
                    <CircleDot
                      className={cn(
                        "mr-2 size-4",
                        filters.status.todo
                          ? "text-blue-500"
                          : "text-muted-foreground",
                      )}
                    />
                    {t("steps.todo")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() =>
                      updateFilter({
                        status: {
                          in_progress: !filters.status.in_progress,
                        },
                      })
                    }
                  >
                    <CircleDotDashed
                      className={cn(
                        "mr-2 size-4",
                        filters.status.in_progress
                          ? "text-amber-500"
                          : "text-muted-foreground",
                      )}
                    />
                    {t("steps.inProgress")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() =>
                      updateFilter({
                        status: { done: !filters.status.done },
                      })
                    }
                  >
                    <CircleCheckBig
                      className={cn(
                        "mr-2 size-4",
                        filters.status.done
                          ? "text-emerald-500"
                          : "text-muted-foreground",
                      )}
                    />
                    {t("steps.done")}
                  </Button>

                  <Separator />

                  {user.role != "CUSTOMER" && (
                    <>
                      <div className="grid gap-1.5 p-1">
                        {/* TODO: Allow for customers */}
                        <Label
                          htmlFor="projects-button"
                          className="pl-2 text-muted-foreground"
                        >
                          {t("projects")}
                        </Label>
                        <ProjectSelection
                          project={projectsFilter}
                          changeProject={(project) => {
                            if (!project)
                              throw new Error(
                                "Project is undefined in selection",
                              );
                            const tempProjectsFilter = projectsFilter;

                            if (tempProjectsFilter.includes(project))
                              tempProjectsFilter.splice(
                                tempProjectsFilter.indexOf(project),
                                1,
                              );
                            else tempProjectsFilter.push(project);

                            updateFilter({
                              projectsFilter: tempProjectsFilter,
                            });
                          }}
                          projects={projects}
                          multiSelect
                          button={
                            <Button
                              id="projects-button"
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              <div className="flex flex-row gap-1">
                                {filters.projects === undefined &&
                                  t("noFilter")}
                                {filters.projects?.length === 0 &&
                                  t("projectsEmpty")}
                                {filters.projects?.length !== 0 &&
                                  projectsFilter.map((value, index) => {
                                    if (index !== 0) return undefined;
                                    return (
                                      <Badge
                                        key={`project-${value}`}
                                        variant="outline"
                                      >
                                        {value}
                                      </Badge>
                                    );
                                  })}

                                {projectsFilter.length > 1 && (
                                  <Badge variant="secondary">
                                    +{projectsFilter.length - 1}
                                  </Badge>
                                )}
                              </div>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          }
                        />
                      </div>

                      <div className="grid h-full w-full gap-1.5 p-1">
                        <Popover modal>
                          {/* TODO: Grouped Users */}
                          <Label
                            htmlFor="userFilter-button"
                            className="pl-2 text-muted-foreground"
                          >
                            {t("assignees")}
                          </Label>
                          <PopoverTrigger asChild>
                            <Button
                              id="userFilter-button"
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              <div className="flex flex-row gap-1">
                                {filters.assignees === undefined &&
                                  t("noFilter")}

                                {assigneesFilter?.map((value, index) => {
                                  if (index !== 0) return undefined;
                                  const user = users.single.find(
                                    (u) => u.username === value,
                                  );
                                  if (!user) return undefined;

                                  return (
                                    <Badge
                                      key={`userFiltered-${value}`}
                                      variant="outline"
                                    >
                                      {user.name ?? user.username}
                                    </Badge>
                                  );
                                })}
                                {assigneesFilter.length > 1 && (
                                  <Badge variant="secondary">
                                    +{assigneesFilter.length - 1}
                                  </Badge>
                                )}
                              </div>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-2">
                            <Command>
                              <CommandInput
                                placeholder={t("search")}
                                className="h-8"
                              />
                              <CommandGroup>
                                {users.single.map((user) => (
                                  <CommandItem
                                    key={`user-${user.username}`}
                                    className="text-nowrap"
                                    value={`${user.username} ${user.name}`}
                                    onSelect={() => {
                                      const value = user.username;

                                      const tempUsersFilter = assigneesFilter;

                                      if (tempUsersFilter.includes(value))
                                        tempUsersFilter.splice(
                                          tempUsersFilter.indexOf(value),
                                          1,
                                        );
                                      else tempUsersFilter.push(value);

                                      updateFilter({
                                        assigneesFilter: tempUsersFilter,
                                      });
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        assigneesFilter.includes(user.username)
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {user.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <Separator />
                    </>
                  )}

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

                  <Separator />

                  <div className="flex flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => updateFilter({ reset: true })}
                      className="w-full"
                    >
                      <FilterX className="mr-4 size-4" />
                      {t("reset")}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <TicketAdd users={users} projects={projects} />
          </div>
        </div>
        <ScrollArea
          className="relative h-[calc(95svh-82px-68px-56px-40px)] w-[95vw] max-w-2xl rounded-md border"
          type="always"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-secondary/40 backdrop-blur-xl">
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
                  const ticket = row.original as Ticket & {
                    creator: { name: any; username: string };
                    uploads: TicketUpload[];
                  };

                  return (
                    <Popover key={row.id} modal>
                      <PopoverTrigger
                        asChild
                        onClick={(e) => {
                          const open = localStorage.getItem("ticket-open");
                          if (open) e.preventDefault();
                        }}
                      >
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
                        className="w-[95vw] max-w-screen-sm border-secondary-foreground/20 text-muted-foreground dark:bg-secondary"
                      >
                        <ScrollArea className="">
                          <div className="max-h-[50dvh]">
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
                                {t("creator")}:
                              </Label>
                              <p className="text-foreground">
                                {ticket.creator.name ?? ticket.creator.username}
                              </p>
                            </div>

                            <div className="flex flex-row items-center gap-2">
                              <Label className="flex flex-row">
                                {t("createdAt")}:
                              </Label>
                              <p className="text-foreground">
                                {ticket.createdAt.toLocaleString()}
                              </p>
                            </div>

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

                            {ticket.uploads.length !== 0 && (
                              <>
                                <Separator className="my-2 w-full bg-secondary-foreground/20" />

                                <Label className="flex flex-row">
                                  {t("uploads")}
                                </Label>
                                <ScrollArea className="w-full rounded-md p-1">
                                  <div className="flex flex-row gap-2 p-2">
                                    {ticket.uploads.map((upload) => (
                                      <Tooltip key={upload.id}>
                                        <TooltipTrigger
                                          asChild
                                          onFocusCapture={(e) => {
                                            e.stopPropagation();
                                          }}
                                        >
                                          <Link
                                            href={`/api/files/${upload.id}/${upload.name}`}
                                            target="_blank"
                                          >
                                            <Button className="gap-2 text-nowrap">
                                              <FileTypeIcon
                                                type={upload.type}
                                              />
                                              {upload.name.replace(
                                                upload.extension,
                                                "",
                                              )}
                                            </Button>
                                          </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                          <div className="rounded-md blur-[1px]">
                                            {(mimeTypes.documents.includes(
                                              upload.type,
                                            ) ||
                                              mimeTypes.images.includes(
                                                upload.type,
                                              )) && (
                                              <iframe
                                                src={`/api/files/${upload.id}/${upload.name}`}
                                              />
                                            )}
                                            {mimeTypes.videos.includes(
                                              upload.type,
                                            ) && (
                                              <video
                                                className="h-[20dvw]"
                                                src={`/api/files/${upload.id}/${upload.name}`}
                                              />
                                            )}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>

                                  <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                              </>
                            )}

                            {(ticket.description ?? "").trim().length != 0 && (
                              <>
                                <Separator className="my-2 w-full bg-secondary-foreground/20" />
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  className="prose prose-neutral w-full dark:prose-invert"
                                >
                                  {ticket.description}
                                </ReactMarkdown>
                              </>
                            )}
                          </div>
                        </ScrollArea>
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
        <div className="flex w-full items-center justify-evenly space-x-4 p-2 sm:justify-end sm:py-4">
          <div className="flex flex-col items-center space-x-2 sm:flex-row">
            <p className="text-sm font-medium">{t("rowsPerPage")}</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
                if (typeof document !== "undefined")
                  document.cookie = encodeURI(
                    `pageSize=${value};max-age=31536000;path=/`,
                  );
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

          <div className="flex flex-col items-center justify-center sm:flex-row sm:gap-2">
            <p className="flex w-full justify-center text-center text-sm font-medium sm:w-[100px]">
              {t("currentPage", {
                page: paginationData.page,
                pages: paginationData.pages,
              })}
            </p>
            <div className="flex flex-row items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  changePage(1);
                }}
                disabled={paginationData.page === 1 || isPending}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  changePage(paginationData.page - 1);
                }}
                disabled={paginationData.page === 1 || isPending}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  changePage(paginationData.page + 1);
                }}
                disabled={
                  paginationData.page >= paginationData.pages || isPending
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  changePage(paginationData.pages);
                }}
                disabled={
                  paginationData.page >= paginationData.pages || isPending
                }
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const FileTypeIcon = ({ type }: { type: string }) => {
  const typeIconMap: Record<
    string,
    React.ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
    >
  > = {
    images: FileImage,
    videos: FileVideo,
    audios: FileAudio,
    archives: FileArchive,
    documents: File,
  };

  const category = Object.entries(mimeTypes).find(([, mimeList]) =>
    mimeList.includes(type),
  )?.[0] as keyof typeof typeIconMap | undefined;

  const IconComponent = category ? typeIconMap[category] : null;

  return IconComponent ? <IconComponent className="size-5" /> : null;
};
