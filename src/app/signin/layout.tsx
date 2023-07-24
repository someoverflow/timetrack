import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Time Track - Signin",
  description: "Track your Time",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
