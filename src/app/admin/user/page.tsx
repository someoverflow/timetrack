import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import UserEdit from "./useredit";
import UserAdd from "./useradd";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { redirect } from "next/navigation";

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,

      chips: true,

      updatedAt: true,
      createdAt: true,
    },
  });
  return users;
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

  const users = await getUsers();

  return (
    <Navigation>
      <section className="w-full flex flex-col items-center p-4">
        <div className="w-full font-mono text-left pb-4">
          <Header text="Users" />
        </div>
        <table className="mt-2 table w-full max-w-xl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mail</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {users.map((userData: any) => {
              return (
                <tr key={userData.id}>
                  <td>
                    <b>{userData.username}</b>
                  </td>
                  <td>{userData.email}</td>
                  <td>
                    <UserEdit user={userData} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <section className="pt-4">
          <UserAdd />
        </section>
      </section>
    </Navigation>
  );
}
