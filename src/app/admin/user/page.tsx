import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import UserEdit from "./UserEdit";
import UserAdd from "./UserAdd";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { redirect } from "next/navigation";
import { Inspect } from "lucide-react";
import Link from "next/link";

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
      <section className="admin-main-section">
        <div className="w-full font-mono text-left pb-4">
          <Header text="Users" />
        </div>
        <table className="admin-main-table">
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
                    <div className="flex flex-row items-center gap-2">
                      <UserEdit user={userData} />

                      <Link
                        href={"/history/" + user.username}
                        className="btn btn-circle"
                      >
                        <Inspect className="w-1/2 h-1/2" />
                      </Link>
                    </div>
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
