//#region Imports
import { authCheck } from "@/lib/auth";
import NavigationSection from "./navigation-section";

import { redirect } from "next/navigation";
//#endregion

export default async function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");

  return (
    <main>
      {children}

      <section className="fixed left-1/2 -translate-x-1/2 bottom-[1svh] p-4">
        <div className="flex flex-row items-center justify-center">
          <NavigationSection user={auth.user} />
        </div>
      </section>
    </main>
  );
}
