import type { Metadata } from "next";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
	title: "Time Track - Signout",
	description: "Track your Time",
};

export default function SignOutPage() {
	return (
		<main className="min-h-[90svh] flex flex-col items-center justify-center">
			<Card className="w-[350px] text-center">
				<CardHeader>
					<CardTitle>Sign Out</CardTitle>
					<CardDescription>Are you sure you want to sign out?</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={async (_formData) => {
							"use server";
							await signOut();
						}}
					>
						<Button type="submit" variant="outline">
							Sign Out
						</Button>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
