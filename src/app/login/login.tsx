/* eslint-disable @next/next/no-img-element */
"use client";
//#region Imports
import { login } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useFormState } from "react-dom";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { MonitorSmartphone, Moon, Sun, SwatchBook } from "lucide-react";
import { useTheme } from "next-themes";
//#endregion

export default function LoginPage({ image }: { image: string | undefined }) {
  const [state, action, isPending] = useFormState<any, any>(login, {});
  const { theme, setTheme } = useTheme();

  const tNav = useTranslations("Navigation");
  const t = useTranslations("Login");

  useEffect(() => {
    if (state.error) toast(state.error /*, { description: "---" }*/);
  }, [state]);

  return (
    <>
      <main className="min-h-[90svh] flex flex-col items-center justify-center">
        {image && (
          <div className="bg-white p-3 rounded-md border absolute top-10">
            <img
              src={image}
              alt="Logo"
              className="max-w-[80vw] max-h-[calc(30dvh-145px)]"
            />
          </div>
        )}

        <Card className="w-[95vw] max-w-[350px]">
          <CardHeader className="text-center gap-4">
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={action}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="username">{t("username")}</Label>
                  <Input
                    id="username"
                    name="username"
                    autoComplete="username"
                    placeholder={t("usernamePlaceholder")}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                  />
                </div>
                <Button type="submit" variant="outline" disabled={isPending}>
                  {t("buttonText")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <nav className="fixed left-1/2 -translate-x-1/2 bottom-[1svh] p-4">
        <div className="flex flex-row items-center justify-center">
          <Menubar className="h-13">
            <MenubarMenu>
              <MenubarTrigger className="hover:!bg-accent !bg-background !cursor-pointer aspect-square !p-2">
                <SwatchBook className="size-4" />
              </MenubarTrigger>
              <MenubarContent className="space-y-1" side="top">
                <MenubarItem
                  disabled={theme === "light"}
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-2 size-4" /> {tNav("Theme.light")}
                </MenubarItem>
                <MenubarItem
                  disabled={theme === "dark"}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-2 size-4" /> {tNav("Theme.dark")}
                </MenubarItem>
                <MenubarItem
                  disabled={theme === "system"}
                  onClick={() => setTheme("system")}
                >
                  <MonitorSmartphone className="mr-2 size-4" />{" "}
                  {tNav("Theme.system")}
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </nav>
    </>
  );
}
