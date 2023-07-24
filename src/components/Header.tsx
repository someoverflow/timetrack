"use client";

import { Menu } from "lucide-react";

export default function Header({ text = "Page" }: { text?: string }) {
  return (
    <>
      <div className="w-full flex flex-row gap-2 items-center">
        <label
          htmlFor="sidebar-mobile-fixed"
          className="btn btn-outline btn-circle sm:hidden"
        >
          <Menu className="w-1/2 h-1/2" />
        </label>
        <p className="text-xl">{text}</p>
      </div>
    </>
  );
}
