import { Check, ChevronsUpDown } from "lucide-react";
import { Button, buttonVariants } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

type PageType = (
  | {
      multiSelect?: false | undefined;
      project: string | undefined;
    }
  | {
      multiSelect?: true;
      project: string[];
    }
) & {
  button?: JSX.Element | undefined;
  projects: Projects;
  buttonDisabled?: boolean;

  singleCustomer?: boolean;

  changeProject: (project: string | undefined) => void;
};

export const ProjectSelection = ({
  projects,
  button,
  buttonDisabled,
  singleCustomer,
  multiSelect,
  project,
  changeProject,
}: PageType) => {
  const t = useTranslations("Timer.Miscellaneous");
  const [open, setOpen] = useState(false);

  const tempCustomerFilter = projects.single.find(
    (p) => p.name == project?.[0],
  )?.customerName;

  const customerFilter = singleCustomer
    ? tempCustomerFilter !== null
      ? tempCustomerFilter
      : ""
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        {button ?? (
          <Button
            id="projects-button"
            variant="outline"
            role="combobox"
            disabled={buttonDisabled}
            className="w-full justify-between"
          >
            <div className="flex flex-row items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {
                  projects.single.find((proj) => proj.name == project)
                    ?.customerName
                }
              </span>
              {project ?? t("projects.none")}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="p-2">
        <Command className="max-h-[calc(32px+25svh)]">
          <CommandInput placeholder={t("projects.search")} className="h-8" />
          {projects.single.length === 0 ? (
            <div className="items-center justify-center pt-4 text-center text-sm text-muted-foreground">
              <p>{t("projects.noneFound")}</p>
              <Link
                href="/projects"
                prefetch={false}
                className={buttonVariants({
                  variant: "link",
                  className: "flex-col items-start",
                })}
              >
                <p>{t("projects.noneFoundDescription")}</p>
              </Link>
            </div>
          ) : (
            <CommandList>
              {Object.keys(projects.grouped).map((customer, index) => {
                if (
                  singleCustomer &&
                  customerFilter !== undefined &&
                  customer !== customerFilter
                )
                  return null;

                return (
                  <CommandGroup
                    heading={customer != "" ? customer : t("withoutCustomer")}
                    key={index + customer}
                    className="max-h-none"
                  >
                    {projects.grouped[customer]?.map((proj) => (
                      <CommandItem
                        key={`project-select-${proj.name}`}
                        disabled={
                          singleCustomer &&
                          customerFilter !== undefined &&
                          customer !== customerFilter
                        }
                        value={`${proj.customerName ? proj.customerName + " " : ""}${proj.name}`}
                        onSelect={() => {
                          if (
                            multiSelect === false ||
                            multiSelect === undefined
                          ) {
                            changeProject(
                              project !== proj.name ? proj.name : undefined,
                            );
                          } else changeProject(proj.name);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            (
                              multiSelect === true
                                ? project.includes(proj.name)
                                : project === proj.name
                            )
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {proj.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
