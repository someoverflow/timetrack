//#region Imports
import Navigation from "@/components/navigation";
import TimerSection from "./timer-section";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { authCheck } from "@/lib/auth";
//#endregion

export default async function Home() {
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");
  if (auth.user.role == "CUSTOMER") return redirect("/ticket");

  const projectsResult = await prisma.project.findMany({
    select: {
      customerName: true,
      name: true,
    },
  });
  const projects = {
    single: projectsResult,
    grouped: Object.groupBy(
      projectsResult,
      (project) => project.customerName ?? "",
    ),
  };

  return (
    <Navigation>
      <section className="min-h-[70svh] flex flex-col items-center justify-center gap-4">
        {auth.user.name && (
          <h1 className="text-2xl font-mono text-content3">{auth.user.name}</h1>
        )}
        <TimerSection projects={JSON.parse(JSON.stringify(projects))} />
      </section>
    </Navigation>
  );
}
