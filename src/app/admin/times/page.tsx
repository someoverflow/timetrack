import prisma from "@/lib/prisma";
import Table from "./table";
import { getServerSession } from "next-auth";

export default async function Home() {
  const session = await getServerSession();

  if (session == null) return <></>;

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
  });

  if (user?.role != "admin") return <></>;

  return (
    <main>
      <section className="min-h-screen flex items-center justify-center">
        <div>
          <Table />
        </div>
      </section>
    </main>
  );
}
