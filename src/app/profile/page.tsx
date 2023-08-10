import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import prisma from "@/lib/prisma";

import SettingSection from "./SettingSection";

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
          <SettingSection
            title="Name"
            dbIndicator="name"
            username={user?.username + ""}
            defaultValue={user?.name + ""}
            placeholder="Max Mustermann"
          />
          <SettingSection
            title="Mail"
            inputType="email"
            dbIndicator="email"
            username={user?.username + ""}
            defaultValue={user?.email + ""}
            placeholder="max@muster.mann"
          />
          <SettingSection
            title="Password"
            inputType="password"
            dbIndicator="password"
            username={user?.username + ""}
            placeholder="Secure123"
          />
        </div>
      </section>
    </Navigation>
  );
}
