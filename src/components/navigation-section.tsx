"use client";

//#region Imports
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
} from "@/components/ui/menubar";
import {
	Folder,
	History,
	ListTodo,
	LogOut,
	MonitorSmartphone,
	Moon,
	Sun,
	SwatchBook,
	Timer,
	User,
	UserIcon,
	Users,
} from "lucide-react";

import type clsx from "clsx";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import Link from "next/link";
import { cn } from "@/lib/utils";
//#endregion

const linkClass =
	"!cursor-pointer !p-2 aspect-square border border-transparent hover:bg-accent/50 transition-all duration-100";
const isPathLinkClass = "border-border bg-accent/50";
const menuClass = "border border-transparent";

export default function NavigationSection({
	user,
}: {
	user: {
		role: string;
	};
}) {
	const t = useTranslations("Navigation");
	const { theme, setTheme } = useTheme();
	const pathname = usePathname();

	return (
		<Menubar className="h-13">
			<MenubarMenu>
				<MenubarTrigger asChild>
					<Link
						href="/"
						prefetch
						className={cn(linkClass, pathname === "/" && isPathLinkClass)}
					>
						<Timer className="h-6 w-6" />
					</Link>
				</MenubarTrigger>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger asChild>
					<Link
						href="/history"
						prefetch
						className={cn(
							linkClass,
							pathname === "/history" && isPathLinkClass,
						)}
					>
						<History className="h-6 w-6" />
					</Link>
				</MenubarTrigger>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger asChild>
					<Link
						href="/todo"
						prefetch
						className={cn(linkClass, pathname === "/todo" && isPathLinkClass)}
					>
						<ListTodo className="h-6 w-6" />
					</Link>
				</MenubarTrigger>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger className="hover:!bg-accent !bg-background !cursor-pointer aspect-square !p-2">
					<User className="h-6 w-6" />
				</MenubarTrigger>
				<MenubarContent className="space-y-1">
					<MenubarItem asChild>
						<Link
							href="/profile"
							prefetch
							className={cn(
								menuClass,
								pathname === "/profile" && "border-border bg-accent",
							)}
						>
							<UserIcon className="mr-2 h-4 w-4" />
							{t("profile")}
						</Link>
					</MenubarItem>
					<MenubarItem asChild>
						<Link
							href="/projects"
							prefetch
							className={
								pathname === "/projects" ? "bg-accent border border-border" : ""
							}
						>
							<Folder className="mr-2 h-4 w-4" />
							{t("projects")}
						</Link>
					</MenubarItem>

					{user?.role === "ADMIN" && (
						<>
							<MenubarSeparator />

							<MenubarItem asChild>
								<Link
									href="/admin/user"
									prefetch
									className={
										pathname === "/admin/user"
											? "bg-accent border border-border"
											: ""
									}
								>
									<Users className="mr-2 h-4 w-4" />
									{t("users")}
								</Link>
							</MenubarItem>
						</>
					)}

					<MenubarSeparator />

					<MenubarItem asChild>
						<Link href="/signout" prefetch>
							<LogOut className="mr-2 h-4 w-4" />
							{t("signOut")}
						</Link>
					</MenubarItem>

					<MenubarSeparator />

					<MenubarSub>
						<MenubarSubTrigger>
							<SwatchBook className="mr-2 h-4 w-4" />
							{t("Theme.title")}
						</MenubarSubTrigger>
						<MenubarSubContent>
							<MenubarItem
								disabled={theme === "light"}
								onClick={() => setTheme("light")}
							>
								<Sun className="mr-2 h-4 w-4" /> {t("Theme.light")}
							</MenubarItem>
							<MenubarItem
								disabled={theme === "dark"}
								onClick={() => setTheme("dark")}
							>
								<Moon className="mr-2 h-4 w-4" /> {t("Theme.dark")}
							</MenubarItem>
							<MenubarItem
								disabled={theme === "system"}
								onClick={() => setTheme("system")}
							>
								<MonitorSmartphone className="mr-2 h-4 w-4" />{" "}
								{t("Theme.system")}
							</MenubarItem>
						</MenubarSubContent>
					</MenubarSub>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}
