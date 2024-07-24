"use client";

//#region Imports
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Minus,
	Plus,
	SaveAll,
	Trash,
	RefreshCw,
	MoreHorizontal,
	Eye,
	Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import { useCallback, useReducer, useState } from "react";
import { useTranslations } from "next-intl";

import type { Prisma, Role } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import useRequest from "@/lib/hooks/useRequest";
//#endregion

type User = Prisma.UserGetPayload<{
	select: {
		id: true;
		username: true;
		name: true;
		email: true;
		role: true;

		createdAt: true;
		updatedAt: true;

		chips: true;
	};
}>;

interface userEditState {
	chipIndicator: string;
	username: string;
	name: string | null;
	mail: string | null;
	role: Role;
	password: string;
	chipAdd: string;
}
export default function UserEdit({ user }: { user: User }) {
	const [data, setData] = useReducer(
		(prev: userEditState, next: Partial<userEditState>) => ({
			...prev,
			...next,
		}),
		{
			chipIndicator: "",
			username: user.username,
			name: user.name ?? "",
			mail: user.email,
			role: user.role,
			password: "",
			chipAdd: "",
		},
	);
	const [visible, setVisible] = useState(false);

	const t = useTranslations("Admin.Users");

	const router = useRouter();

	const { status, send } = useRequest(
		useCallback(
			() =>
				fetch("/api/user", {
					method: "POST",
					body: JSON.stringify({
						id: user.id,
						username: data.username,
						name: data.name,
						mail: data.mail ?? undefined,
						role: data.role,
						password:
							data.password.trim().length === 0 ? undefined : data.password,
					}),
				}),
			[data, user.id],
		),
		(_request) => {
			setVisible(false);

			setData({
				password: "",
			});

			toast.success(t("updated"), {
				duration: 3_000,
			});
			router.refresh();
		},
		(_request, type) => {
			switch (type) {
				case "not-found":
					toast.success(t("updateNotFound"), {
						duration: 5_000,
					});
					return true;
				case "duplicate-found":
					toast.success(t("updateDuplicate"), {
						duration: 5_000,
					});
					return true;
				default:
					return false;
			}
		},
	);
	const { status: deleteStatus, send: sendDelete } = useRequest(
		() =>
			fetch("/api/user", {
				method: "DELETE",
				body: JSON.stringify({
					id: user.id,
				}),
			}),
		(_result) => {
			setVisible(false);

			setData({
				password: "",
			});

			toast.success(t("deleted"), {
				duration: 3_000,
			});
			router.refresh();
		},
	);

	const { status: chipCreateStatus, send: sendChipCreate } = useRequest(
		() =>
			fetch("/api/chip", {
				method: "POST",
				body: JSON.stringify({
					id: data.chipAdd,
					userId: user.id,
				}),
			}),
		(_result) => {
			setData({
				chipAdd: "",
			});

			toast.success(t("chipAdded"), {
				duration: 3_000,
			});
			router.refresh();
		},
	);
	const { status: chipDeleteStatus, send: sendChipDelete } = useRequest(
		(passed: { id: string } | undefined) => {
			setData({
				chipAdd: passed?.id,
			});
			return fetch("/api/chip", {
				method: "DELETE",
				body: JSON.stringify({
					id: passed?.id,
				}),
			});
		},
		(_result) => {
			setData({
				chipAdd: "",
			});

			toast.success(t("chipRemoved"), {
				duration: 3000,
			});
			router.refresh();
		},
	);

	const loading =
		status.loading ||
		deleteStatus.loading ||
		chipCreateStatus.loading ||
		chipDeleteStatus.loading;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => {
							setVisible(!visible);

							setData({
								username: user.username,
								name: user.name !== "?" ? user.name : "",
								mail: user.email,
								role: user.role,
								password: "",
							});
						}}
					>
						<Pencil className="mr-2 h-4 w-4" />
						{t("edit")}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Link href={`/history/${user.username}`}>
							<Eye className="mr-2 h-4 w-4" />
							{t("viewHistory")}
						</Link>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog
				key={`userModal-${user.id}`}
				open={visible}
				onOpenChange={(e) => setVisible(e)}
			>
				<DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
					<DialogHeader>
						<DialogTitle>
							<div>{t("Dialogs.Edit.title")}</div>
						</DialogTitle>
					</DialogHeader>

					<div className="w-full flex flex-col gap-2">
						<Tabs defaultValue="preferences">
							<TabsList className="grid w-full grid-cols-3 h-fit">
								<TabsTrigger value="preferences">
									{t("Dialogs.Edit.preferences")}
								</TabsTrigger>
								<TabsTrigger value="chips">
									{t("Dialogs.Edit.chips")}
								</TabsTrigger>
								<TabsTrigger value="details">
									{t("Dialogs.Edit.details")}
								</TabsTrigger>
							</TabsList>
							<TabsContent value="preferences">
								<ScrollArea
									className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="grid gap-4 p-1 w-full">
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="username"
												className={cn(
													"pl-2 text-muted-foreground transition-colors",
													user.username !== (data.username ?? "")
														? "text-blue-500"
														: "",
												)}
											>
												{t("Dialogs.Edit.username")}
											</Label>
											<Input
												className="w-full border-2"
												disabled={data.username === "admin"}
												type="text"
												name="Username"
												id="username"
												value={data.username}
												onChange={(e) => setData({ username: e.target.value })}
											/>
										</div>
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="name"
												className={cn(
													"pl-2 text-muted-foreground transition-colors",
													user.name !== (data.name ?? "")
														? "text-blue-500"
														: "",
												)}
											>
												{t("Dialogs.Edit.name")}
											</Label>
											<Input
												className="w-full border-2"
												type="text"
												name="Name"
												id="name"
												value={data.name ?? ""}
												onChange={(e) => setData({ name: e.target.value })}
											/>
										</div>

										<div id="divider" className="h-1" />

										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="mail"
												className={cn(
													"pl-2 text-muted-foreground transition-colors",
													(user.email ?? "") !== (data.mail ?? "")
														? "text-blue-500"
														: "",
												)}
											>
												{t("Dialogs.Edit.mail")}
											</Label>
											<Input
												className="w-full border-2"
												type="email"
												name="Mail"
												id="mail"
												value={data.mail ?? ""}
												onChange={(e) => setData({ mail: e.target.value })}
											/>
										</div>

										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="role"
												className={cn(
													"pl-2 text-muted-foreground transition-colors",
													user.role !== data.role ? "text-blue-500" : "",
												)}
											>
												{t("Dialogs.Edit.role")}
											</Label>
											<Select
												key="role"
												disabled={data.username === "admin"}
												value={data.role}
												onValueChange={(role) =>
													setData({
														role:
															role === "ADMIN" || role === "USER"
																? role
																: "USER",
													})
												}
											>
												<SelectTrigger id="role" className="w-full border-2">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="ADMIN">
														{t("Dialogs.Edit.roles.admin")}
													</SelectItem>
													<SelectItem value="USER">
														{t("Dialogs.Edit.roles.user")}
													</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div id="divider" className="h-1" />

										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="password"
												className={cn(
													"pl-2 text-muted-foreground transition-colors",
													data.password !== "" ? "text-blue-500" : "",
												)}
											>
												{t("Dialogs.Edit.password")}
											</Label>
											<Input
												className="w-full border-2"
												type="password"
												name="Password"
												id="password"
												placeholder={t("Dialogs.Edit.passwordPlaceholder")}
												value={data.password}
												onChange={(e) => setData({ password: e.target.value })}
											/>
										</div>
									</div>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="chips" className="h-full">
								<ScrollArea
									className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="grid gap-4 p-1 w-full">
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="chip"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Edit.addChip")}
											</Label>
											<div className="flex w-full items-center space-x-2">
												<Input
													className="w-full font-mono"
													type="text"
													name="Chip Add"
													id="chip"
													maxLength={50}
													value={data.chipAdd}
													onChange={(e) => setData({ chipAdd: e.target.value })}
												/>
												<div className="w-max">
													<Button
														disabled={loading}
														size="icon"
														onClick={() => sendChipCreate()}
													>
														{loading ? (
															<RefreshCw className="h-4 w-4 animate-spin" />
														) : (
															<Plus className="h-5 w-5" />
														)}
													</Button>
												</div>
											</div>
										</div>

										<div id="divider" className="h-1" />

										{user.chips.map((chip) => (
											<div
												key={`chip-list-${chip.id}`}
												className="flex w-full items-center space-x-2"
											>
												<div className="w-full rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
													{chip.id}
												</div>
												<div className="w-max">
													<Button
														disabled={loading}
														variant="secondary"
														size="icon"
														onClick={() => sendChipDelete({ id: chip.id })}
													>
														{loading && data.chipIndicator === chip.id ? (
															<RefreshCw className="h-4 w-4 animate-spin" />
														) : (
															<Minus className="h-5 w-5" />
														)}
													</Button>
												</div>
											</div>
										))}
									</div>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="details">
								<ScrollArea
									className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="grid gap-4 p-1 w-full">
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="updatedAt"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Edit.updated")}
											</Label>
											<Input
												disabled
												className="w-full font-mono"
												type="datetime-local"
												name="Updated At"
												id="updatedAt"
												value={user.updatedAt
													.toLocaleString("sv")
													.replace(" ", "T")}
											/>
										</div>
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="createdAt"
												className="pl-2 text-muted-foreground"
											>
												{t("Dialogs.Edit.created")}
											</Label>
											<Input
												disabled
												className="w-full font-mono"
												type="datetime-local"
												name="Created At"
												id="createdAt"
												value={user.createdAt
													.toLocaleString("sv")
													.replace(" ", "T")}
											/>
										</div>
										<div id="divider" className="h-1" />
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="id"
												className="pl-2 text-muted-foreground"
											>
												ID
											</Label>
											<Input
												disabled
												className="w-full border-2 font-mono"
												type="text"
												name="Id"
												id="id"
												value={user.id}
											/>
										</div>
									</div>
								</ScrollArea>
							</TabsContent>
						</Tabs>

						<div className="w-full gap-2 flex flex-row justify-end">
							<Button
								variant="destructive"
								onClick={() => sendDelete()}
								disabled={loading || user.username === "admin"}
							>
								{loading ? (
									<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Trash className="mr-2 h-4 w-4" />
								)}
								{t("Dialogs.Edit.delete")}
							</Button>
							<Button
								variant="outline"
								onClick={() => send()}
								disabled={loading}
							>
								{loading ? (
									<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<SaveAll className="mr-2 h-4 w-4" />
								)}
								{t("Dialogs.Edit.save")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
