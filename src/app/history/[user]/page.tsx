import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";

import TimerHistory from "../TimerHistory";
import TimerAdd from "../TimerAdd";

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
    name: string;
  } | null
) {
  if (!user) return null;

  const history = await prisma.times.findMany({
    orderBy: {
      //id: "desc",
      start: "asc",
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
      <section className="w-full min-h-screen flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-left">
          <Header text={`History of ${target?.name} (${target?.username})`} />
        </div>
        {history != null ? (
          <>
            <TimerAdd username={target?.username + ""} />

            {dataFound() ? (
              <TimerHistory data={history} username={target?.username + ""} />
            ) : (
              <p className="font-mono font-bold text-xl">No data found</p>
            )}
          </>
        ) : (
          <p className="font-mono font-bold text-xl">User not found</p>
        )}
      </section>
    </Navigation>
  );
}
