/* eslint-disable react-hooks/rules-of-hooks */
"use client";

//#region Imports
import type { Prisma, Ticket } from "@prisma/client";

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
import {
  ChevronDown,
  ChevronRight,
  ChevronsUp,
  CircleCheckBig,
  CircleDot,
  CircleDotDashed,
  MoreHorizontal,
  MousePointerClick,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import useRequest from "@/lib/hooks/useRequest";
import { cn } from "@/lib/utils";
import { TicketTableEdit } from "./ticket-edit";
//#endregion

export const columns: ColumnDef<Prisma.TicketGetPayload<TicketPagePayload>>[] =
  [
    {
      id: "task",
      accessorKey: "task",
      enableHiding: false,
      sortingFn: "alphanumericCaseSensitive",
      header: ({ column: _column }) => {
        const t = useTranslations("Tickets");
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 w-full data-[state=open]:bg-accent"
            >
              <span>{t("task")}</span>
            </Button>
          </div>
        );
      },
      cell: ({ row, table }) => {
        const t = useTranslations("Tickets");
        const router = useRouter();
        const ticket = row.original;

        const { status, send } = useRequest(
          () => {
            const request: Partial<Ticket> = {
              id: ticket.id,
            };

            switch (ticket.status) {
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

            return fetch("/api/ticket", {
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
                "flex h-10 flex-col justify-between gap-1",
                ticket.priority == "MEDIUM" && "justify-center",
              )}
            >
              {ticket.priority !== "MEDIUM" && (
                <Tooltip>
                  <TooltipTrigger>
                    {ticket.priority === "HIGH" && (
                      <ChevronsUp className="h-4 w-4 text-red-500" />
                    )}
                    {ticket.priority === "LOW" && (
                      <ChevronDown className="h-4 w-4 text-blue-500" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {ticket.priority === "HIGH" && t("priorities.high")}
                    {ticket.priority === "LOW" && t("priorities.low")}
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!status.loading) send();
                  }}
                >
                  {ticket.status === "TODO" && (
                    <CircleDot className="h-4 w-4 text-blue-500" />
                  )}
                  {ticket.status === "IN_PROGRESS" && (
                    <CircleDotDashed className="h-4 w-4 text-amber-500" />
                  )}
                  {ticket.status === "DONE" && (
                    <CircleCheckBig className="h-4 w-4 text-emerald-500" />
                  )}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {ticket.status === "TODO" && (
                    <div className="text-muted-foreground">
                      {t("steps.todo")}
                      <br />
                      <span className="flex flex-row items-center gap-1 text-primary">
                        <MousePointerClick className="inline-flex h-4 w-4" />{" "}
                        {t("stepsNext.todo")}
                      </span>
                    </div>
                  )}
                  {ticket.status === "IN_PROGRESS" && (
                    <div className="text-muted-foreground">
                      {t("steps.inProgress")}
                      <br />
                      <span className="flex flex-row items-center gap-1 text-primary">
                        <MousePointerClick className="inline-flex h-4 w-4" />{" "}
                        {t("stepsNext.inProgress")}
                      </span>
                    </div>
                  )}
                  {ticket.status === "DONE" && (
                    <div className="text-muted-foreground">
                      {t("steps.done")}
                      <br />
                      <span className="flex flex-row items-center gap-1 text-primary">
                        <MousePointerClick className="inline-flex h-4 w-4" />{" "}
                        {t("stepsNext.done")}
                      </span>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="ml-2 h-10" />

            <TicketTableEdit
              maxFileSize={table.options.meta?.data.maxFileSize ?? 0}
              ticket={ticket}
              user={table.options.meta?.data.user}
              projects={
                table.options.meta?.data.projects ??
                ({ single: [], grouped: {} } satisfies Projects)
              }
              users={
                table.options.meta?.data.users ?? { single: [], grouped: {} }
              }
            >
              <p className="flex w-full flex-col justify-center space-x-2 rounded-sm bg-background/25 p-2 text-xs text-muted-foreground/80">
                {Object.keys(
                  table.options.meta?.data.projects?.grouped ?? {},
                ).map((group, index) => {
                  const projects = table.options.meta?.data.projects?.grouped[
                    group
                  ]?.filter(
                    (project) =>
                      ticket.projects.find((p) => p.name == project.name) !==
                      undefined,
                  );
                  if (!projects || projects.length == 0) return null;
                  return (
                    <span key={index}>
                      {group.length !== 0 && <sup>{group} </sup>}
                      {projects.map(
                        (project, index) =>
                          project.name +
                          (index !== ticket.projects.length - 1 ? " • " : ""),
                      )}
                    </span>
                  );
                })}
                <span className="text-base text-primary">
                  <ChevronRight className="inline-block size-3 text-muted-foreground" />
                  {ticket.task}
                </span>
              </p>
            </TicketTableEdit>
          </div>
        );
      },
    },
    {
      id: "assignees",
      accessorKey: "assignees",
      header: () => {
        const t = useTranslations("Tickets");
        return t("assignees");
      },
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="flex flex-col flex-wrap gap-1">
            {ticket.assignees.map((assignee) => (
              <Badge
                variant="secondary"
                key={assignee.id}
                className="w-full text-nowrap px-4 text-center text-xs"
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
      header: () => {
        const t = useTranslations("Tickets");
        return t("creator");
      },
      cell: ({ row }) => (
        <div className="text-center">{row.original.creator.name}</div>
      ),
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      sortingFn: "datetime",
      header: () => {
        const t = useTranslations("Tickets");
        return t("createdAt");
      },
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="text-nowrap font-medium">
            {ticket.createdAt.toLocaleString()}
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
              {useTranslations("Tickets")("visibleColumns")}
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
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      cell: ({ row }) => {
        const t = useTranslations("Tickets");

        const router = useRouter();
        const ticket = row.original;

        const { status: archiveStatus, send: sendArchive } = useRequest(
          () =>
            fetch("/api/ticket?type=ARCHIVE", {
              method: "PUT",
              body: JSON.stringify({ id: ticket.id }),
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
            fetch("/api/ticket?type=VISIBILITY", {
              method: "PUT",
              body: JSON.stringify({ id: ticket.id }),
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
                    `${window.location.host}/ticket?link=${ticket.id}`,
                  )
                }
              >
                {t("copyLink")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={ticket.archived}
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
                {t(ticket.hidden ? "show" : "hide")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
