"use client";

//#region Imports
import type { Role } from "@prisma/client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Ellipsis, Trash } from "lucide-react";
import { toast } from "sonner";

import { useTranslations } from "next-intl";
import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import useRequest from "@/lib/hooks/useRequest";

import { cn } from "@/lib/utils";
//#endregion

interface projectEditState {
	name: string;
	description: string;
}

export function ProjectEdit({
	project,
	role,
}: {
	project: {
		name: string;
		description: string | null;
		_count: {
			todos: number;
			times: number;
		};
	};
	role: Role;
}) {
	const t = useTranslations("Projects");
	const router = useRouter();

	const [visible, setVisible] = useState(false);

	const [data, setData] = useReducer(
		(prev: projectEditState, next: Partial<projectEditState>) => ({
			...prev,
			...next,
		}),
		{
			name: project.name,
			description: project.description ?? "",
		},
	);

	const { status: updateStatus, send: sendUpdate } = useRequest(
		(
			passed:
				| { name?: true | undefined; description?: true | undefined }
				| undefined,
		) => {
			const trimmedDescription = data.description.trim();
			return fetch("/api/project", {
				method: "PUT",
				body: JSON.stringify({
					name: project.name,
					newName: passed?.name ? data.name : undefined,
					description: passed?.description
						? trimmedDescription.length !== 0
							? trimmedDescription
							: null
						: undefined,
				}),
			});
		},
		(_result) => {
			toast.success(t("saved"));
			router.refresh();
		},
	);

	const { status: deleteStatus, send: sendDelete } = useRequest(
		() =>
			fetch("/api/project", {
				method: "DELETE",
				body: JSON.stringify({
					id: project.name,
				}),
			}),
		(_result) => {
			toast.success(t("deleted"));
			router.refresh();
		},
	);

	return (
		<>
			<CommandItem
				key={`projects-${project.name}`}
				className="font-mono rounded-md aria-selected:!bg-accent/20 border my-2 p-4 outline-none group"
			>
				<div className="w-full flex flex-row items-center justify-between">
					<div className="w-full">
						<h4 className="text-sm font-semibold">{project.name}</h4>
						{project.description && (
							<p className="text-xs text-muted-foreground flex flex-col">
								{project.description.split("\n").map((line) => (
									<span key={line}>{line}</span>
								))}
							</p>
						)}
						<div className="w-fit pt-3">
							<div className="flex flex-row items-center gap-1 text-xs">
								<Badge variant="secondary" className="font-normal">
									{t("times", { times: project._count.times })}
								</Badge>
								<Badge variant="secondary" className="font-normal">
									{t("todos", { todos: project._count.todos })}
								</Badge>
							</div>
						</div>
					</div>

					{role === "ADMIN" && (
						<div className="flex flex-col w-min gap-1 pr-1">
							<Button
								size="icon"
								variant="destructive"
								className="transition-all duration-150 opacity-0 group-hover:opacity-100"
								disabled={updateStatus.loading || deleteStatus.loading}
								onClick={() => sendDelete()}
							>
								<Trash className="w-4 h-4" />
							</Button>
						</div>
					)}
					<div className="flex flex-col w-min gap-1">
						<Button
							size="icon"
							variant="outline"
							className="transition-all duration-150 opacity-0 group-hover:opacity-100"
							disabled={updateStatus.loading || deleteStatus.loading}
							onClick={() => setVisible(!visible)}
						>
							<Ellipsis className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</CommandItem>

			<Dialog
				key={`dialog-${project.name}`}
				open={visible}
				onOpenChange={(e) => setVisible(e)}
			>
				<DialogContent
					onKeyDown={(e) => e.stopPropagation()}
					className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between"
				>
					<DialogHeader>
						<DialogTitle>
							<div>{t("Dialogs.Edit.title")}</div>
						</DialogTitle>
					</DialogHeader>

					<div className="w-full flex flex-col gap-2">
						<Tabs defaultValue="details">
							<TabsList className="flex w-full">
								<TabsTrigger className="w-full" value="details">
									{t("Dialogs.Edit.details")}
								</TabsTrigger>
							</TabsList>
							<TabsContent value="details">
								<ScrollArea
									className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="h-full w-full grid p-1 gap-1.5">
										<Label
											htmlFor={`name-${project.name}`}
											className={cn(
												"pl-2 text-muted-foreground transition-colors",
												data.name !== project.name ? "text-blue-500" : "",
											)}
										>
											{t("Dialogs.Edit.name")}
										</Label>
										<Input
											id={`name-${project.name}`}
											type="text"
											className="h-full border-2"
											spellCheck={true}
											value={data.name ?? ""}
											onChange={(e) => setData({ name: e.target.value })}
											onBlur={() => {
												if (data.name !== project.name)
													sendUpdate({ name: true });
											}}
										/>
									</div>
									<div className="h-1" />
									<div className="h-full w-full grid p-1 gap-1.5">
										<Label
											htmlFor={`description-${project.name}`}
											className={cn(
												"pl-2 text-muted-foreground transition-colors",
												data.description !== (project.description ?? "")
													? "text-blue-500"
													: "",
											)}
										>
											{t("Dialogs.Edit.description")}
										</Label>
										<Textarea
											id={`description-${project.name}`}
											className="h-full min-h-[20svh] max-h-[50svh] border-2"
											spellCheck={true}
											value={data.description}
											onChange={(e) => setData({ description: e.target.value })}
											onBlur={() => {
												if (data.description !== (project.description ?? ""))
													sendUpdate({ description: true });
											}}
										/>
									</div>
								</ScrollArea>
							</TabsContent>
						</Tabs>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
