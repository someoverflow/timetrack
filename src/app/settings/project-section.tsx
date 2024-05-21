"use client";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
		where: {
			users: {
				some: {
					id: "",
				},
			},
		},
		include: {
			_count: true,
			todos: true,
			times: true,
		},
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
	adminProjects: ({
		users: {
			id: string;
			name: string | null;
			username: string;
		}[];
	} & {
		id: string;
		name: string;
		description: string | null;
	})[];
	userData: {
		id?: string;
		username: string;
		name?: string | null | undefined;
		role: string;
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

	async function createProject() {
		setData({
			loading: true,
		});

		const result = await fetch("/api/project", {
			method: "POST",
			body: JSON.stringify({
				name: search,
				userId: [userData.id],
			}),
		});

		setData({
			loading: false,
		});

		const resultData: APIResult = await result.json().catch(() => {
			toast.error("An error occurred", {
				description: "Result could not be proccessed",
				important: true,
				duration: 8000,
			});
			return;
		});

		if (resultData.success) {
			toast.success("Successfully created project.");
			setSearch("");
			router.refresh();
			return;
		}

		switch (resultData.type) {
			case "validation":
				toast.warning(`An error occurred (${resultData.result[0].code})`, {
					description: resultData.result[0].message,
					important: true,
					duration: 5000,
				});
				break;
			default:
				toast.error(`An error occurred (${resultData.type ?? "unknown"})`, {
					description: "Error could not be identified. You can try again.",
					important: true,
					duration: 8000,
				});
				break;
		}
	}

	async function deleteProject(id: string) {
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

		const resultData: APIResult = await result.json().catch(() => {
			toast.error("An error occurred", {
				description: "Result could not be proccessed",
				important: true,
				duration: 8000,
			});
			return;
		});

		if (resultData.success) {
			toast.success("Successfully deleted project.");
			router.refresh();
			return;
		}

		switch (resultData.type) {
			case "validation":
				toast.warning(`An error occurred (${resultData.result[0].code})`, {
					description: resultData.result[0].message,
					important: true,
					duration: 5000,
				});
				break;
			default:
				toast.error(`An error occurred (${resultData.type ?? "unknown"})`, {
					description: "Error could not be identified. You can try again.",
					important: true,
					duration: 8000,
				});
				break;
		}
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
									<div className="flex flex-row gap-2 items-center">
										<h4 className="text-sm font-semibold">{project.name}</h4>
										<Badge variant="default" className="text-xs">
											{project.id}
										</Badge>
									</div>
									<div className="w-fit">
										<Separator className="mt-2 mb-4 w-full" />
										<div className="flex flex-row items-center gap-1 text-xs">
											<Badge variant="secondary" className="font-normal">
												Users: {project._count.users}
											</Badge>
											<Badge variant="secondary" className="font-normal">
												Times: {project._count.times}
											</Badge>
											<Badge variant="secondary" className="font-normal">
												Todos: {project._count.todos}
											</Badge>
										</div>
									</div>
								</div>

								<div className="flex flex-col w-min gap-1">
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
				{adminProjects.length !== 0 && (
					<CommandGroup heading="All Projects">
						{adminProjects.map(({ id, description, name, users }) => (
							<CommandItem
								key={`all-projects-${id}`}
								className="font-mono aria-selected:!bg-accent/20 rounded-md border my-2 p-4 outline-none group"
							>
								<div className="w-full flex flex-row items-center justify-between">
									<div className="w-full">
										<div className="absolute right-3 top-3 ">
											<Tooltip delayDuration={300}>
												<TooltipTrigger>
													<Badge variant="default" className="text-xs">
														{id}
													</Badge>
												</TooltipTrigger>
												{/* TODO: Add functionallity */}
												<TooltipContent>Merge Project</TooltipContent>
											</Tooltip>
										</div>
										<h4 className="text-sm font-semibold">{name}</h4>
										{/* TODO: Styling */}
										<p>{description}</p>
										<div className="flex flex-wrap gap-1 pt-2 text-xs text-muted-foreground items-center">
											{users.map((user) => (
												<Badge
													variant="outline"
													key={`all-projects-${id}-${user.id}`}
												>
													{user.username}
												</Badge>
											))}
											<Badge
												variant="secondary"
												key={`all-projects-${id}-add`}
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
