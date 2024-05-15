"use client";

// UI
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SaveAll } from "lucide-react";

// React
import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { signOut, useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface profileSectionState {
	loading: boolean;
	name: string | undefined;
	mail: string | undefined;
	password: string;
}

export default function ProfileSection({
	userData,
}: {
	userData: {
		id?: string;
		username: string;
		role: string;
		name?: string | null | undefined;
		email?: string | null | undefined;
	};
}) {
	const [data, setData] = useReducer(
		(prev: profileSectionState, next: Partial<profileSectionState>) => ({
			...prev,
			...next,
		}),
		{
			loading: false,
			name: userData.name ?? "",
			mail: userData.email ?? "",
			password: "",
		},
	);

	const router = useRouter();

	const { update } = useSession();

	async function updateData() {
		setData({
			loading: true,
		});

		const changePassword = data.password !== "";
		const result = await fetch("/api/profile", {
			method: "PUT",
			body: JSON.stringify({
				name: data.name !== userData.name ? data.name : undefined,
				mail: data.mail !== userData.email ? data.mail : undefined,
				password: changePassword ? data.password : undefined,
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
			if (changePassword) {
				toast.success("Successfully updated profile.", {
					description: "Password changed. Please sign in again.",
					duration: 3000,
				});
				signOut();
				return;
			}

			toast.success("Successfully updated profile.", {
				description: "Session is getting updated",
				duration: 3000,
			});

			await update({
				name: resultData.result.name,
				email: resultData.result.email,
				username: resultData.result.username,
				validJwtId: resultData.result.validJwtId,
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
		<Card className="w-full">
			<div className="flex flex-row">
				<CardHeader className="w-full">
					<CardTitle>Profile</CardTitle>
					<CardDescription>
						<span>Make changes to your profile here.</span>
					</CardDescription>
				</CardHeader>
				<div className="flex flex-col space-y-1.5 p-6 text-right">
					<Badge variant="default">{userData.username}</Badge>
				</div>
			</div>

			<Separator className="w-full" />

			<CardContent className="py-6">
				<div className="flex flex-col gap-4 py-2">
					<div className="grid w-full items-center gap-1.5">
						<Label htmlFor="input-name">Name</Label>
						<Input
							type="text"
							name="Name"
							id="input-name"
							placeholder="Max Mustermann"
							maxLength={50}
							className={`transition-all duration-300 ${
								data.name !== userData.name && "border-sky-700"
							}`}
							value={data.name}
							onChange={(e) => setData({ name: e.target.value })}
						/>
					</div>
					<div className="grid w-full items-center gap-1.5">
						<Label htmlFor="input-mail">Mail</Label>
						<Input
							type="email"
							name="Mail"
							id="input-mail"
							placeholder="max@example.com"
							className={`transition-all duration-300 ${
								data.mail !== userData.email && "border-sky-700"
							}`}
							value={data.mail}
							onChange={(e) => setData({ mail: e.target.value })}
						/>
					</div>
					<div className="grid w-full items-center gap-1.5">
						<Label htmlFor="input-password">Password</Label>
						<Input
							type="password"
							name="Password"
							id="input-password"
							placeholder="Secure123"
							maxLength={30}
							className={`transition-all duration-300 ${
								data.password !== "" && "border-sky-700"
							}`}
							value={data.password}
							onChange={(e) => setData({ password: e.target.value })}
						/>
					</div>
				</div>
			</CardContent>

			<Separator className="w-full" />

			<CardFooter className="p-6 gap-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							disabled={data.loading}
							variant="secondary"
							className="w-full"
							onClick={() => updateData()}
						>
							<SaveAll className="mr-2 w-4 h-4" /> Save Changes
						</Button>
					</TooltipTrigger>
					<TooltipContent className="text-xs text-destructive-foreground font-mono text-center">
						<p>Every device will be</p>
						<p>
							<u>signed out</u> after saving
						</p>
					</TooltipContent>
				</Tooltip>
			</CardFooter>
		</Card>
	);
}
