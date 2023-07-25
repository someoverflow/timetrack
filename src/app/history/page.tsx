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

  const user = await prisma.user.findUnique({
    where: {
      username: session?.user?.name + "",
    },
    select: {
      username: true,
    },
  });

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

export default async function History() {
  const history = await getHistory();

  return (
    <Navigation>
      <section className="w-full min-h-screen flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-left">
          <Header text="History" />
        </div>
        <TimerHistory data={history} />
      </section>
    </Navigation>
  );
}
