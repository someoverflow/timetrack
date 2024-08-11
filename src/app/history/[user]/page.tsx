//#region Imports
import type { Prisma } from "@prisma/client";

import Navigation from "@/components/navigation";
import { badgeVariants } from "@/components/ui/badge";

import { TimerAddServer } from "../timer-add";
import TimerSection from "../timer-section";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { authCheck } from "@/lib/auth";
import { sumTimes, months } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
//#endregion

type Timer = Prisma.TimeGetPayload<{
  include: { project: true };
}>;

function formatHistory(data: Timer[]) {
  const result: Record<string, Timer[]> = {};

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
  params,
}: {
  searchParams?: {
    query?: string;
    ym?: string;
    user: string;
  };
  params: { user: string };
}) {
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");
  if (auth.user.role !== "ADMIN") redirect("/history");

  const t = await getTranslations("History");

  const cookieStore = cookies();

  const invoicedCookie = cookieStore.get("invoiced")?.value;
  const invoiced = [undefined, "true", "false"].includes(invoicedCookie)
    ? invoicedCookie
      ? invoicedCookie === "true"
      : undefined
    : undefined;

  const target = await prisma.user
    .findUnique({
      where: {
        username: params.user,
      },
      select: {
        id: true,
        username: true,
        name: true,
      },
    })
    .catch(() => null);

  const [history, projects] = await prisma.$transaction([
    prisma.time.findMany({
      orderBy: {
        start: "desc",
      },
      where: {
        userId: target?.id,
        invoiced: invoiced,
      },
      include: {
        project: true,
      },
    }),
    prisma.project.findMany(),
  ]);

  const historyData = history ? formatHistory(history) : {};

  let yearMonth = searchParams?.ym;
  if (yearMonth == undefined || !Object.keys(historyData).includes(yearMonth))
    yearMonth = Object.keys(historyData)[0] ?? "";

  const timeStrings = (historyData[yearMonth] ?? [])
    .filter((data) => data.time !== null)
    .map((e) => e.time);
  const totalTime =
    timeStrings.length !== 0 ? sumTimes(timeStrings as string[]) : "00:00:00";

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">
            {t("PageTitle")}
            <span
              className={badgeVariants({
                variant: "secondary",
                className: "absolute",
              })}
            >
              {target?.name ? target.name : params.user}
            </span>
          </p>
        </div>

        {target ? (
          <>
            {history.length !== 0 && historyData != null ? (
              <TimerSection
                history={historyData}
                projects={projects}
                totalTime={totalTime}
                yearMonth={yearMonth}
                invoicedFilter={invoiced}
                user={target.id}
              />
            ) : (
              <TimerAddServer
                user={target.id}
                projects={projects}
                resetFilter={
                  JSON.stringify(historyData) == "{}" && invoiced !== undefined
                }
              />
            )}
          </>
        ) : (
          <p className="font-mono font-bold text-xl">
            {t("Miscellaneous.userNotFound")}
          </p>
        )}
      </section>
    </Navigation>
  );
}
