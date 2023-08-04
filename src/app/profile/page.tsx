import Navigation from "@/components/Navigation";
import prisma from "@/lib/prisma";
import { Save } from "lucide-react";
import { getServerSession } from "next-auth";
import { useState } from "react";
import SettingSection from "./SettingSection";

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
      <section className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-mono text-content3">{user?.username}</p>

        <div className="divider h-0 w-10 m-0"></div>

        <SettingSection
          title="Name"
          username={user?.username + ""}
          defaultValue={user?.name + ""}
          placeholder="Max Mustermann"
        />
        <SettingSection
          title="Mail"
          inputType="email"
          username={user?.username + ""}
          defaultValue={user?.email + ""}
          placeholder="max@muster.mann"
        />
        <SettingSection
          title="Password"
          inputType="password"
          username={user?.username + ""}
          placeholder="Secure123"
        />
      </section>
    </Navigation>
  );
}
