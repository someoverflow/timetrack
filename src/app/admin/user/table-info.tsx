"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function TableInfo({
  page,
  pages,
}: {
  page: number;
  pages: number;
}) {
  const { push } = useRouter();
  const searchParams = useSearchParams();

  var searchPage = searchParams.get("page");
  useEffect(() => {
    if (searchPage !== page.toString()) changePage(page.toString());
  }, []);

  function changePage(value: string) {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", value);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    push(`/admin/user${query}`);
  }

  return (
    <div className="flex items-center justify-end pr-4 gap-2">
      <Input
        className="w-min"
        type="number"
        min={1}
        max={pages}
        inputMode="numeric"
        defaultValue={page}
        onChange={(e) => {
          const change = Number(e.target.value);
          if (change > pages) {
            changePage(pages.toString());
            return;
          }
          if (change <= 0) {
            changePage("1");
            return;
          }
          changePage(change.toString());
        }}
      />
      <p className="text-base font-semibold font-mono">/ {pages}</p>
    </div>
  );
}
