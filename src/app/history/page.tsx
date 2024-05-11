// UI
import Navigation from "@/components/navigation";
import TimerSection from "./timer-section";

// Database
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// Navigation
import { redirect } from "next/navigation";

// React
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

// Utils
import { getTotalTime } from "@/lib/utils";
import { authOptions } from "@/lib/auth";
import { TimerAddServer } from "./timer-add";

type Timer = Prisma.timeGetPayload<{
	include: { project: { select: { id: true; name: true } } };
}>;
interface Data {
	[yearMonth: string]: Timer[];
}
const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

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

export const metadata: Metadata = {
	title: "Time Track - History",
	description: "Track your Time",
};

export default async function History({
	searchParams,
}: {
	searchParams?: {
		query?: string;
		ym?: string;
	};
}) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) return redirect("/signin");
	const user = session.user;

	const [history, projects] = await prisma.$transaction([
		prisma.time.findMany({
			orderBy: {
				//id: "desc",
				start: "desc",
			},
			where: {
				userId: user.id,
			},
			include: {
				project: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		}),
		prisma.project.findMany({
			where: {
				userId: user.id,
			},
			select: {
				id: true,
				name: true,
			},
		}),
	]);

	function dataFound(): boolean {
		if (history.length === 0) return false;
		return !(history.length === 1 && history[0].end == null);
	}

	const historyData = formatHistory(history);

	let yearMonth = searchParams?.ym;
	if (!yearMonth || !Object.keys(historyData).includes(yearMonth))
		yearMonth = Object.keys(historyData)[0];

	const timeStrings: string[] = [];
	try {
		for (const data of historyData[yearMonth]) {
			if (data.time) timeStrings.push(data.time);
		}
	} catch (e) {}
	const totalTime =
		timeStrings.length === 0 ? "00:00:00" : getTotalTime(timeStrings);

	return (
		<Navigation>
			<section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
				<div className="w-full font-mono text-center pt-2">
					<p className="text-2xl font-mono">History</p>
				</div>

				{dataFound() ? (
					<TimerSection
						history={historyData}
						projects={projects}
						totalTime={totalTime}
						yearMonth={yearMonth}
						tag={user.tag}
					/>
				) : (
					<TimerAddServer tag={user.tag} />
				)}
			</section>
		</Navigation>
	);
}
