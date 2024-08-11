//#region Imports
import Navigation from "@/components/navigation";

import ProfileSection from "./profile-section";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { authCheck } from "@/lib/auth";
//#endregion

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "Profile.Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Profile() {
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");
  const user = auth.user;

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { language: true },
  });

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <section className="w-full max-w-md max-h-[90svh] overflow-hidden flex flex-col md:mt-20 items-start animate__animated animate__fadeIn">
          <ProfileSection userData={user} language={userData?.language} />
        </section>
      </section>
    </Navigation>
  );
}
