import "./globals.css";
import type { Metadata } from "next";
import { SessionProvider } from "../lib/provider";

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
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
