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

import { cn } from "@/lib/utils";
//#endregion

export function ProjectSection({
  customers,
  projects,
  userData,
}: {
  customers: Prisma.CustomerGetPayload<{
    include: {
      projects: {
        include: {
          _count: true;
        };
      };
    };
  }>[];
  projects: Prisma.ProjectGetPayload<{
    include: {
      _count: true;
    };
  }>[];
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

  const { status: createStatus, send: sendCreate } = useRequest(
    useCallback(
      () =>
        fetch("/api/project", {
          method: "POST",
          body: JSON.stringify({
            name: search,
            type: "PROJECT",
          }),
        }),
      [search],
    ),
    (_result) => {
      setSearch("");
      toast.success(t("created"));
      router.refresh();
    },
  );

  const loading = createStatus.loading;

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
            disabled={loading || search === ""}
            onClick={() => sendCreate()}
            className={cn(
              "transition-all duration-200",
              search === "" && "w-0",
            )}
            size="icon"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      <CommandList className="max-h-[calc(95svh-82px-56px-40px)] h-full">
        {(projects.length != 0 || customers.length == 0) && (
          <CommandGroup
            heading={t("withoutCustomer")}
            forceMount={projects.length === 0 && customers.length === 0}
            className="!max-h-none"
          >
            {projects.length === 0 && customers.length === 0 && (
              <div className="py-6 text-center text-sm">
                <p>{t("noProjects")}</p>
              </div>
            )}
            {projects.map((project) => (
              <ProjectEdit
                key={`edit-${project.name}`}
                customers={customers}
                project={project}
                role={userData.role as Role}
              />
            ))}
          </CommandGroup>
        )}
        {customers.map((customer) => (
          <CommandGroup
            key={customer.name}
            heading={
              <div className="border-y p-2 flex flex-row items-center justify-between group">
                <p>{customer.name}</p>
                <div className="min-h-10"></div>
              </div>
            }
            className="!max-h-none"
          >
            {customer.projects.map((project) => (
              <ProjectEdit
                key={`edit-${project.name}`}
                customers={customers}
                project={project}
                role={userData.role as Role}
              />
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
