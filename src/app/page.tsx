import Navigation from "@/components/Navigation";
import TimerSection from "./TimerSection";
import { getServerSession } from "next-auth";

export default async function Home() {
  const user = await getServerSession();

  return (
    <Navigation toggle>
      <section className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-mono text-content3">{user?.user?.name}</p>
        <TimerSection username={user?.user?.name + ""}></TimerSection>
      </section>
    </Navigation>
  );
}
