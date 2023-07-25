import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import TimerHistory from "../TimerHistory";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Time Track - History",
  description: "Track your Time",
};

async function getHistory(username: string) {
  const target = await prisma.user.findUnique({
    where: {
      username: username,
    },
    select: {
      username: true,
    },
  });

  if (!target) return null;

  const history = await prisma.times.findMany({
    orderBy: {
      //id: "desc",
      start: "asc",
    },
    where: {
      user: username,
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

  const history = await getHistory(params.user);

  return (
    <Navigation>
      <section className="w-full min-h-screen flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-left">
          <Header text={`History of ${params.user}`} />
        </div>
        {history != null ? (
          <>
            {history.length == 0 ? (
              <p className="font-mono font-bold">No data found</p>
            ) : (
              <TimerHistory data={history} />
            )}
          </>
        ) : (
          <p className="font-mono font-bold">User not found</p>
        )}
      </section>
    </Navigation>
  );
}
