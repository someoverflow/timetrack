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
  };
}) {
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");
  if (auth.user.role !== "ADMIN") redirect("/");
  
  const t = await getTranslations("Admin.Users");

  const cookieStore = cookies();

  const usersCount = await prisma.user.count({
    where: {
      name: {
        contains: searchParams?.search,
      },
    },
  });

  //#region Pagination
  let pageSize = Number(cookieStore.get("pageSize")?.value);
  pageSize = !Number.isNaN(pageSize) ? pageSize : 15;

  const pages = Math.ceil(usersCount / pageSize);

  let page = Number(searchParams?.page);
  page = !Number.isNaN(page) ? page : 1;
  if (page < 1 || page > pages) page = 1;
  //#endregion

  const [dbUsers, dbCustomers] = await prisma.$transaction([
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

        customerName: true,

        createdAt: true,
        updatedAt: true,

        chips: true,
      },
    }),
    prisma.customer.findMany({ select: { name: true } }),
  ]);

  const users = dbUsers
    .sort((a, b) =>
      a.username.localeCompare(b.username, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    )
    .slice((page - 1) * pageSize, page * pageSize);

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">{t("title")}</p>
        </div>

        <DataTable
          columns={columns}
          data={users}
          customers={dbCustomers.map((customer) => customer.name)}
          paginationData={{ page: page, pages: pages, pageSize: pageSize }}
        />
      </section>
    </Navigation>
  );
}
