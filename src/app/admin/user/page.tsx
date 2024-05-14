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
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";

type User = Prisma.UserGetPayload<{ include: { projects: true; chips: true } }>;

async function getUsers(skip: number, take: number, search: string | null) {
	let searchValid = /^[A-Za-z\s]*$/.test(search ?? "");
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
	const session = await auth();
	if (!session || !session.user) return redirect("/");
	if (session.user.role !== "ADMIN") return redirect("/");

	let currentPage = Number(searchParams?.page) || 1;
	const searchName = searchParams?.search || null;

	const userCount = await prisma.user.count();
	const pages = Math.ceil(userCount / 15);

	if (currentPage > pages) currentPage = pages;

	const { users, searchValid } = await getUsers(
		15 * (currentPage - 1),
		15,
		searchName,
	);

	const visibleUsers = users.length;
	if (users.length !== 15) {
		for (let i = 0; i < 15; i++) {
			if (!users[i]) {
				users[i] = {
					id: String(i * -1),
					username: "<null>",
					name: null,
					email: "<null>",
					role: "USER",
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
						<Table className="rounded-none h-[calc(80svh-80px)]">
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
											{user.username !== "<null>" && user.username}
										</TableCell>
										<TableCell className="whitespace-nowrap">
											{user.name !== "<null>" && user.name}
										</TableCell>
										<TableCell className="text-right">
											{user.username === "<null>" ? (
												<div className="h-10 w-1" />
											) : (
												<div className="flex flex-row justify-end items-center gap-2">
													<Tooltip>
														<TooltipTrigger>
															<Button variant="secondary" size="icon" asChild>
																<Link href={`/history/${user.username}`}>
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
										<p className="text-muted-foreground whitespace-nowrap">{`${visibleUsers} of ${users.length} visible`}</p>
										<p className="text-muted-foreground whitespace-nowrap">{`${userCount} users`}</p>
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
