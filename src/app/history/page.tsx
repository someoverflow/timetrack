import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import Navigation from "@/components/navigation";

import TimerSection from "./timer-section";

import { Session, getServerSession } from "next-auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Time Track - History",
  description: "Track your Time",
};

async function getHistory(session: Session | null) {
  const history = await prisma.times.findMany({
    orderBy: {
      //id: "desc",
      start: "desc",
    },
    where: {
      user: session?.user?.name + "",
    },
  });
  return history;
}

export default async function History() {
  const session = await getServerSession();
  const history = await getHistory(session);

  function dataFound(): boolean {
    if (history.length == 0) return false;
    return !(history.length == 1 && history[0].end == null);
  }

  return (
    <Navigation>
      <section className="w-full min-h-screen flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-left">
          <Header text="History" />
        </div>

        {dataFound() ? (
          <TimerSection data={history} username={session?.user?.name!} />
        ) : (
          <p className="font-mono font-bold text-base">No data found</p>
        )}
      </section>
    </Navigation>
  );
}
