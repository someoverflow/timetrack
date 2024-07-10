//#region Imports
import type { Prisma } from "@prisma/client";

import Navigation from "@/components/navigation";
import TimerSection from "./timer-section";
import { TimerAddServer } from "./timer-add";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

import { redirect } from "next/navigation";
import { sumTimes, months } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
//#endregion

type Timer = Prisma.TimeGetPayload<{
	include: { project: true };
}>;
interface Data {
	[yearMonth: string]: Timer[];
}

function formatHistory(data: Timer[]): Data {
	const result: Data = {};

	for (const item of data) {
		const date = new Date(item.start);
		const year = date.getFullYear();
		const month = months[date.getMonth()];

		if (!result[`${year} ${month}`]) result[`${year} ${month}`] = [];
		result[`${year} ${month}`].push(item);
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
	const session = await auth();
	if (!session || !session.user) return redirect("/signin");
	const user = session.user;

	const t = await getTranslations("History");

	const cookieStore = cookies();

	const invoicedCookie = cookieStore.get("invoiced")?.value;
	const invoiced = [undefined, "true", "false"].includes(invoicedCookie)
		? invoicedCookie
			? invoicedCookie === "true"
			: undefined
		: undefined;

	const [history, projects] = await prisma.$transaction([
		prisma.time.findMany({
			orderBy: {
				start: "desc",
			},
			where: {
				userId: user.id,
				invoiced: invoiced,
			},
			include: {
				project: true,
			},
		}),
		prisma.project.findMany(),
	]);

	const historyData = formatHistory(history);

	let yearMonth = searchParams?.ym;
	if (!yearMonth || !Object.keys(historyData).includes(yearMonth))
		yearMonth = Object.keys(historyData)[0];

	const timeStrings = (historyData[yearMonth] ?? [])
		.filter((data) => data.time !== null)
		.map((e) => e.time);
	const totalTime =
		timeStrings.length !== 0 ? sumTimes(timeStrings as string[]) : "00:00:00";

	return (
		<Navigation>
			<section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
				<div className="w-full font-mono text-center pt-2">
					<p className="text-2xl font-mono">{t("PageTitle")}</p>
				</div>

				{history.length !== 0 ? (
					<TimerSection
						history={historyData}
						projects={projects}
						totalTime={totalTime}
						yearMonth={yearMonth}
						invoicedFilter={invoiced}
						user={user.id ?? ""}
					/>
				) : (
					<TimerAddServer user={user.id ?? ""} projects={projects} />
				)}
			</section>
		</Navigation>
	);
}
