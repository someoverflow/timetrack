"use client";
import { login } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useFormState } from "react-dom";

export default function Page() {
  const [state, action, isPending] = useFormState<any, any>(login, {});

  const t = useTranslations("Login");

  useEffect(() => {
    if (state.error) toast(state.error /*, { description: "---" }*/);
  }, [state]);

  return (
    <main className="min-h-[90svh] flex flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
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
  );
}
