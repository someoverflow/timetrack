import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import ChipEdit from "./chipedit";
import ChipAdd from "./chipadd";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";

export const revalidate = 5;

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
    },
  });
  return users;
}
async function getChips() {
  const chips = await prisma.chip.findMany({
    select: {
      id: true,

      user: true,

      updatedAt: true,
      createdAt: true,
    },
  });
  return chips;
}

export default async function AdminUserPage() {
  const session = await getServerSession();

  if (session == null) return <></>;

  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
  });

  if (user?.role != "admin") return <></>;

  const usersData = getUsers();
  const chipsData = getChips();
  const [users, chips] = await Promise.all([usersData, chipsData]);

  return (
    <Navigation>
      <section className="flex flex-col items-center p-4">
        <div className="w-full font-mono text-left pb-4">
          <Header text="Chips" />
        </div>
        <table className="mt-2 table w-full max-w-xl">
          <thead>
            <tr>
              <th>Id</th>
              <th>User</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {chips.map((chipData: any) => {
              return (
                <tr key={chipData.id}>
                  <td>
                    <b>{chipData.id}</b>
                  </td>
                  <td>{chipData.user.username}</td>
                  <td>
                    <ChipEdit users={users} chip={chipData} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <section className="p-2">
          <ChipAdd users={users} />
        </section>
      </section>
    </Navigation>
  );
}
