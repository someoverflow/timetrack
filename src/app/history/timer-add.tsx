"use client";

// UI
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ListPlus, SaveAll } from "lucide-react";
import { toast } from "sonner";

// Navigation
import { useRouter } from "next/navigation";

// React
import { useReducer, useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface timerAddState {
	start: string;
	end: string;
	notes: string;
	loading: boolean;
}

export default function TimerAdd({
	username,
	visible,
	setVisible,
}: {
	username: string;
	visible: boolean;
	setVisible: (visible: boolean) => void;
}) {
	const [data, setData] = useReducer(
		(prev: timerAddState, next: Partial<timerAddState>) => ({
			...prev,
			...next,
		}),
		{
			start: new Date().toLocaleString("sv").replace(" ", "T"),
			end: new Date().toLocaleString("sv").replace(" ", "T"),
			notes: "",
			loading: false,
		},
	);

	const router = useRouter();

	async function sendRequest() {
		setData({
			loading: true,
		});

		const result = await fetch("/api/times", {
			method: "POST",
			body: JSON.stringify({
				username: username,
				notes: data.notes,
				start: new Date(data.start).toISOString(),
				end: new Date(data.end).toISOString(),
				startType: "Website",
				endType: "Website",
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
			setData({
				start: new Date().toLocaleString("sv").replace(" ", "T"),
				end: new Date().toLocaleString("sv").replace(" ", "T"),
				notes: "",
			});
			setVisible(false);

			toast.success("Successfully created new entry", {
				duration: 3000,
			});
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
		<Dialog
			key="timerModal-add"
			open={visible}
			onOpenChange={(e) => setVisible(e)}
		>
			<DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
				<DialogHeader>
					<DialogTitle>
						<div>Create entry</div>
					</DialogTitle>
				</DialogHeader>

				<div className="w-full flex flex-col gap-2">
					<Tabs defaultValue="time">
						<TabsList className="grid w-full grid-cols-2 h-fit">
							<TabsTrigger value="notes">Notes</TabsTrigger>
							<TabsTrigger value="time">Time</TabsTrigger>
						</TabsList>
						<TabsContent value="notes">
							<ScrollArea
								className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
								type="always"
							>
								<div className="h-full w-full grid p-1 gap-1.5">
									<Label
										htmlFor="timerModal-notes-add"
										className="text-muted-foreground pl-2"
									>
										Notes
									</Label>
									<Textarea
										id="timerModal-notes-add"
										className={`h-full min-h-[30svh] max-h-[50svh] border-2 transition duration-300 ${
											data.notes !== (data.notes ?? "") && "border-sky-700"
										}`}
										spellCheck={true}
										value={data.notes}
										onChange={(e) => setData({ notes: e.target.value })}
									/>
								</div>
							</ScrollArea>
						</TabsContent>
						<TabsContent value="time" className="h-full">
							<ScrollArea
								className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
								type="always"
							>
								<div className="grid gap-4 p-1 w-full">
									<div className="grid w-full items-center gap-1.5">
										<Label
											htmlFor="name"
											className="pl-2 text-muted-foreground"
										>
											Start
										</Label>
										<Input
											className="!w-full font-mono border-2 transition-all duration-300"
											type="datetime-local"
											name="Updated"
											id="updated"
											step={1}
											value={data.start}
											onChange={(e) => setData({ start: e.target.value })}
										/>
									</div>
									<div className="grid w-full items-center gap-1.5">
										<Label
											htmlFor="username"
											className="pl-2 text-muted-foreground"
										>
											End
										</Label>
										<Input
											className="w-full font-mono border-2 transition-all duration-300"
											type="datetime-local"
											name="Created"
											id="created"
											step={1}
											value={data.end}
											onChange={(e) => setData({ end: e.target.value })}
										/>
									</div>
								</div>
							</ScrollArea>
						</TabsContent>
					</Tabs>

					<div className="w-full gap-2 flex flex-row justify-end">
						<Button
							variant="outline"
							onClick={() => sendRequest()}
							disabled={data.loading}
						>
							<SaveAll className="mr-2 h-4 w-4" />
							Create Entry
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function TimerAddServer({ username }: { username: string }) {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useReducer(
		(prev: timerAddState, next: Partial<timerAddState>) => ({
			...prev,
			...next,
		}),
		{
			start: new Date().toLocaleString("sv").replace(" ", "T"),
			end: new Date().toLocaleString("sv").replace(" ", "T"),
			notes: "",
			loading: false,
		},
	);

	const router = useRouter();

	async function sendRequest() {
		setData({
			loading: true,
		});

		const result = await fetch("/api/times", {
			method: "POST",
			body: JSON.stringify({
				username: username,
				notes: data.notes,
				start: new Date(data.start).toUTCString(),
				end: new Date(data.end).toUTCString(),
				startType: "Website",
				endType: "Website",
			}),
		});

		setData({
			loading: false,
		});

		if (result.ok) {
			setData({
				start: new Date().toLocaleString("sv").replace(" ", "T"),
				end: new Date().toLocaleString("sv").replace(" ", "T"),
				notes: "",
			});
			setVisible(false);

			toast.success("Successfully created new entry", {
				duration: 3000,
			});
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
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant="outline" onClick={() => setVisible(!visible)}>
						<ListPlus className="mr-2 h-5 w-5" />
						Add the first entry
					</Button>
				</TooltipTrigger>

				<TooltipContent>
					<p>We have not found any data.</p>
					<p>You can create a new entry here</p>
					<p>manually or start the timer.</p>
				</TooltipContent>
			</Tooltip>
			<Dialog
				key="timerModal-add"
				open={visible}
				onOpenChange={(e) => setVisible(e)}
			>
				<DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
					<DialogHeader>
						<DialogTitle>
							<div>Create entry</div>
						</DialogTitle>
					</DialogHeader>

					<div className="w-full flex flex-col gap-2">
						<Tabs defaultValue="time">
							<TabsList className="grid w-full grid-cols-2 h-fit">
								<TabsTrigger value="notes">Notes</TabsTrigger>
								<TabsTrigger value="time">Time</TabsTrigger>
							</TabsList>
							<TabsContent value="notes">
								<ScrollArea
									className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="h-full w-full grid p-1 gap-1.5">
										<Label
											htmlFor="timerModal-notes-add"
											className="text-muted-foreground pl-2"
										>
											Notes
										</Label>
										<Textarea
											id="timerModal-notes-add"
											className={`h-full min-h-[30svh] max-h-[50svh] border-2 transition duration-300 ${
												data.notes !== (data.notes ?? "") && "border-sky-700"
											}`}
											spellCheck={true}
											value={data.notes}
											onChange={(e) => setData({ notes: e.target.value })}
										/>
									</div>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="time" className="h-full">
								<ScrollArea
									className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
									type="always"
								>
									<div className="grid gap-4 p-1 w-full">
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="name"
												className="pl-2 text-muted-foreground"
											>
												Start
											</Label>
											<Input
												className="!w-full font-mono border-2 transition-all duration-300"
												type="datetime-local"
												name="Updated"
												id="updated"
												step={1}
												value={data.start}
												onChange={(e) => setData({ start: e.target.value })}
											/>
										</div>
										<div className="grid w-full items-center gap-1.5">
											<Label
												htmlFor="username"
												className="pl-2 text-muted-foreground"
											>
												End
											</Label>
											<Input
												className="w-full font-mono border-2 transition-all duration-300"
												type="datetime-local"
												name="Created"
												id="created"
												step={1}
												value={data.end}
												onChange={(e) => setData({ end: e.target.value })}
											/>
										</div>
									</div>
								</ScrollArea>
							</TabsContent>
						</Tabs>

						<div className="w-full gap-2 flex flex-row justify-end">
							<Button
								variant="outline"
								onClick={() => sendRequest()}
								disabled={data.loading}
							>
								<SaveAll className="mr-2 h-4 w-4" />
								Create Entry
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
