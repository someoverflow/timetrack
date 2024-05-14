"use client";

// UI
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
	History,
	ListTodo,
	Moon,
	Sun,
	SunMoon,
	Timer,
	User,
} from "lucide-react";
import { useTheme } from "next-themes";

// React
import { signOut } from "next-auth/react";

// Navigation
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationSection({
	user,
}: {
	user: {
		id: number;
		username: string;
		role: string;
	};
}) {
	const { theme, setTheme } = useTheme();
	const pathname = usePathname();

	return (
		<Menubar className="h-13">
			<MenubarMenu>
				<MenubarTrigger asChild>
					<Link
						href="/"
						prefetch
						className={`${
							pathname === "/" ? "bg-accent" : "hover:bg-accent"
						} !cursor-pointer aspect-square !p-2`}
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
						className={`${
							pathname === "/history" ? "bg-accent" : "hover:bg-accent"
						} !cursor-pointer aspect-square !p-2`}
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
						className={`${
							pathname === "/todo" ? "bg-accent" : "hover:bg-accent"
						} !cursor-pointer aspect-square !p-2`}
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
							href="/settings"
							prefetch
							className={pathname === "/settings" ? "bg-accent" : ""}
						>
							Settings
						</Link>
					</MenubarItem>
					{user?.role === "admin" && (
						<MenubarItem asChild>
							<Link
								href="/admin/user"
								prefetch
								className={pathname === "/admin/user" ? "bg-accent" : ""}
							>
								Users
							</Link>
						</MenubarItem>
					)}

					<MenubarItem onClick={() => signOut()}>Sign Out</MenubarItem>

					<MenubarSeparator />

					<MenubarSub>
						<MenubarSubTrigger>Theme</MenubarSubTrigger>
						<MenubarSubContent>
							<MenubarItem
								disabled={theme === "light"}
								onClick={() => setTheme("light")}
							>
								<Sun className="mr-2 h-4 w-4" /> Light
							</MenubarItem>
							<MenubarItem
								disabled={theme === "dark"}
								onClick={() => setTheme("dark")}
							>
								<Moon className="mr-2 h-4 w-4" /> Dark
							</MenubarItem>
							<MenubarItem
								disabled={theme === "system"}
								onClick={() => setTheme("system")}
							>
								<SunMoon className="mr-2 h-4 w-4" /> System
							</MenubarItem>
						</MenubarSubContent>
					</MenubarSub>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}
