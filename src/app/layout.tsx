// UI
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { JetBrains_Mono, Ubuntu_Mono } from "next/font/google";

// Provider
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider, ThemeProvider } from "@/lib/provider";

import type { Metadata } from "next";
export const metadata: Metadata = {
	title: "Time Track",
	description: "Track your Time",
};

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
	return (
		<html lang="en" className={mono.variable} suppressHydrationWarning>
			<body>
				<NextTopLoader showSpinner={false} />
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<SessionProvider>
						<TooltipProvider delayDuration={100}>
							{children}
							<Toaster position="top-right" />
						</TooltipProvider>
					</SessionProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
