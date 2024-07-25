//#region Imports
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { getTranslations } from "next-intl/server";
import { lucia, validateRequest } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
//#endregion

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "SignOut.Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function SignOutPage() {
  const t = await getTranslations("SignOut");

  return (
    <main className="min-h-[90svh] flex flex-col items-center justify-center">
      <Card className="w-[350px] text-center">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logout}>
            <Button type="submit" variant="outline">
              {t("buttonText")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

async function logout() {
  "use server";
  const { session } = await validateRequest();
  if (!session) {
    return {
      error: "Unauthorized",
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  return redirect("/login");
}
