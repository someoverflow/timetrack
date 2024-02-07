import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Time Track - Signin",
  description: "Track your Time",
};

export default async function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
