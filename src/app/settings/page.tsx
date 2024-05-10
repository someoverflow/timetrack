// UI
import Navigation from "@/components/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectSection } from "./project-section";
import ProfileSection from "./profile-section";

// Auth
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function Profile() {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) return redirect("/signin");
	const user = session.user;

	const projects = await prisma.project.findMany({
		where: {
			userId: user.id,
		},
		include: {
			relatedTodos: true,
			times: true,
		},
	});

	return (
		<Navigation>
			<section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
				<div className="w-full font-mono text-center pt-2">
					<p className="text-2xl font-mono">Settings</p>
				</div>

				<section className="w-full max-w-md max-h-[90svh] overflow-hidden flex flex-col items-start animate__animated animate__fadeIn">
					<Tabs defaultValue="profile" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="profile">Profile</TabsTrigger>
							<TabsTrigger value="projects">Projects</TabsTrigger>
						</TabsList>
						<TabsContent value="profile">
							<ProfileSection userData={user} />
						</TabsContent>
						<TabsContent value="projects">
							<ScrollArea
								className="h-[calc(80svh-80px)] w-full rounded-sm border p-1.5 overflow-hidden"
								type="scroll"
							>
								<ProjectSection projects={projects} userData={user} />
							</ScrollArea>
						</TabsContent>
					</Tabs>
				</section>
			</section>
		</Navigation>
	);
}
