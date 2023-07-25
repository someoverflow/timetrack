import Navigation from "@/components/Navigation";
import TimerSection from "./TimerSection";

export default async function Home() {
  return (
    <Navigation toggle>
      <section className="min-h-screen flex flex-col items-center justify-center gap-4">
        <TimerSection></TimerSection>
      </section>
    </Navigation>
  );
}
