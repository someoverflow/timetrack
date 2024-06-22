import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommandItem } from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import { Ellipsis, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
import { toast } from "sonner";

interface projectEditState {
	loading: boolean;

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
			loading: false,

			name: project.name,
			description: project.description ?? "",
		},
	);

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

	async function change(name: boolean) {
		setData({
			loading: true,
		});

		const trimmedDescription = data.description.trim();

		const result = await fetch("/api/project", {
			method: "PUT",
			body: JSON.stringify({
				name: project.name,
				newName: name ? data.name : undefined,
				description: !name
					? trimmedDescription.length !== 0
						? trimmedDescription
						: null
					: undefined,
			}),
		});

		if (name) setData({ name: data.name });
		if (!name) setData({ name: data.name });

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
			toast.success("Successfully saved.");
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
								disabled={data.loading}
								onClick={() => deleteProject(project.name)}
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
							disabled={data.loading}
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
												if (data.name !== project.name) change(true);
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
													change(false);
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
