import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import TimerHistory from "./TimerHistory";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Time Track - History",
  description: "Track your Time",
};

async function getHistory() {
  const session = await getServerSession();

  const history = await prisma.times.findMany({
    orderBy: {
      //id: "desc",
      start: "asc",
    },
    where: {
      user: session?.user?.name + "",
    },
  });
  return history;
}

export default async function History() {
  const history = await getHistory();

  function dataFound(): boolean {
    if (history.length == 0) return false;
    if (history.length == 1 && history[0].end == null) return false;
    return true;
  }

  return (
    <Navigation>
      <section className="w-full min-h-screen flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-left">
          <Header text="History" />
        </div>
        {dataFound() ? (
          <TimerHistory data={history} />
        ) : (
          <p className="font-mono font-bold text-xl">No data found</p>
        )}
      </section>
    </Navigation>
  );
}
