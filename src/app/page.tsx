import Navigation from "@/components/navigation";
import TimerSection from "./timer-section";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export default async function Home() {
  const user = await getServerSession();

  const userDetails = await prisma.user.findUnique({
    where: {
      username: user?.user?.name + "",
    },
    select: {
      name: true,
      username: true,
    },
  });

  return (
    <Navigation>
      <section className="min-h-[100dvh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-mono text-content3">
          {userDetails?.name !== "?"
            ? userDetails?.name
            : userDetails?.username}
        </h1>
        <TimerSection />
      </section>
    </Navigation>
  );
}
