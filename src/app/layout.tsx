// UI
import { Toaster } from "@/components/ui/sonner";

// Provider
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider, ThemeProvider } from "@/lib/provider";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Time Track",
  description: "Track your Time",
};

import "./globals.css";
import "animate.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            <TooltipProvider delayDuration={100}>
              {children}
              <Toaster />
            </TooltipProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
