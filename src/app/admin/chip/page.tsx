import prisma from "@/lib/prisma";
import Navigation from "@/components/navigation";

import ChipEdit from "./ChipEdit";
import ChipAdd from "./ChipAdd";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

async function getUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
    },
  });
}

async function getChips() {
  return await prisma.chip.findMany({
    select: {
      id: true,

      user: true,

      updatedAt: true,
      createdAt: true,
    },
  });
}

export default async function AdminUserPage() {
  const session = await getServerSession();

  if (session == null) return redirect("/");

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
  });

  if (user?.role != "admin") return redirect("/");

  const usersData = getUsers();
  const chipsData = getChips();
  const [users, chips] = await Promise.all([usersData, chipsData]);

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">Chips</p>
        </div>
        <table className="admin-main-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>User</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chips.map((chipData: any) => {
              return (
                <tr key={chipData.id}>
                  <td>
                    <b>{chipData.id}</b>
                  </td>
                  <td>
                    {chipData.user.username !== "?"
                      ? chipData.user.username
                      : chipData.user.name}
                  </td>
                  <td>
                    <div className="flex flex-row justify-end items-center gap-2">
                      {/* <ChipEdit users={users} chip={chipData} /> */}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <section className="p-2">
          {/** <ChipAdd users={users} /> */}
        </section>
      </section>
    </Navigation>
  );
}
