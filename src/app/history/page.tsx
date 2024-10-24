//#region Imports
import type { Prisma } from "@prisma/client";

import Navigation from "@/components/navigation";
import TimerSection from "./timer-section";

import prisma from "@/lib/prisma";
import { authCheck } from "@/lib/auth";

import { redirect } from "next/navigation";
import { sumTimes, months } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { nameArrayValidation } from "@/lib/zod";
//#endregion

type Timer = Prisma.TimeGetPayload<{
  include: { project: true };
}>;
type Data = Record<string, Timer[]>;

function formatHistory(data: Timer[]): Data {
  const result: Data = {};

  for (const item of data) {
    const date = new Date(item.start);
    const year = date.getFullYear();
    const month = months[date.getMonth()];

    const str = `${year} ${month}`;
    if (!result[str]) result[str] = [];
    result[str].push(item);
  }

  return result;
}

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "History.Metadata" });

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
    ym?: string;
  };
}) {
  // AUTH
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");
  if (auth.user.role == "CUSTOMER") return redirect("/ticket");
  const user = auth.user;
  const userIsAdmin = user.role == "ADMIN";

  // TRANSLATION
  const t = await getTranslations("History");

  //#region Filter
  const cookieStore = cookies();
  const filterCookies = {
    invoiced: cookieStore.get("history-filter-invoiced")?.value,
    projects: cookieStore.get("history-filter-projects")?.value,
    users: userIsAdmin
      ? cookieStore.get("history-filter-users")?.value
      : undefined,
  };

  let invoiced: boolean | undefined = filterCookies.invoiced === "true";
  if (filterCookies.invoiced === undefined) invoiced = undefined;

  let projectsFilter: string[] | undefined = undefined;
  let userFilter: string[] | undefined = [user.username];

  try {
    if (filterCookies.projects)
      projectsFilter = nameArrayValidation.safeParse(
        JSON.parse(filterCookies.projects),
      ).data;

    if (filterCookies.users)
      userFilter = nameArrayValidation.safeParse(
        JSON.parse(filterCookies.users),
      ).data;
  } catch (e) {
    console.warn(e);
    cookieStore.delete("history-filter-projects");
    cookieStore.delete("history-filter-users");
  }
  //#endregion

  // HISTORY
  const history = await prisma.time.findMany({
    orderBy: {
      start: "desc",
    },
    where: {
      invoiced: invoiced,
      user: {
        username: {
          in: userFilter,
        },
      },
      project: projectsFilter
        ? {
            name: {
              in: projectsFilter,
            },
          }
        : undefined,
    },
    include: {
      project: true,
    },
  });

  //#region Year / Month
  const currentYearMonth =
    new Date().getFullYear() + " " + months[new Date().getMonth()];

  const startTimes = await prisma.time.groupBy({
    by: ["start"],
    where: { userId: userIsAdmin ? user.id : undefined },
  });

  let yearMonths = [
    ...new Set(
      startTimes
        .sort((a, b) => b.start.getTime() - a.start.getTime())
        .map(({ start }) => {
          const year = start.getFullYear();
          const month = months[start.getMonth()];
          return `${year} ${month}`;
        }),
    ),
  ];

  if (yearMonths.length === 0) yearMonths = [currentYearMonth];
  //#endregion

  //#region Projects
  const projectsResult = await prisma.project.findMany({
    select: {
      customerName: true,
      name: true,
    },
  });
  const projects = {
    single: projectsResult,
    grouped: JSON.parse(
      JSON.stringify(
        Object.groupBy(projectsResult, (project) => project.customerName ?? ""),
      ),
    ),
  };
  //#endregion

  const users = userIsAdmin
    ? await prisma.user.findMany({
        select: { id: true, name: true, username: true },
        where: {
          role: {
            not: "CUSTOMER",
          },
        },
      })
    : [{ id: user.id, name: user.name, username: user.username }];

  // TODO: Use Object.groupBy
  const historyData = formatHistory(history);

  let yearMonth = searchParams?.ym;
  if (!yearMonth || !yearMonths.includes(yearMonth))
    yearMonth = yearMonths[0] ?? currentYearMonth;

  const yearMonthGrouped = Object.groupBy(
    yearMonths.map((yearMonth, index) => ({
      index,
      yearMonth,
      year: (/\d+/.exec(yearMonth) ?? "")[0],
      month: yearMonth.split(" ")[1],
    })),
    (i) => i.year,
  );

  const timeStrings = (historyData[yearMonth] ?? [])
    .filter((data) => data.time !== null)
    .map((e) => e.time ?? "");

  return (
    <Navigation>
      <section className="flex max-h-[95svh] w-full flex-col items-center gap-1 p-4">
        <div className="w-full pt-2 text-center font-mono">
          <p className="font-mono text-2xl">{t("PageTitle")}</p>
        </div>

        <TimerSection
          user={user}
          users={users}
          history={historyData}
          currentHistory={historyData[yearMonth] ?? []}
          totalTime={sumTimes(timeStrings)}
          projects={projects}
          yearMonth={JSON.parse(
            JSON.stringify({
              current: yearMonth,
              all: yearMonths,
              grouped: yearMonthGrouped,
            }),
          )}
          filters={{
            projects: projectsFilter,
            users: filterCookies.users ? userFilter : undefined,
            invoiced,
          }}
        />
      </section>
    </Navigation>
  );
}
