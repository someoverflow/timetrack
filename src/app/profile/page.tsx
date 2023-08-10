import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import prisma from "@/lib/prisma";

import ProfileSection from "./ProfileSection";

import { getServerSession } from "next-auth";

export default async function Home() {
  const user = await prisma.user.findUnique({
    where: {
      username: (await getServerSession())?.user?.name + "",
    },
    select: {
      chips: true,
      email: true,
      name: true,
      role: true,
      username: true,
    },
  });

  return (
    <Navigation>
      <section className="w-full min-h-screen flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-left flex flex-row items-center">
          <Header text={"Profile"} />
          <p className="text-content3 text-md">{user?.username}</p>
        </div>

        <div className="w-full max-w-lg min-h-screen flex flex-col gap-6 pt-2 pb-2">
          <ProfileSection user={user} />
        </div>
      </section>
    </Navigation>
  );
}
