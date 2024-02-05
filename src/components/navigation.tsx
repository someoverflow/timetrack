import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth";
import NavigationSection from "./navigation-section";

export default async function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  const user = await prisma.user.findUnique({
    where: {
      username: session?.user?.name + "",
    },
    select: {
      username: true,
      role: true,
      name: true,
    },
  });

  return (
    <main>
      {children}

      <section className="w-full fixed bottom-5 p-4">
        <div className="flex flex-row items-center justify-center">
          <NavigationSection user={user} />
        </div>
      </section>
    </main>
  );
}
