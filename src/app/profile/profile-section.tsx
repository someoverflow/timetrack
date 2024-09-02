"use client";

//#region Imports
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SaveAll } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import { useCallback, useReducer } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import useRequest from "@/lib/hooks/useRequest";
//#endregion

interface profileSectionState {
  name: string | undefined;
  mail: string | undefined;
  password: string;
}

export default function ProfileSection({
  userData,
  language,
}: {
  userData: {
    id?: string;
    username: string;
    role: string;
    name?: string | null | undefined;
    email?: string | null | undefined;
  };
  language: string | undefined;
}) {
  const t = useTranslations("Profile");
  const router = useRouter();

  const [data, setData] = useReducer(
    (prev: profileSectionState, next: Partial<profileSectionState>) => ({
      ...prev,
      ...next,
    }),
    {
      name: userData.name ?? "",
      mail: userData.email ?? "",
      password: "",
    },
  );

  const { status: updateStatus, send: sendUpdate } = useRequest(
    useCallback(
      () =>
        fetch("/api/profile", {
          method: "PUT",
          body: JSON.stringify({
            name: data.name !== userData.name ? data.name : undefined,
            mail:
              (data.mail ?? "") !== (userData.email ?? "")
                ? data.mail
                : undefined,
            password: data.password !== "" ? data.password : undefined,
          }),
        }),
      [data, userData],
    ),
    async (_result) => {
      if (data.password !== "") {
        toast.success(t("updated"), {
          description: t("passwordUpdate"),
          duration: 3000,
        });
        return;
      }

      toast.success(t("updated"), {
        description: t("sessionUpdate"),
        duration: 3000,
      });

      router.refresh();
    },
  );
  const { status: languageStatus, send: sendLanguage } = useRequest(
    (passed: { language: string } | undefined) =>
      fetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          language: passed?.language,
        }),
      }),
    (_result) => {
      toast.success(t("updated"), {
        description: t("languageUpdate"),
        duration: 3000,
      });

      router.refresh();
    },
  );

  return (
    <>
      <section className="w-full max-w-md max-h-[90svh] overflow-hidden flex flex-col items-start">
        <div className="w-full grid place-items-center mt-4 mb-6">
          <div className="p-6 grid w-full items-center gap-1.5">
            <Label htmlFor="select-language">{t("language")}</Label>
            <Select
              value={language}
              onValueChange={(e) => sendLanguage({ language: e })}
            >
              <SelectTrigger id="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="de">{t("languages.de")}</SelectItem>
                  <SelectItem value="en">{t("languages.en")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Separator className="w-full" />

          <div className="p-6 grid w-full items-center gap-1.5">
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="input-name"
                className={cn(
                  "transition-colors",
                  data.name !== userData.name ? "text-blue-500" : "",
                )}
              >
                {t("name")}
              </Label>
              <Input
                type="text"
                name="Name"
                id="input-name"
                placeholder={t("namePlaceholder")}
                autoComplete="name"
                value={data.name}
                onChange={(e) => setData({ name: e.target.value })}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="input-mail"
                className={cn(
                  "transition-colors",
                  (data.mail ?? "") !== (userData.email ?? "")
                    ? "text-blue-500"
                    : "",
                )}
              >
                {t("mail")}
              </Label>
              <Input
                type="email"
                name="Mail"
                id="input-mail"
                autoComplete="email"
                placeholder={t("mailPlaceholder")}
                value={data.mail}
                onChange={(e) => setData({ mail: e.target.value })}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label
                htmlFor="input-password"
                className={cn(
                  "transition-colors",
                  data.password !== "" ? "text-blue-500" : "",
                )}
              >
                {t("password")}
              </Label>
              <Input
                type="password"
                name="Password"
                id="input-password"
                placeholder={t("passwordPlaceholder")}
                maxLength={30}
                value={data.password}
                onChange={(e) => setData({ password: e.target.value })}
              />
            </div>

            <div className="h-4"></div>

            <Button
              disabled={languageStatus.loading || updateStatus.loading}
              variant="secondary"
              className="w-full"
              onClick={() => sendUpdate()}
            >
              <SaveAll className="mr-2 w-4 h-4" /> {t("buttonContent")}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
