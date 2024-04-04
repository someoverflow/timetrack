// Auth
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Navigation
import NavigationSection from "./navigation-section";
import { redirect } from "next/navigation";

export default async function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/signin");
  const user = session.user;

  return (
    <main>
      {children}

      <section className="w-full fixed bottom-[1svh] p-4">
        <div className="flex flex-row items-center justify-center">
          <NavigationSection user={user} />
        </div>
      </section>
    </main>
  );
}
