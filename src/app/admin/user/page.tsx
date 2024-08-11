//#region Imports
import Navigation from "@/components/navigation";
import { columns } from "./columns";
import { DataTable } from "./data-table";

import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { authCheck } from "@/lib/auth";
//#endregion

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "Admin.Users.Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AdminUserPage({
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
  if (auth.user.role !== "ADMIN") redirect("/");
  const user = auth.user;

  const t = await getTranslations("Admin.Users");

  const cookieStore = cookies();

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
    prisma.user.findMany({
      where: {
        name: {
          contains: searchParams?.search,
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,

        createdAt: true,
        updatedAt: true,

        chips: true,
      },
    }),
    prisma.user.findMany({ select: { username: true, name: true } }),
    prisma.project.findMany(),
  ]);
  const processedTodos = todos
    .sort((a, b) =>
      a.username.localeCompare(b.username, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    )
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
          projects={projects}
          users={users}
        />
      </section>
    </Navigation>
  );
}
