import Navigation from "@/components/Navigation";
import TimerSection from "./TimerSection";
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
    },
  });

  return (
    <Navigation toggle>
      <section className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-mono text-content3">
          {userDetails?.name}
        </h1>
        <TimerSection />
      </section>
    </Navigation>
  );
}
