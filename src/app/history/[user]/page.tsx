import prisma from "@/lib/prisma";
import Navigation from "@/components/navigation";

import TimerSection from "../timer-section";

import { getServerSession } from "next-auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Time Track - History",
  description: "Track your Time",
};

async function getHistory(
  user: {
    username: string;
    name: string | null;
  } | null
) {
  if (!user) return null;

  const history = await prisma.times.findMany({
    orderBy: {
      //id: "desc",
      start: "desc",
    },
    where: {
      user: user?.username,
    },
  });
  return history;
}

export default async function History({
  params,
}: {
  params: { user: string };
}) {
  const session = await getServerSession();

  if (session == null) return redirect("/");

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
  });

  if (user?.role != "admin") redirect("/history");

  const target = await prisma.user
    .findUnique({
      where: {
        username: params.user,
      },
      select: {
        username: true,
        name: true,
      },
    })
    .catch(() => null);

  const history = await getHistory(target);

  function dataFound(): boolean {
    if (history == null) return false;
    if (history.length == 0) return false;
    if (history.length == 1 && history[0].end == null) return false;
    return true;
  }

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">{`History of ${
            target ? target.name : "?"
          }`}</p>
        </div>

        {history != null ? (
          <>
            {dataFound() ? (
              <TimerSection data={history} username={target?.username + ""} />
            ) : (
              <p className="font-mono font-bold text-xl">No data found</p>
            )}
          </>
        ) : (
          <p className="font-mono font-bold text-4xl">User not found</p>
        )}
      </section>
    </Navigation>
  );
}
