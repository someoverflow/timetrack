import prisma from "@/lib/prisma";

import UserEdit from "./user-edit";
import UserTableHeader from "./table-header";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { getServerSession } from "next-auth";
import { cache } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import TableInfo from "./table-info";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type User = {
  id: number;
  role: string;
  name: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  chips: {
    id: string;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export const getUserCount = cache(async () => {
  const count = await prisma.user.count();
  return count;
});

export const revalidate = 60;

async function getUsers(skip: number, take: number, search: string | null) {
  var searchValid = /^[A-Za-z\s]*$/.test(search!);
  if (!search) searchValid = true;
  const result = await prisma.user.findMany({
    skip: skip,
    take: take,
    where: {
      name: {
        contains: search && searchValid ? search : undefined,
      },
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,

      chips: true,

      updatedAt: true,
      createdAt: true,

      _count: true,
    },
  });
  return {
    users: result,
    searchValid: searchValid,
  };
}

export default async function AdminUserPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    search?: string;
    page?: string;
  };
}) {
  const session = await getServerSession();

  if (session == null) return redirect("/");
  const user = await prisma.user.findUnique({
    where: {
      username: session.user?.name + "",
    },
  });
  if (user?.role != "admin") return redirect("/");

  var currentPage = Number(searchParams?.page) || 1;
  var searchName = searchParams?.search || null;

  const userCount = await getUserCount();
  const pages = Math.ceil(userCount / 15);

  if (currentPage > pages) currentPage = pages;

  const { users, searchValid } = await getUsers(
    15 * (currentPage - 1),
    15,
    searchName
  );

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">Users</p>
        </div>

        <div className="flex flex-col w-[90vw] max-w-xl">
          <UserTableHeader searchValid={searchValid} />

          <ScrollArea
            type="always"
            className="h-[70svh] rounded-md border p-2.5"
          >
            <Table className="rounded-none min-h-[67svh]">
              <TableHeader className="sticky z-10 top-0 bg-secondary">
                <TableRow>
                  <TableHead className="w-min">Login</TableHead>
                  <TableHead className="w-full">Name</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users as User[]).map((userData) => (
                  <TableRow
                    key={userData.id}
                    className="animate__animated animate__fadeIn"
                  >
                    <TableCell className="font-medium">
                      {userData.username}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {userData.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-row justify-end items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="secondary" size="icon" asChild>
                              <Link href={"/history/" + userData.username}>
                                <Eye className="w-5 h-5" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>View User-History</p>
                          </TooltipContent>
                        </Tooltip>

                        <UserEdit user={userData} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <tr className="h-full"></tr>
              </TableBody>
              <TableFooter className="sticky bottom-0">
                <TableRow>
                  <TableCell className="p-2">
                    <p className="text-muted-foreground">{`${users.length}/${userCount} shown`}</p>
                  </TableCell>
                  <TableCell colSpan={2} className="p-2">
                    <TableInfo page={currentPage} pages={pages} />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </ScrollArea>
        </div>
      </section>
    </Navigation>
  );
}
