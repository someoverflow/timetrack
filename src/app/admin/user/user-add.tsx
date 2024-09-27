"use client";

//#region Imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown, ListPlus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import { useCallback, useReducer, useState } from "react";
import { useTranslations } from "next-intl";
import useRequest from "@/lib/hooks/useRequest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import Link from "next/link";
import { cn } from "@/lib/utils";
//#endregion

interface userAddState {
  username: string;
  name: string;
  password: string;
  mail: string;
  role: string;
  customer: string | undefined;
}

export default function UserAdd({ customers }: { customers: string[] }) {
  const getDefaultData = () => {
    return {
      username: "",
      name: "",
      password: "",
      mail: "",
      role: "user",
      customer: customers[0] ?? undefined,
    };
  };
  const [data, setData] = useReducer(
    (prev: userAddState, next: Partial<userAddState>) => ({
      ...prev,
      ...next,
    }),
    getDefaultData(),
  );

  const [visible, setVisible] = useState(false);

  const t = useTranslations("Admin.Users");

  const router = useRouter();

  const { status: userStatus, send } = useRequest(
    useCallback(
      () =>
        fetch("/api/user", {
          method: "PUT",
          body: JSON.stringify({
            username: data.username,
            name: data.name,
            email: data.mail.length !== 0 ? data.mail : undefined,
            password: data.password,
            role: data.role.toUpperCase(),
          }),
        }),
      [data],
    ),
    (_result) => {
      toast.success(t("created"), {
        duration: 5_000,
      });

      setVisible(false);

      setData(getDefaultData());
      router.refresh();
    },
    (_result, resultType) => {
      if (resultType === "duplicate-found") {
        toast.success(t("addDuplicate"), {
          duration: 5_000,
        });
        return true;
      }
      return false;
    },
  );
  const { status: customerStatus, send: sendCustomer } = useRequest(
    useCallback(
      () =>
        fetch("/api/user", {
          method: "PUT",
          body: JSON.stringify({
            username: data.username,
            name: data.name,
            email: data.mail.length !== 0 ? data.mail : undefined,
            password: data.password,
            customer: data.customer,
            role: "CUSTOMER",
          }),
        }),
      [data],
    ),
    (_result) => {
      toast.success(t("created"), {
        duration: 5_000,
      });

      setVisible(false);

      setData(getDefaultData());
      router.refresh();
    },
    (_result, resultType) => {
      if (resultType === "duplicate-found") {
        toast.success(t("addDuplicate"), {
          duration: 5_000,
        });
        return true;
      }
      return false;
    },
  );

  const status = {
    loading: userStatus.loading || customerStatus.loading,
  };

  return (
    <>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setVisible(true)}
          >
            <ListPlus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-center">{t("Dialogs.Add.buttonToolTip")}</p>
        </TooltipContent>
      </Tooltip>

      <Dialog
        key={"userAddModal"}
        open={visible}
        onOpenChange={(e) => setVisible(e)}
      >
        <DialogContent className="w-[95vw] max-w-xl rounded-lg flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle>
              <div>{t("Dialogs.Add.title")}</div>
            </DialogTitle>
          </DialogHeader>

          <Tabs>
            <TabsList className="w-full">
              <TabsTrigger value="normal" className="w-full">
                Mitarbeiter
              </TabsTrigger>
              <TabsTrigger value="customer" className="w-full">
                Kunde
              </TabsTrigger>
            </TabsList>
            <TabsContent value="normal">
              <div className="w-full flex flex-col gap-2">
                <ScrollArea
                  className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
                  type="always"
                >
                  <div className="grid gap-4 p-1 w-full">
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="role"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Add.role")}
                      </Label>
                      <Select
                        key="role"
                        value={data.role}
                        onValueChange={(role) => setData({ role: role })}
                      >
                        <SelectTrigger className="w-full" id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="admin"
                            className="underline underline-offset-2 decoration-red-500"
                          >
                            {t("Dialogs.Add.roles.admin")}
                          </SelectItem>
                          <SelectItem
                            value="user"
                            className="underline underline-offset-2 decoration-green-500"
                          >
                            {t("Dialogs.Add.roles.user")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="name"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Add.name")}
                      </Label>
                      <Input
                        className="!w-full border-2"
                        autoComplete="name"
                        type="text"
                        name="Name"
                        id="name"
                        placeholder={t("Dialogs.Add.namePlaceholder")}
                        value={data.name}
                        onChange={(e) => setData({ name: e.target.value })}
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="username"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Add.username")}
                      </Label>
                      <Input
                        autoComplete="username"
                        className="!w-full border-2"
                        type="text"
                        name="Name"
                        id="username"
                        placeholder={t("Dialogs.Add.usernamePlaceholder")}
                        value={data.username}
                        onChange={(e) => setData({ username: e.target.value })}
                      />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="password"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Add.password")}
                      </Label>
                      <Input
                        className="!w-full font-mono border-2"
                        autoComplete="current-password"
                        type="password"
                        name="Password"
                        id="password"
                        placeholder={t("Dialogs.Add.passwordPlaceholder")}
                        value={data.password}
                        onChange={(e) => setData({ password: e.target.value })}
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="mail"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Add.mail")}
                      </Label>
                      <Input
                        className="!w-full border-2"
                        autoComplete="email"
                        type="email"
                        name="Mail"
                        id="mail"
                        placeholder={t("Dialogs.Add.mailPlaceholder")}
                        value={data.mail}
                        onChange={(e) => setData({ mail: e.target.value })}
                      />
                    </div>
                  </div>
                </ScrollArea>

                <div className="w-full gap-2 flex flex-row justify-end">
                  <Button
                    variant="outline"
                    onClick={() => send()}
                    disabled={status.loading}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("Dialogs.Add.create")}
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="customer">
              <div className="w-full flex flex-col gap-2">
                <ScrollArea
                  className="h-[60svh] w-full rounded-sm p-2.5 overflow-hidden"
                  type="always"
                >
                  <div className="grid gap-4 p-1 w-full">
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="customers-button"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Add.customer")}
                      </Label>
                      <Popover modal>
                        <PopoverTrigger asChild>
                          <Button
                            id="customers-button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {data.customer ?? t("Dialogs.Add.noCustomers")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-2">
                          <Command className="max-h-[calc(32px+25svh)]">
                            <CommandInput
                              placeholder={t("search")}
                              className="h-8"
                            />
                            {customers.length === 0 ? (
                              <div className="items-center justify-center text-center text-sm text-muted-foreground pt-4">
                                <Link
                                  href="/customers"
                                  prefetch={false}
                                  className={buttonVariants({
                                    variant: "link",
                                    className: "flex-col items-start",
                                  })}
                                >
                                  {t("Dialogs.Add.noCustomersDescription")}
                                </Link>
                              </div>
                            ) : (
                              <CommandList>
                                <CommandGroup className="max-h-none">
                                  {customers.map((customer) => (
                                    <CommandItem
                                      key={`customer-select-${customer}`}
                                      value={customer}
                                      onSelect={() =>
                                        setData({ customer: customer })
                                      }
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          customer == data.customer
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {customer}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="name"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Add.name")}
                      </Label>
                      <Input
                        className="!w-full border-2"
                        type="text"
                        name="Name"
                        id="name"
                        autoComplete="name"
                        placeholder={t("Dialogs.Add.namePlaceholder")}
                        value={data.name}
                        onChange={(e) => setData({ name: e.target.value })}
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="username"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Add.username")}
                      </Label>
                      <Input
                        className="!w-full border-2"
                        type="text"
                        name="Name"
                        id="username"
                        autoComplete="username"
                        placeholder={t("Dialogs.Add.usernamePlaceholder")}
                        value={data.username}
                        onChange={(e) => setData({ username: e.target.value })}
                      />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="password"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Add.password")}
                      </Label>
                      <Input
                        className="!w-full font-mono border-2"
                        type="password"
                        name="Password"
                        id="password"
                        autoComplete="current-password"
                        placeholder={t("Dialogs.Add.passwordPlaceholder")}
                        value={data.password}
                        onChange={(e) => setData({ password: e.target.value })}
                      />
                    </div>

                    <div id="divider" className="h-1" />

                    <div className="grid w-full items-center gap-1.5">
                      <Label
                        htmlFor="mail"
                        className="pl-2 text-muted-foreground"
                      >
                        {t("Dialogs.Add.mail")}
                      </Label>
                      <Input
                        className="!w-full border-2"
                        autoComplete="email"
                        type="email"
                        name="Mail"
                        id="mail"
                        placeholder={t("Dialogs.Add.mailPlaceholder")}
                        value={data.mail}
                        onChange={(e) => setData({ mail: e.target.value })}
                      />
                    </div>
                  </div>
                </ScrollArea>

                <div className="w-full gap-2 flex flex-row justify-end">
                  <Button
                    variant="outline"
                    onClick={() => sendCustomer()}
                    disabled={status.loading || customers.length == 0}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("Dialogs.Add.create")}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
