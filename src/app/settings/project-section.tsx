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
		include: {
			_count: true,
		},
	});
}
type userProjects = Prisma.PromiseReturnType<typeof getUserProjects>;

interface projectSectionState {
	loading: boolean;
}

export function ProjectSection({
	projects,
	userData,
}: {
	projects: userProjects;
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
			case "duplicate-found":
				toast.warning(`An error occurred (${resultData.type})`, {
					description: resultData.result.message,
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
					heading={`Projects (${projects.length})`}
					forceMount={projects.length === 0}
				>
					{projects.length === 0 && (
						<div className="py-6 text-center text-sm">
							<p>No project found.</p>
							<p>Create a new project now!</p>
						</div>
					)}
					{/* TODO: Interaction & Description & Renaming */}
					{projects.map((project) => (
						<CommandItem
							key={`projects-${project.name}`}
							className="font-mono rounded-md aria-selected:!bg-accent/20 border my-2 p-4 outline-none group"
						>
							<div className="w-full flex flex-row items-center justify-between">
								<div className="w-full">
									<h4 className="text-sm font-semibold">{project.name}</h4>
									<div className="w-fit">
										<Separator className="mt-2 mb-4 w-full" />
										<div className="flex flex-row items-center gap-1 text-xs">
											<Badge variant="secondary" className="font-normal">
												Times: {project._count.times}
											</Badge>
											<Badge variant="secondary" className="font-normal">
												Todos: {project._count.todos}
											</Badge>
										</div>
									</div>
								</div>

								{userData.role === "ADMIN" && (
									<div className="flex flex-col w-min gap-1">
										<Button
											size="icon"
											variant="destructive"
											className="transition-all duration-150 opacity-0 group-hover:opacity-100"
											disabled={data.loading}
											onClick={() => deleteProject(project.name)}
										>
											<Trash className="w-4 h-4" />
										</Button>
									</div>
								)}
							</div>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}
