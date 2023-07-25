import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import ChipEdit from "./ChipEdit";
import ChipAdd from "./ChipAdd";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { redirect } from "next/navigation";

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
      <section className="admin-main-section">
        <div className="w-full font-mono text-left pb-4">
          <Header text="Chips" />
        </div>
        <table className="admin-main-table">
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
