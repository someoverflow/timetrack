"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import UserAdd from "./user-add";
import { useTranslations } from "next-intl";

export default function UserTableHeader({
	searchValid,
}: {
	searchValid: boolean;
}) {
	const { replace } = useRouter();
	const searchParams = useSearchParams();
	const searchPage = searchParams.get("search");
	const t = useTranslations("Admin.Users");

	const changePage = useDebouncedCallback((value: string) => {
		const current = new URLSearchParams(Array.from(searchParams.entries()));
		if (value.trim() === "") current.delete("search");
		else current.set("search", value);
		const search = current.toString();
		const query = search ? `?${search}` : "";
		replace(`/admin/user${query}`);
	}, 300);

	return (
		<div className="flex flex-row p-2 px-4 gap-2 ">
			<div className="relative flex items-center w-full">
				<Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
				<Input
					placeholder={t("searchName")}
					onChange={(e) => changePage(e.target.value)}
					defaultValue={searchPage ?? ""}
					className={`pl-10 transition-all duration-150 ${
						!searchValid && "border-destructive"
					}`}
				/>
			</div>
			<div className="w-max">
				<UserAdd />
			</div>
		</div>
	);
}
