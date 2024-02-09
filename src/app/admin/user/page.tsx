import prisma from "@/lib/prisma";

import UserEdit from "./user-edit";

import {
  Table,
  TableBody,
  TableCaption,
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
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import TableInfo from "./table-info";
import { ScrollArea } from "@/components/ui/scroll-area";

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

async function getUsers(skip: number, take: number) {
  return await prisma.user.findMany({
    skip: skip,
    take: take,
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
}

export default async function AdminUserPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
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

  const userCount = await getUserCount();
  const pages = Math.ceil(userCount / 15);

  if (currentPage > pages) currentPage = pages;

  const users = await getUsers(15 * (currentPage - 1), 15);

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">Users</p>
        </div>

        <ScrollArea type="always" className="w-[90vw] max-w-xl h-[75svh] rounded-md border p-2.5">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary">
              <TableRow>
                <TableHead className="w-[100px]">Login</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((userData: User) => (
                  <TableRow key={userData.id}>
                    <TableCell className="font-medium">
                      {userData.username}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {userData.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-row justify-end items-center gap-2">
                        <UserEdit user={userData} />

                        <Button variant="secondary" size="icon" asChild>
                          <Link href={"/history/" + userData.username}>
                            <Eye className="w-5 h-5" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
            <TableFooter className="sticky bottom-0">
              <TableRow>
                <TableCell colSpan={2} className="p-2">
                  <p className="text-muted-foreground">{`${users.length}/${userCount} Users shown`}</p>
                </TableCell>
                <TableCell className="p-2">
                  <TableInfo page={currentPage} pages={pages} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </ScrollArea>

        {/*
        <section className="pt-4">
        <UserAdd />
      </section> 
      */}
      </section>
    </Navigation>
  );
}
