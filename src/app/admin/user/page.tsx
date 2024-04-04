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
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";

type User = Prisma.userGetPayload<{ include: { projects: true; chips: true } }>;

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
      tag: true,
      name: true,
      email: true,
      role: true,

      createdAt: true,
      updatedAt: true,

      projects: true,
      chips: true,
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return redirect("/");
  if (session.user.role != "admin") return redirect("/");

  var currentPage = Number(searchParams?.page) || 1;
  var searchName = searchParams?.search || null;

  const userCount = await prisma.user.count();
  const pages = Math.ceil(userCount / 15);

  if (currentPage > pages) currentPage = pages;

  const { users, searchValid } = await getUsers(
    15 * (currentPage - 1),
    15,
    searchName
  );

  if (users.length != 15) {
    for (var i = 0; i < 15; i++) {
      if (!users[i]) {
        users[i] = {
          id: i * -1,
          tag: "<null>",
          name: null,
          email: "<null>",
          role: "<null>",
          projects: [],
          chips: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    }
  }

  return (
    <Navigation>
      <section className="flex flex-col items-center gap-4 p-4 ">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">Users</p>
        </div>

        <div className="flex flex-col max-h-[90svh] w-full max-w-md animate__animated animate__fadeIn">
          <UserTableHeader searchValid={searchValid} />

          <ScrollArea
            type="always"
            className="h-[calc(80svh-80px)] rounded-md border p-2.5 w-full"
          >
            <Table className="rounded-none">
              <TableHeader className="sticky z-10 top-0 bg-secondary">
                <TableRow>
                  <TableHead className="w-fit">Login</TableHead>
                  <TableHead className="w-full">Name</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users as User[]).map((user) => (
                  <TableRow
                    key={user.id}
                    className="animate__animated animate__slideInLeft"
                  >
                    <TableCell className="whitespace-nowrap font-medium w-fit">
                      {user.tag != "<null>" && user.tag}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {user.name != "<null>" && user.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.tag == "<null>" ? (
                        <div className="h-10 w-1"></div>
                      ) : (
                        <div className="flex flex-row justify-end items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger>
                              <Button variant="secondary" size="icon" asChild>
                                <Link href={"/history/" + user.tag}>
                                  <Eye className="w-5 h-5" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>View History</p>
                            </TooltipContent>
                          </Tooltip>

                          <UserEdit user={user} />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
