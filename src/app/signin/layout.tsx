// React
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Time Track - Signin",
  description: "Track your Time",
};

export default async function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense>{children}</Suspense>
    </>
  );
}
