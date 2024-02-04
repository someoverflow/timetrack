import "./globals.css";
import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner"

import { ThemeProvider } from "@/lib/theme-provider";
import { SessionProvider } from "@/lib/provider";

export const metadata: Metadata = {
  title: "Time Track",
  description: "Track your Time",
};

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
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
