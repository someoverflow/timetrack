"use client";

//#region Imports
import type { Prisma, Role } from "@prisma/client";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { ProjectEdit } from "./project-edit";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import useRequest from "@/lib/hooks/useRequest";

import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
//#endregion

async function getUserProjects() {
  return await prisma.project.findMany({
    include: {
      _count: true,
    },
  });
}
type userProjects = Prisma.PromiseReturnType<typeof getUserProjects>;

export function ProjectSection({
  projects,
  userData,
}: {
  projects: userProjects;
  userData: {
    id?: string;
    username: string;
    name?: string | null | undefined;
    role: string;
  };
}) {
  const router = useRouter();
  const t = useTranslations("Projects");

  const [search, setSearch] = useState("");

  const { status, send } = useRequest(
    useCallback(
      () =>
        fetch("/api/project", {
          method: "POST",
          body: JSON.stringify({
            name: search,
            userId: [userData.id],
          }),
        }),
      [search, userData],
    ),
    (_result) => {
      setSearch("");
      toast.success(t("created"));
      router.refresh();
    },
  );

  return (
    <Command className="h-full">
      <div className="flex flex-row items-center gap-2 p-2">
        <div className="w-full p-1 px-2">
          <CommandInput
            placeholder={t("searchPlaceholder")}
            className="h-8"
            onValueChange={setSearch}
            value={search}
          />
        </div>
        <div className="w-max h-full">
          <Button
            disabled={status.loading || search === ""}
            className={cn(
              "transition-all duration-200",
              search === "" && "w-0",
            )}
            size="icon"
            onClick={() => send()}
          >
            {status.loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      <CommandList className="max-h-[calc(95svh-82px-56px-40px)] h-full">
        <CommandGroup
          heading={t("projects", { projects: projects.length })}
          forceMount={projects.length === 0}
          className="!max-h-none"
        >
          {projects.length === 0 && (
            <div className="py-6 text-center text-sm">
              <p>{t("noProjects")}</p>
            </div>
          )}
          {projects.map((project) => (
            <ProjectEdit
              key={`edit-${project.name}`}
              project={project}
              role={userData.role as Role}
            />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
