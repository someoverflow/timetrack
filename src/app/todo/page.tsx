// UI
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/navigation";

// Database
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Navigation
import { redirect } from "next/navigation";

// React
import type { Metadata } from "next";

// Utils
import {} from "@/lib/utils";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DataTable } from "./data-table";
import { columns } from "./columns";

export const metadata: Metadata = {
	title: "Time Track - Todos",
	description: "Track your Time",
};

export default async function History({
	searchParams,
}: {
	searchParams?: {
		query?: string;
	};
}) {
	const session = await auth();
	if (!session || !session.user) return redirect("/signin");
	const user = session.user;

	const [todos, projects] = await prisma.$transaction([
		prisma.todo.findMany({
			where: {
				OR: [
					{
						creatorId: user.id,
					},
					{
						assignees: {
							some: {
								id: user.id,
							},
						},
					},
				],
			},
			include: {
				assignees: {
					select: {
						id: true,
						username: true,
						name: true,
					},
				},
				creator: {
					select: {
						id: true,
						username: true,
						name: true,
					},
				},
				relatedProjects: {
					select: {
						name: true,
					},
				},
			},
		}),
		prisma.project.findMany(),
	]);

	return (
		<Navigation>
			<section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
				<div className="w-full font-mono text-center pt-2">
					<p className="text-2xl font-mono">Todos</p>
				</div>

				{todos.length === 0 ? (
					<>Keine Todos</>
				) : (
					<DataTable columns={columns} data={todos} />
				)}
			</section>
		</Navigation>
	);
}
