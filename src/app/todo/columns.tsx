/* eslint-disable react-hooks/rules-of-hooks */
"use client";

//#region Imports
import type { Prisma, Todo } from "@prisma/client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent } from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronsUp,
  CircleCheckBig,
  CircleDot,
  CircleDotDashed,
  MoreHorizontal,
  MousePointerClick,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

import { TodoTableEdit } from "./todo-edit";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import useRequest from "@/lib/hooks/useRequest";
import { cn } from "@/lib/utils";
//#endregion

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
    header: ({ column: _column }) => {
      const t = useTranslations("Todo.Miscellaneous");
      return (
        <div className="flex items-center space-x-2">
          <Button
            onClick={
              () => {
                console.log("Sort");
              }
              // TODO: Sorting
              // column.toggleSorting(column.getIsSorted() === "asc", true)
            }
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent w-full"
          >
            <span>{t("task")}</span>
            {/* 
						{column.getIsSorted() === "desc" ? (
							<ArrowDownZA className="ml-2 h-4 w-4" />
						) : column.getIsSorted() === "asc" ? (
							<ArrowDownAZ className="ml-2 h-4 w-4" />
						) : (
							<ListFilter className="ml-2 h-4 w-4" />
						)}
						 */}
          </Button>
        </div>
      );
    },
    cell: ({ row, table }) => {
      const t = useTranslations("Todo.Miscellaneous");
      const router = useRouter();
      const todo = row.original;

      const { status, send } = useRequest(
        () => {
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

          return fetch("/api/todo", {
            method: "PUT",
            body: JSON.stringify(request),
          });
        },
        (_result) => {
          toast.success(t("changed"), {
            duration: 3_000,
          });
          router.refresh();
        },
      );

      return (
        <div className="flex flex-row items-center gap-2">
          <div
            className={cn(
              "flex flex-col justify-between gap-1 h-10",
              todo.priority == "MEDIUM" && "justify-center",
            )}
          >
            {todo.priority !== "MEDIUM" && (
              <Tooltip>
                <TooltipTrigger>
                  {todo.priority === "HIGH" && (
                    <ChevronsUp className="h-4 w-4 text-red-500" />
                  )}
                  {todo.priority === "LOW" && (
                    <ChevronDown className="h-4 w-4 text-blue-500" />
                  )}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {todo.priority === "HIGH" && t("priorities.high")}
                  {todo.priority === "LOW" && t("priorities.low")}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger
                onClick={() => {
                  if (!status.loading) send();
                }}
              >
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
                      {t("stepsNext.inProgress")}
                    </span>
                  </div>
                )}
                {todo.status === "DONE" && (
                  <div className="text-muted-foreground">
                    {t("steps.done")}
                    <br />
                    <span className="text-primary flex flex-row items-center gap-1">
                      <MousePointerClick className="h-4 w-4 inline-flex" />{" "}
                      {t("stepsNext.done")}
                    </span>
                  </div>
                )}
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

      const { status: archiveStatus, send: sendArchive } = useRequest(
        () =>
          fetch("/api/todo?type=ARCHIVE", {
            method: "PUT",
            body: JSON.stringify({ id: todo.id }),
          }),
        (_result) => {
          toast.success(t("changed"), {
            duration: 3_000,
          });
          router.refresh();
        },
      );

      const { status: visibilityStatus, send: sendVisibility } = useRequest(
        () =>
          fetch("/api/todo?type=VISIBILITY", {
            method: "PUT",
            body: JSON.stringify({ id: todo.id }),
          }),
        (_result) => {
          toast.success(t("changed"), {
            duration: 3_000,
          });
          router.refresh();
        },
      );

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
            <DropdownMenuItem
              disabled={todo.archived}
              onClick={() => {
                if (!archiveStatus.loading) sendArchive();
              }}
            >
              {t("archive")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (!visibilityStatus.loading) sendVisibility();
              }}
            >
              {t(todo.hidden ? "show" : "hide")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
