//UI
import Navigation from "@/components/navigation";
import TimerSection from "../timer-section";

// Navigation
import { redirect } from "next/navigation";

// Auth
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Database
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// React
import type { Metadata } from "next";

// Utils
import { getTotalTime, months } from "@/lib/utils";
import { TimerAddServer } from "../timer-add";

type Timer = Prisma.timeGetPayload<{ [k: string]: never }>;
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
	const session = await getServerSession(authOptions);
	if (!session || !session.user) return redirect("/signin");

	const user = await prisma.user.findUnique({
		where: {
			id: session.user.id,
		},
	});

	if (!user) return redirect("/");
	if (user.role !== "admin") redirect("/history");

	const target = await prisma.user
		.findUnique({
			where: {
				tag: params.user,
			},
			select: {
				id: true,
				tag: true,
				name: true,
			},
		})
		.catch(() => null);

	const history = await prisma.time
		.findMany({
			orderBy: {
				//id: "desc",
				start: "desc",
			},
			where: {
				userId: target?.id,
			},
		})
		.catch(() => null);

	function dataFound(): boolean {
		if (!history) return false;
		if (history.length === 0) return false;
		return !(history.length === 1 && history[0].end == null);
	}

	const historyData = history ? formatHistory(history) : null;

	const timeStrings: string[] = [];
	if (historyData) {
		if (searchParams?.ym) {
			for (const data of historyData[searchParams.ym]) {
				if (data.time) timeStrings.push(data.time);
			}
		}
	}
	const totalTime =
		timeStrings.length === 0 ? "00:00:00" : getTotalTime(timeStrings);

	return (
		<Navigation>
			<section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
				<div className="w-full font-mono text-center pt-2">
					<p className="text-2xl font-mono">{`History of ${
						target ? target.name : "?"
					}`}</p>
				</div>

				{target ? (
					<>
						{dataFound() && historyData != null ? (
							<TimerSection
								history={historyData}
								totalTime={totalTime}
								tag={target.tag}
							/>
						) : (
							<TimerAddServer tag={target.tag} />
						)}
					</>
				) : (
					<p className="font-mono font-bold text-4xl">User not found</p>
				)}
			</section>
		</Navigation>
	);
}
