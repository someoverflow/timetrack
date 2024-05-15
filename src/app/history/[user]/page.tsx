//UI
import Navigation from "@/components/navigation";
import TimerSection from "../timer-section";

// Navigation
import { redirect } from "next/navigation";

// Auth
import { auth } from "@/lib/auth";

// Database
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// React
import type { Metadata } from "next";

// Utils
import { getTotalTime, months } from "@/lib/utils";
import { TimerAddServer } from "../timer-add";
import { badgeVariants } from "@/components/ui/badge";

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
	params,
}: {
	searchParams?: {
		query?: string;
		ym?: string;
		user: string;
	};
	params: { user: string };
}) {
	const session = await auth();
	if (!session || !session.user) return redirect("/signin");
	if (session.user.role !== "ADMIN") redirect("/history");

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
				//id: "desc",
				start: "desc",
			},
			where: {
				userId: target?.id,
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
							equals: target?.id,
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
		if (!history) return false;
		if (history.length === 0) return false;
		return !(history.length === 1 && history[0].end == null);
	}

	const historyData = history ? formatHistory(history) : {};

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
					<p className="text-2xl font-mono">
						History
						<span
							className={badgeVariants({
								variant: "secondary",
								className: "absolute",
							})}
						>
							{target ? target?.name ?? target?.username : searchParams?.user}
						</span>
					</p>
				</div>

				{target ? (
					<>
						{dataFound() && historyData != null ? (
							<TimerSection
								history={historyData}
								projects={projects}
								totalTime={totalTime}
								yearMonth={yearMonth}
								username={target.username}
							/>
						) : (
							<TimerAddServer username={target.username} />
						)}
					</>
				) : (
					<p className="font-mono font-bold text-4xl">User not found</p>
				)}
			</section>
		</Navigation>
	);
}
