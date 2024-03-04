"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function TableInfo({
  page,
  pages,
}: {
  page: number;
  pages: number;
}) {
  const input = useRef<HTMLInputElement | null>(null);
  const { push } = useRouter();
  const searchParams = useSearchParams();

  const changePage = useDebouncedCallback((value: string) => {
    const change = Number(value);
    if (change > pages) return;
    if (change <= 0) return;

    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("page", value);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    if (input.current) input.current.value = value;
    push(`/admin/user${query}`);
  }, 100);

  var searchPage = searchParams.get("page");
  useEffect(() => {
    if (searchPage !== page.toString()) changePage(page.toString());
  }, [changePage, page, searchPage]);

  return (
    <div className="flex flex-row items-center justify-end pr-4 gap-2 w-full">
      <Button
        size="icon"
        variant="outline"
        disabled={page - 1 <= 0}
        onClick={() => changePage(String(page - 1))}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <Input
        ref={input}
        className="w-min"
        type="number"
        min={1}
        max={pages}
        inputMode="numeric"
        defaultValue={page}
        onChange={(e) => changePage(e.target.value)}
      />
      <p className="text-base font-semibold font-mono">/ {pages}</p>
      <Button
        size="icon"
        variant="outline"
        disabled={page + 1 > pages}
        onClick={() => changePage(String(page + 1))}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
