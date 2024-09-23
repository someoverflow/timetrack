//#region Imports
import Navigation from "@/components/navigation";
import { ProjectSection } from "./project-section";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { authCheck } from "@/lib/auth";
//#endregion

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "Projects.Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Profile() {
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");
  if (auth.user.role == "CUSTOMER") return redirect("/ticket");
  const user = auth.user;

  const t = await getTranslations("Projects");

  const customers = await prisma.customer.findMany({
    include: {
      projects: {
        include: {
          _count: true,
        },
      },
    },
  });
  const projects = await prisma.project.findMany({
    where: {
      customer: null,
    },
    include: {
      _count: true,
    },
  });

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">{t("title")}</p>
        </div>

        <section className="w-full max-w-md max-h-[90svh] overflow-hidden flex flex-col items-start animate__animated animate__fadeIn">
          <ProjectSection
            customers={customers}
            projects={projects}
            userData={user}
          />
        </section>
      </section>
    </Navigation>
  );
}
