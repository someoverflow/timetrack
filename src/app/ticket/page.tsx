//#region Imports
import Navigation from "@/components/navigation";

import { DataTable } from "./data-table";
import { columns } from "./columns";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { TicketPriority, TicketStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authCheck } from "@/lib/auth";
//#endregion

const maxFileSize = Math.pow(1024, 2) * Number(process.env.UPLOAD_LIMIT);

const statusOrder = {
  [TicketStatus.TODO]: 2,
  [TicketStatus.IN_PROGRESS]: 1,
  [TicketStatus.DONE]: 3,
};
const priorityOrder = {
  [TicketPriority.HIGH]: 1,
  [TicketPriority.MEDIUM]: 2,
  [TicketPriority.LOW]: 3,
};

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "Tickets.Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Tickets({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
    search?: string;
    link?: string;
    archived?: string;
  };
}) {
  // AUTH
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");
  const user = auth.user;

  // TRANSLATION
  const t = await getTranslations("Tickets");

  //#region Filter
  const cookieStore = cookies();
  const filterCookies = {
    archived: cookieStore.get("ticket-filter-archived")?.value,

    status: {
      todo: cookieStore.get("ticket-filter-status-todo")?.value,
      in_progress: cookieStore.get("ticket-filter-status-inProgress")?.value,
      done: cookieStore.get("ticket-filter-status-done")?.value,
    },
  };

  const status = {
    todo: (filterCookies.status.todo ?? "true") === "true",
    in_progress: (filterCookies.status.in_progress ?? "true") === "true",
    done: (filterCookies.status.done ?? "false") === "true",
  };
  const archived = filterCookies.archived === "true";

  const statusFilter: TicketStatus[] = [];
  if (status.todo) statusFilter.push("TODO");
  if (status.in_progress) statusFilter.push("IN_PROGRESS");
  if (status.done) statusFilter.push("DONE");

  /*
  let projectsFilter: string[] | undefined = undefined;

  try {
    if (filterCookies.projects)
      projectsFilter = userArrayValidation.safeParse(
        JSON.parse(filterCookies.projects),
      ).data;
  } catch (e) {
    console.warn(e);
    cookieStore.delete("ticket-filter-archived");
  }
 */

  const customerFilter =
    user.role === "CUSTOMER"
      ? {
          users: {
            some: {
              id: user.id,
            },
          },
        }
      : undefined;
  //#endregion

  //#region Pagination
  const ticketsCount = await prisma.ticket.count({
    where: {
      task: {
        contains: searchParams?.search,
      },
      hidden: false,

      status: {
        in: statusFilter,
      },

      archived: archived,
      projects:
        user.role === "CUSTOMER"
          ? {
              some: {
                customer: customerFilter,
              },
            }
          : undefined,
    },
  });

  let pageSize = Number(cookieStore.get("pageSize")?.value);
  pageSize = !Number.isNaN(pageSize) ? pageSize : 15;

  const pages = Math.ceil(ticketsCount / pageSize);

  let page = Number(searchParams?.page);
  page = !Number.isNaN(page) ? page : 1;
  if (page < 1 || page > pages) page = 1;
  //#endregion

  // DATA
  const [dbTickets, dbProjects, dbUsers] = await prisma.$transaction([
    prisma.ticket.findMany({
      where: {
        task: {
          contains: searchParams?.search,
        },
        hidden: false,

        status: {
          in: statusFilter,
        },

        archived: archived,
        projects:
          user.role === "CUSTOMER"
            ? {
                some: {
                  customer: customerFilter,
                },
              }
            : undefined,
      },

      include: {
        assignees: {
          where: {
            OR: [
              {
                customer: user.role === "CUSTOMER" ? customerFilter : undefined,
              },
              {
                role: {
                  notIn: ["CUSTOMER"],
                },
              },
            ],
          },
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        uploads: {
          include: {
            creator: {
              select: {
                name: true,
                username: true,
                id: true,
              },
            },
          },
        },
        projects: {
          where: {
            customer: user.role === "CUSTOMER" ? customerFilter : undefined,
          },
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.project.findMany({
      select: {
        customerName: true,
        name: true,
      },
      where: {
        customer: customerFilter,
      },
    }),
    prisma.user.findMany({
      where: {
        OR:
          user.role === "CUSTOMER"
            ? [
                {
                  NOT: { role: "CUSTOMER" },
                },
                {
                  customer: {
                    users: {
                      some: {
                        id: user.id,
                      },
                    },
                  },
                },
              ]
            : undefined,
      },
      select: { username: true, name: true, customerName: true },
    }),
  ]);

  const reducedUsers = dbUsers.map(({ name, username }) => ({
    name,
    username,
  }));
  const users = {
    single: reducedUsers,
    grouped: JSON.parse(
      JSON.stringify(
        Object.groupBy(
          reducedUsers,
          (_user, index) => dbUsers.at(index)?.customerName ?? "",
        ),
      ),
    ),
  };

  const projects = {
    single: dbProjects,
    grouped: JSON.parse(
      JSON.stringify(
        Object.groupBy(dbProjects, (project) => project.customerName ?? ""),
      ),
    ),
  };

  //#region Prepare Data
  const tickets = dbTickets
    .sort((a, b) => {
      const status =
        statusOrder[a.status as TicketStatus] -
        statusOrder[b.status as TicketStatus];
      const priority =
        priorityOrder[a.priority as TicketPriority] -
        priorityOrder[b.priority as TicketPriority];

      const task = a.task.localeCompare(b.task, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return status * 1_000_000 + priority * 1_000 + task * 1;
    })
    .slice((page - 1) * pageSize, page * pageSize);

  const linkedTask = searchParams?.link
    ? dbTickets.find((e) => e.id === searchParams?.link)
    : undefined;
  if (
    linkedTask &&
    tickets.find((e) => e.id === searchParams?.link) === undefined
  )
    tickets.unshift(linkedTask);
  //#endregion

  return (
    <Navigation>
      <section className="flex max-h-[95svh] w-full flex-col items-center gap-2 p-4">
        <div className="w-full pt-2 text-center font-mono">
          <p className="font-mono text-2xl">{t("title")}</p>
        </div>

        <DataTable
          data={tickets}
          columns={columns}
          paginationData={{ page: page, pages: pages, pageSize: pageSize }}
          projects={projects}
          users={users}
          filters={{
            archived: archived,
            status,
          }}
          maxFileSize={maxFileSize}
        />
      </section>
    </Navigation>
  );
}
