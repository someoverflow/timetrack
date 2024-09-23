"use client";

//#region Imports
import { Button } from "@/components/ui/button";
import useRequest from "@/lib/hooks/useRequest";
import { Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
//#endregion

export const CustomerDelete = ({ customer }: { customer: string }) => {
  const router = useRouter();
  const t = useTranslations("Customers");

  const { status: deleteStatus, send: sendDelete } = useRequest(
    () =>
      fetch("/api/project", {
        method: "DELETE",
        body: JSON.stringify({
          id: customer,
          type: "CUSTOMER",
        }),
      }),

    (_result) => {
      toast.success(t("deleted"));
      router.refresh();
    },
  );

  return (
    <Button
      size="icon"
      variant="destructive"
      className="transition-all duration-150 opacity-0 group-hover:opacity-100"
      disabled={deleteStatus.loading}
      onClick={(e) => {
        e.stopPropagation();
        sendDelete();
      }}
    >
      <Trash className="size-4" />
    </Button>
  );
};
