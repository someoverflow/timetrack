// UI
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

// Auth
import { signOut } from "@/lib/auth";

// Utils
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations({ namespace: "SignOut.Metadata" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function SignOutPage() {
	const t = await getTranslations("SignOut");

	return (
		<main className="min-h-[90svh] flex flex-col items-center justify-center">
			<Card className="w-[350px] text-center">
				<CardHeader>
					<CardTitle>{t("title")}</CardTitle>
					<CardDescription>{t("description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={async (_formData) => {
							"use server";
							await signOut();
						}}
					>
						<Button type="submit" variant="outline">
							{t("buttonText")}
						</Button>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
