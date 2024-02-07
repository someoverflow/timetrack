import Navigation from "@/components/navigation";
import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth";

import ProfileSection from "./profile-section";

export default async function Profile() {
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
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">Profile</p>
          <p className="text-content3 text-md">
            {user?.name} aka. {user?.username}
          </p>
        </div>

        <ProfileSection userData={user!} />
      </section>
    </Navigation>
  );
}
