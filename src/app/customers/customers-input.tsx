"use client";

//#region Imports
import { Button } from "@/components/ui/button";
import { CommandInput } from "@/components/ui/command";
import useRequest from "@/lib/hooks/useRequest";
import { cn } from "@/lib/utils";
import { Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
//#endregion

export const CustomersInput = () => {
  const router = useRouter();
  const t = useTranslations("Customers");

  const [input, setInput] = useState("");

  const { status: createStatus, send: sendCreate } = useRequest(
    useCallback(
      () =>
        fetch("/api/project", {
          method: "POST",
          body: JSON.stringify({
            name: input,
            type: "CUSTOMER",
          }),
        }),
      [input],
    ),
    (_result) => {
      setInput("");
      toast.success(t("created"));
      router.refresh();
    },
  );

  return (
    <div className="flex flex-row items-center gap-2 p-2">
      <div className="w-full p-1 px-2">
        <CommandInput
          placeholder={t("searchPlaceholder")}
          value={input}
          onValueChange={setInput}
          className="h-8"
        />
      </div>
      <div className="w-max h-full">
        <Button
          className={cn("transition-all duration-200", input === "" && "w-0")}
          onClick={() => sendCreate()}
          size="icon"
        >
          {createStatus.loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
