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

import {
  History,
  Home,
  Moon,
  Sun,
  SunMoon,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import Link from "next/link";

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

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger asChild>
          <Link className="hover:bg-accent !cursor-pointer" href="/">
            <Home className="h-5 w-5" />
          </Link>
        </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger asChild>
          <Link className="hover:bg-accent !cursor-pointer" href="/history">
            <History className="h-5 w-5" />
          </Link>
        </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="hover:bg-accent !cursor-pointer">
          <User className="h-5 w-5" />
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem asChild>
            <Link href="/profile">Profile</Link>
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
