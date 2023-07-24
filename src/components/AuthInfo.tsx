"use client";

import { LogIn, LogOut } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthInfo({
  text = "Welcome",
  showName = true,
}: {
  text?: string;
  showName?: boolean;
}) {
  const { data: session } = useSession();
  if (session) {
    return (
      <>
        <div className="w-[80vw] flex flex-row justify-between items-center">
          <p className="text-xl">
            {text} {showName && <b>{session.user?.name}</b>}
          </p>
          <button className="btn btn-circle btn-sm" onClick={() => signOut()}>
            <LogOut className="w-1/2 h-1/2" />
          </button>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="w-[80vw] flex flex-row justify-between items-center">
        <div className="flex flex-row items-center gap-2">
          <p className="text-xl">{text}</p>
          {showName && <div className="h-6 w-24 skeleton rounded-md"></div>}
        </div>
        <button
          title="login"
          className="btn btn-circle btn-sm"
          onClick={() => signIn()}
        >
          <LogIn className="w-1/2 h-1/2" />
        </button>
      </div>
    </>
  );
}
