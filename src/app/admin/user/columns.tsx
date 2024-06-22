"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Settings2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import UserEdit from "./user-edit";

export const columns: ColumnDef<
	Prisma.UserGetPayload<{
		select: {
			id: true;
			username: true;
			name: true;
			email: true;
			role: true;

			createdAt: true;
			updatedAt: true;

			chips: true;
		};
	}>
>[] = [
	{
		id: "username",
		accessorKey: "username",
		enableHiding: false,
		header: () => useTranslations("Admin.Users")("username"),
	},
	{
		id: "name",
		accessorKey: "name",
		enableHiding: false,
		header: () => useTranslations("Admin.Users")("name"),
	},
	{
		id: "actions",
		enableHiding: false,
		header: () => (
			<div className="grid place-items-center">
				<Settings2 className="h-4 w-4" />
			</div>
		),
		cell: ({ row }) => <UserEdit user={row.original} />,
	},
];
