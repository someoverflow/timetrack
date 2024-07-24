"use client";

//#region Imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { authenticate } from "@/lib/actions";
//#endregion

export default function SignIn() {
	const session = useSession();
	const t = useTranslations("SignIn");

	const router = useRouter();

	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!loading && session.status === "authenticated") router.replace("/");
	});

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		try {
			setLoading(true);
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const target = event.target as any;

			const result = await authenticate({
				username: target.username.value,
				password: target.password.value,
				redirect: false,
			});

			if (result.success !== true) {
				toast.error(result.error?.message ?? "Wrong Credentials", {
					description: "Try again with a different username and password",
				});
				setLoading(false);
				return;
			}

			window.location.href = "/";
		} catch (error) {
			toast.error("Failed to sign in.");
			setLoading(false);
		}
	};

	return (
		<main className="min-h-[90svh] flex flex-col items-center justify-center">
			<Card className="w-[350px]">
				<CardHeader className="text-center">
					<CardTitle>{t("title")}</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} method="post">
						<div className="grid w-full items-center gap-4">
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="username">{t("username")}</Label>
								<Input
									id="username"
									name="username"
									placeholder={t("usernamePlaceholder")}
								/>
							</div>
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="password">{t("password")}</Label>
								<Input
									id="password"
									name="password"
									placeholder={t("passwordPlaceholder")}
									type="password"
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
