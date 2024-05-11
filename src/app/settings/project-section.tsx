"use client";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Plus, RefreshCw, Trash } from "lucide-react";
import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

async function getUserProjects() {
	return await prisma.project.findMany({
		include: { relatedTodos: true, times: true },
	});
}
type userProjects = Prisma.PromiseReturnType<typeof getUserProjects>;

interface projectSectionState {
	loading: boolean;
}

export function ProjectSection({
	projects,
	adminProjects,
	userData,
}: {
	projects: userProjects;
	adminProjects: {
		[name: string]: {
			users: Partial<{ id: number; tag: string; name: string }>[];
		};
	};
	userData: {
		id: number;
		tag: string;
		role: string;
		name?: string | null | undefined;
	};
}) {
	const [data, setData] = useReducer(
		(prev: projectSectionState, next: Partial<projectSectionState>) => ({
			...prev,
			...next,
		}),
		{
			loading: false,
		},
	);

	const [search, setSearch] = useState("");

	const router = useRouter();

	const adminProjectsKeys = Object.keys(adminProjects);

	async function createProject() {
		setData({
			loading: true,
		});

		const result = await fetch("/api/project", {
			method: "POST",
			body: JSON.stringify({
				name: search,
				userId: userData.id,
			}),
		});

		setData({
			loading: false,
		});

		if (result.ok) {
			toast.success("Successfully created project.");
			setSearch("");
			router.refresh();
			return;
		}

		const resultData: APIResult = await result.json().catch(() => {
			toast.error("An error occurred", {
				description: "Result could not be proccessed",
				important: true,
				duration: 8000,
			});
			return;
		});
		if (!resultData) return;

		if (result.status === 400 && !!resultData.result[1]) {
			toast.warning(`An error occurred (${resultData.result[0]})`, {
				description: resultData.result[1],
				important: true,
				duration: 10000,
			});
			return;
		}

		toast.error("An error occurred", {
			description: "Error could not be identified. You can try again.",
			important: true,
			duration: 8000,
		});
	}

	async function deleteProject(id: number) {
		setData({
			loading: true,
		});

		const result = await fetch("/api/project", {
			method: "DELETE",
			body: JSON.stringify({
				id: id,
			}),
		});

		setData({
			loading: false,
		});

		if (result.ok) {
			toast.success("Successfully deleted project.");
			router.refresh();
			return;
		}

		const resultData: APIResult = await result.json().catch(() => {
			toast.error("An error occurred", {
				description: "Result could not be proccessed",
				important: true,
				duration: 8000,
			});
			return;
		});
		if (!resultData) return;

		if (result.status === 400 && !!resultData.result[1]) {
			toast.warning(`An error occurred (${resultData.result[0]})`, {
				description: resultData.result[1],
				important: true,
				duration: 10000,
			});
			return;
		}

		toast.error("An error occurred", {
			description: "Error could not be identified. You can try again.",
			important: true,
			duration: 8000,
		});
	}

	return (
		<Command className="h-full">
			<div className="flex flex-row items-center gap-2 p-2">
				<div className="w-full p-1 px-2">
					<CommandInput
						placeholder="Search or add input"
						className="h-8"
						onValueChange={setSearch}
						value={search}
					/>
				</div>
				<div className="w-max h-full">
					<Button
						disabled={data.loading}
						size="icon"
						onClick={() => createProject()}
					>
						{data.loading ? (
							<RefreshCw className="h-4 w-4 animate-spin" />
						) : (
							<Plus className="h-5 w-5" />
						)}
					</Button>
				</div>
			</div>
			<CommandList className="max-h-none h-full">
				<CommandGroup
					heading="Your Projects"
					forceMount={projects.length === 0}
				>
					{projects.length === 0 && (
						<div className="py-6 text-center text-sm">
							<p>No project found.</p>
							<p>Create a new project now!</p>
						</div>
					)}
					{/* TODO: Project Merging & Renaming */}
					{projects.map((project) => (
						<CommandItem
							key={`own-projects-${project.id}`}
							className="font-mono rounded-md aria-selected:!bg-accent/20 border my-2 p-4 outline-none group"
						>
							<div className="w-full flex flex-row items-center justify-between">
								<div className="w-full">
									<h4 className="text-sm font-semibold">{project.name}</h4>
									<div className="w-fit">
										<Separator className="mt-2 mb-4 w-full" />
										<div className="flex flex-row items-center gap-1 text-xs">
											<Badge variant="secondary" className="font-normal">
												Times: {project.times.length}
											</Badge>
											<Badge variant="secondary" className="font-normal">
												Todos: {project.relatedTodos.length}
											</Badge>
										</div>
									</div>
								</div>
								<div className="flex flex-col w-min gap-1 ">
									<Button
										size="icon"
										variant="destructive"
										className="transition-all duration-150 opacity-0 group-hover:opacity-100"
										disabled={data.loading}
										onClick={() => deleteProject(project.id)}
									>
										<Trash className="w-4 h-4" />
									</Button>
								</div>
							</div>
						</CommandItem>
					))}
				</CommandGroup>

				{/* TODO: Interaction & Description */}
				{adminProjectsKeys.length !== 0 && (
					<CommandGroup heading="All Projects">
						{adminProjectsKeys.map((projectName) => (
							<CommandItem
								key={`all-projects-${projectName}`}
								className="font-mono aria-selected:!bg-accent/20 rounded-md border my-2 p-4 outline-none group"
							>
								<div className="w-full flex flex-row items-center justify-between">
									<div className="w-full">
										<h4 className="text-sm font-semibold">{projectName}</h4>
										<div className="flex flex-wrap gap-1 pt-2 text-xs text-muted-foreground items-center">
											{adminProjects[projectName].users.map((user) => (
												<Badge
													variant="outline"
													key={`all-projects-${projectName}-${user.id}`}
												>
													{user.tag}
												</Badge>
											))}
											<Badge
												variant="secondary"
												key={`all-projects-${projectName}-add`}
												className="h-6 w-6 p-0 items-center justify-center"
											>
												{/* Button to add this project to other users */}
												<Plus className="w-3 h-3" />
											</Badge>
										</div>
									</div>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				)}
			</CommandList>
		</Command>
	);
}
