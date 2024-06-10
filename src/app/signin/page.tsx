"use client";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

// Auth
import { signIn, useSession } from "next-auth/react";

// Navigation
import { useRouter, useSearchParams } from "next/navigation";

// React
import { useEffect, useState } from "react";

export default function SignIn() {
	const session = useSession();

	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl");

	const router = useRouter();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once
	useEffect(() => {
		if (!loading && session.status === "authenticated") router.replace("/");
	}, [session, loading, setLoading]);

	async function start() {
		setLoading(true);
		const result = await signIn("credentials", {
			username: username,
			password: password,
			callbackUrl: callbackUrl ?? "/",
			redirect: false,
		});
		console.log(result);
		if (result) {
			if (result.error) {
				//  === "CredentialsSignin"
				toast.error("Wrong Credentials", {
					description: "Try again with a different username and password",
				});
				return;
			}

			const target = result.url ?? "/";
			if (target.startsWith("https://") || target.startsWith("http://"))
				window.location.href = target;
			else router.push(target);
		} else
			toast.error("No result data", {
				description: "Try again now or later",
			});
		setLoading(false);
	}

	return (
		<main className="min-h-[90svh] flex flex-col items-center justify-center">
			<Card className="w-[350px]">
				<CardHeader className="text-center">
					<CardTitle>Sign In</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							start();
						}}
					>
						<div className="grid w-full items-center gap-4">
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="username">Username</Label>
								<Input
									id="username"
									placeholder="Username"
									value={username}
									onChange={(event) => setUsername(event.target.value)}
								/>
							</div>
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									placeholder="Password"
									type="password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
								/>
							</div>
							<Button type="submit" variant="outline" disabled={loading}>
								Sign In
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
