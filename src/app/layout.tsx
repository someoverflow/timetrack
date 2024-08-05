//#region Imports
import { Toaster } from "@/components/ui/sonner";

import NextTopLoader from "nextjs-toploader";
import { JetBrains_Mono, Inter as FontSans } from "next/font/google";
import type { Viewport } from "next";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/provider";
//#endregion

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "Timer.Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  width: "device-width",
};

const mono = JetBrains_Mono({
  variable: "--mono-font",
  subsets: ["latin-ext"],
  display: "swap",
});
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

import "./globals.css";
import "animate.css";

const enviroment = process.env.NODE_ENV;
const instance =
  enviroment === "production"
    ? process.env.INSTANCE_NAME
    : enviroment.toUpperCase();

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
    <html
      lang={locale}
      className={cn(mono.variable, fontSans.variable)}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <NextTopLoader showSpinner={false} />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider delayDuration={100}>
              {children}
              <Toaster position="top-right" />

              {instance && (
                <div
                  className="[writing-mode:vertical-rl] fixed bottom-3 right-3 cursor-vertical-text p-0 m-0 text-muted-foreground/35 md:block text-xs"
                  style={{ transform: "rotate(180deg)" }}
                >
                  {instance}
                </div>
              )}
            </TooltipProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
