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
import type { Prisma, Role } from "@prisma/client";
import { Plus, RefreshCw, Trash } from "lucide-react";
import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ProjectEdit } from "./project-edit";

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
	const t = useTranslations("Projects");

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

	return (
		<Command className="h-full">
			<div className="flex flex-row items-center gap-2 p-2">
				<div className="w-full p-1 px-2">
					<CommandInput
						placeholder={t("searchPlaceholder")}
						className="h-8"
						onValueChange={setSearch}
						value={search}
					/>
				</div>
				<div className="w-max h-full">
					<Button
						disabled={data.loading || search === ""}
						className={cn(
							"transition-all duration-200",
							search === "" && "w-0",
						)}
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
					heading={t("projects", { projects: projects.length })}
					forceMount={projects.length === 0}
				>
					{projects.length === 0 && (
						<div className="py-6 text-center text-sm">
							<p>{t("noProjects")}</p>
						</div>
					)}
					{projects.map((project) => (
						<ProjectEdit
							key={`edit-${project.name}`}
							project={project}
							role={userData.role as Role}
						/>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}
