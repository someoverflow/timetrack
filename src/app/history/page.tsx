// UI
import Navigation from "@/components/navigation";
import TimerSection from "./timer-section";

// Database
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Navigation
import { redirect } from "next/navigation";

// React
import type { Metadata } from "next";

// Utils
import { getTotalTime, months } from "@/lib/utils";
import { TimerAddServer } from "./timer-add";

type Timer = Prisma.TimeGetPayload<{
	include: { project: { select: { id: true; name: true } } };
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
	const session = await auth();
	if (!session || !session.user) return redirect("/signin");
	const user = session.user;

	const [history, projects] = await prisma.$transaction([
		prisma.time.findMany({
			orderBy: {
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
				users: {
					some: {
						id: {
							equals: user.id,
						},
					},
				},
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

	const timeStrings = (historyData[yearMonth] || [])
		.map((data) => data.time)
		.filter(Boolean); // Remove all undefined or null

	const totalTime =
		timeStrings.length === 0
			? "00:00:00"
			: getTotalTime(timeStrings as string[]);

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
						username={user.username}
					/>
				) : (
					<TimerAddServer username={user.username} projects={projects} />
				)}
			</section>
		</Navigation>
	);
}
