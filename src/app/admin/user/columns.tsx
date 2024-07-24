"use client";

//#region Imports
import { Settings2 } from "lucide-react";
import UserEdit from "./user-edit";

import { useTranslations } from "next-intl";

import type { Prisma } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
//#endregion

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
			<div className="grid place-items-end">
				<div className="grid place-items-center h-8 w-8 p-0">
					<Settings2 className="h-4 w-4" />
				</div>
			</div>
		),
		cell: ({ row }) => (
			<div className="grid place-items-end">
				<UserEdit user={row.original} />
			</div>
		),
	},
];
