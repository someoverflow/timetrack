//#region Imports
import Navigation from "@/components/navigation";

import { DataTable } from "./data-table";
import { columns } from "./columns";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { TodoPriority, TodoStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authCheck } from "@/lib/auth";
//#endregion

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "Todo.Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function History({
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
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");
  const user = auth.user;

  const t = await getTranslations("Todo");

  const cookieStore = cookies();

  // TODO: Store archived in cookies?
  const archived = (searchParams?.archived ?? "false") === "true";

  const todoCount = await prisma.todo.count({
    where: {
      task: {
        contains: searchParams?.search,
      },
      hidden: false,
      archived: archived,
      OR: [
        {
          creatorId: user.id,
        },
        {
          assignees: {
            some: {
              id: user.id,
            },
          },
        },
      ],
    },
  });

  const defaultPageSize = 15;
  let pageSize = Number(cookieStore.get("pageSize")?.value);
  pageSize = !Number.isNaN(pageSize) ? pageSize : defaultPageSize;

  const pages = Math.ceil(todoCount / pageSize);

  let page = Number(searchParams?.page);
  page = !Number.isNaN(page) ? page : 1;
  if (page < 1 || page > pages) page = 1;

  const [todos, users, projects] = await prisma.$transaction([
    prisma.todo.findMany({
      where: {
        task: {
          contains: searchParams?.search,
        },
        hidden: false,
        archived: archived,
        OR: [
          {
            creatorId: user.id,
          },
          {
            assignees: {
              some: {
                id: user.id,
              },
            },
          },
        ],
      },
      include: {
        assignees: {
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
        relatedProjects: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.user.findMany({ select: { username: true, name: true } }),
    prisma.project.findMany(),
  ]);
  const processedTodos = todos
    .sort((a, b) => {
      const statusOrder = {
        [TodoStatus.TODO]: 1,
        [TodoStatus.IN_PROGRESS]: 2,
        [TodoStatus.DONE]: 3,
      };
      const priorityOrder = {
        [TodoPriority.HIGH]: 1,
        [TodoPriority.MEDIUM]: 2,
        [TodoPriority.LOW]: 3,
      };

      const status =
        statusOrder[a.status as TodoStatus] -
        statusOrder[b.status as TodoStatus];
      const priority =
        priorityOrder[a.priority as TodoPriority] -
        priorityOrder[b.priority as TodoPriority];

      const task = a.task.localeCompare(b.task, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return status || priority || task;
    })
    .slice((page - 1) * pageSize, page * pageSize);
  if (searchParams?.link) {
    if (processedTodos.find((e) => e.id === searchParams.link) === undefined) {
      const linkedTodo = todos.find((e) => e.id === searchParams.link);
      if (linkedTodo) processedTodos.unshift(linkedTodo);
    }
  }

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">{t("title")}</p>
        </div>

        <DataTable
          paginationData={{ page: page, pages: pages, pageSize: pageSize }}
          columns={columns}
          data={processedTodos}
          archived={archived}
          projects={projects}
          users={users}
        />
      </section>
    </Navigation>
  );
}
