// UI
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { JetBrains_Mono } from "next/font/google";

// Translation
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

// Provider
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider, ThemeProvider } from "@/lib/provider";

export async function generateMetadata() {
	const t = await getTranslations({ namespace: "Timer.Metadata" });

	return {
		title: t("title"),
		description: t("description"),
	};
}

const mono = JetBrains_Mono({
	variable: "--mono-font",
	subsets: ["latin-ext"],
	display: "swap",
});

import "./globals.css";
import "animate.css";

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const locale = await getLocale();

	// Providing all messages to the client
	// side is the easiest way to get started
	const messages = await getMessages();

	return (
		<html lang={locale} className={mono.variable} suppressHydrationWarning>
			<body>
				<NextIntlClientProvider messages={messages}>
					<NextTopLoader showSpinner={false} />
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
						<SessionProvider>
							<TooltipProvider delayDuration={100}>
								{children}
								<Toaster position="top-right" />
							</TooltipProvider>
						</SessionProvider>
					</ThemeProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
