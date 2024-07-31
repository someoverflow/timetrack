import { validateRequest } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "Login.Metadata" });

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
  const auth = await validateRequest();
  if (auth.session !== null) redirect("/");

  return <>{children}</>;
}
