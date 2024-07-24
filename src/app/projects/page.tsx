//#region Imports
import Navigation from "@/components/navigation";
import { ProjectSection } from "./project-section";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
//#endregion

export async function generateMetadata() {
	const t = await getTranslations({ namespace: "Projects.Metadata" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function Profile() {
	const session = await auth();
	if (!session || !session.user) return redirect("/signin");
	const user = session.user;

	const t = await getTranslations("Projects");

	const projects = await prisma.project.findMany({
		include: {
			_count: true,
		},
	});

	return (
		<Navigation>
			<section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
				<div className="w-full font-mono text-center pt-2">
					<p className="text-2xl font-mono">{t("title")}</p>
				</div>

				<section className="w-full max-w-md max-h-[90svh] overflow-hidden flex flex-col items-start animate__animated animate__fadeIn">
					<ProjectSection projects={projects} userData={user} />
				</section>
			</section>
		</Navigation>
	);
}
