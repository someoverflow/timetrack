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
import { useRouter } from "next/navigation";

// React
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function SignIn() {
	const session = useSession();
	const t = useTranslations("SignIn");

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
			redirect: false,
		});
		console.log(result);
		if (result) {
			if (result.error) {
				//  === "CredentialsSignin"
				toast.error("Wrong Credentials", {
					description: "Try again with a different username and password",
				});
			} else router.push("/");
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
					<CardTitle>{t("title")}</CardTitle>
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
								<Label htmlFor="username">{t("username")}</Label>
								<Input
									id="username"
									placeholder={t("usernamePlaceholder")}
									value={username}
									onChange={(event) => setUsername(event.target.value)}
								/>
							</div>
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="password">{t("password")}</Label>
								<Input
									id="password"
									placeholder={t("passwordPlaceholder")}
									type="password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
								/>
							</div>
							<Button type="submit" variant="outline" disabled={loading}>
								{t("buttonText")}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
