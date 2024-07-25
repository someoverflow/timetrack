import { getTranslations } from "next-intl/server";

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
  return <>{children}</>;
}
