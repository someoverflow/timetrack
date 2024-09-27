//#region Imports
import Navigation from "@/components/navigation";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { authCheck } from "@/lib/auth";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { CustomersInput } from "./customers-input";
import { CustomerDelete } from "./customer-delete";
//#endregion

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "Customers.Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Profile() {
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");
  if (auth.user.role == "CUSTOMER") return redirect("/ticket");
  const user = auth.user;

  const t = await getTranslations("Customers");

  const customers = await prisma.customer.findMany({
    include: {
      _count: true,
    },
  });

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-4 p-4">
        <div className="w-full font-mono text-center pt-2">
          <p className="text-2xl font-mono">{t("title")}</p>
        </div>

        <section className="w-full max-w-md max-h-[90svh] overflow-hidden flex flex-col items-start animate__animated animate__fadeIn">
          <Command className="h-full">
            <CustomersInput />
            <CommandList className="max-h-[calc(95svh-82px-56px-40px)] h-full">
              {customers.map((customer) => (
                <CommandGroup key={customer.name} className="!max-h-none">
                  <CommandItem className="font-mono rounded-md aria-selected:!bg-accent/20 border my-2 p-4 outline-none group hover:border-border/50 transition-all duration-300">
                    <div className="w-full flex flex-row items-center justify-between">
                      <div className="w-full">
                        <h4 className="text-sm font-semibold">
                          {customer.name}
                        </h4>
                        <div className="w-fit pt-3">
                          <div className="flex flex-row items-center gap-1 text-xs">
                            <Badge variant="secondary" className="font-normal">
                              {t("customerProjects", {
                                amount: customer._count.projects,
                              })}
                            </Badge>
                            <Badge variant="secondary" className="font-normal">
                              {t("customerAccounts", {
                                amount: customer._count.users,
                              })}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {user.role === "ADMIN" && (
                      <div className="flex flex-col w-min gap-1 pr-1">
                        <CustomerDelete customer={customer.name} />
                      </div>
                    )}
                  </CommandItem>
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </section>
      </section>
    </Navigation>
  );
}
