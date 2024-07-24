//#region Imports
import Navigation from "@/components/navigation";
import TimerSection from "./timer-section";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
//#endregion

export default async function Home() {
	const session = await auth();
	if (!session || !session.user) return redirect("/signin");
	const user = session.user;

	const projects = await prisma.project.findMany({
		select: { name: true },
	});

	return (
		<Navigation>
			<section className="min-h-[70svh] flex flex-col items-center justify-center gap-4">
				{user.name && (
					<h1 className="text-2xl font-mono text-content3">{user.name}</h1>
				)}
				<TimerSection projects={projects} />
			</section>
		</Navigation>
	);
}
