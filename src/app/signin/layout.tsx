// React
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

export async function generateMetadata() {
	const t = await getTranslations({ namespace: "SignIn.Metadata" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

export default async function SignInLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <Suspense>{children}</Suspense>;
}
