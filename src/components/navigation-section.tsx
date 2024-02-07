"use client";

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

import { History, Moon, Shield, Sun, SunMoon, Timer, User } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationSection({
  user,
}: {
  user: {
    username: string;
    name: string;
    role: string;
  } | null;
}) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  return (
    <Menubar className="h-13">
      <MenubarMenu>
        <MenubarTrigger asChild>
          <Link
            href="/"
            prefetch={true}
            className={`${
              pathname == "/" ? "bg-accent" : "hover:bg-accent"
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
            prefetch={true}
            className={`${
              pathname == "/history" ? "bg-accent" : "hover:bg-accent"
            } !cursor-pointer aspect-square !p-2`}
          >
            <History className="h-6 w-6" />
          </Link>
        </MenubarTrigger>
      </MenubarMenu>
      {user?.role == "admin" && (
        <MenubarMenu>
          <MenubarTrigger className="hover:!bg-accent !bg-background !cursor-pointer aspect-square !p-2">
            <Shield className="h-6 w-6" />
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled>Admin Section</MenubarItem>

            <MenubarSeparator />

            <MenubarItem asChild>
              <Link
                href="/admin/user"
                prefetch={true}
                className={pathname == "/admin/user" ? "bg-accent" : ""}
              >
                Users
              </Link>
            </MenubarItem>
            <MenubarItem asChild>
              <Link
                href="/admin/chip"
                prefetch={true}
                className={pathname == "/admin/chip" ? "bg-accent" : ""}
              >
                Chips
              </Link>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      )}
      <MenubarMenu>
        <MenubarTrigger className="hover:!bg-accent !bg-background !cursor-pointer aspect-square !p-2">
          <User className="h-6 w-6" />
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem asChild>
            <Link
              href="/profile"
              prefetch={true}
              className={pathname == "/profile" ? "bg-accent" : ""}
            >
              Profile
            </Link>
          </MenubarItem>
          <MenubarItem onClick={() => signOut()}>Sign Out</MenubarItem>

          <MenubarSeparator />

          <MenubarSub>
            <MenubarSubTrigger>Theme</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem
                disabled={theme == "light"}
                onClick={() => setTheme("light")}
              >
                <Sun className="mr-2 h-4 w-4" /> Light
              </MenubarItem>
              <MenubarItem
                disabled={theme == "dark"}
                onClick={() => setTheme("dark")}
              >
                <Moon className="mr-2 h-4 w-4" /> Dark
              </MenubarItem>
              <MenubarItem
                disabled={theme == "system"}
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
