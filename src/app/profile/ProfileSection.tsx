"use client";

import SettingSection from "./SettingSection";

import { useState } from "react";

export default function ProfileSection({
  user,
}: {
  user: {
    username: string;
    name: string;
    email: string;
    role: string;
    chips: { id: string; userId: number; createdAt: Date; updatedAt: Date }[];
  } | null;
}) {
  const [error, setError] = useState<ErrorDetails | undefined>();

  const defaultContent = "Try it again or try reloading the page";

  return (
    <>
      <SettingSection
        title="Name"
        dbIndicator="name"
        username={user?.username + ""}
        defaultValue={user?.name + ""}
        placeholder="Max Mustermann"
        error={() =>
          setError({
            type: "error",
            title: `An error occurred changing name`,
            content: defaultContent,
          })
        }
      />
      <SettingSection
        title="Mail"
        inputType="email"
        dbIndicator="email"
        username={user?.username + ""}
        defaultValue={user?.email + ""}
        placeholder="max@muster.mann"
        error={() =>
          setError({
            type: "error",
            title: `An error occurred changing email`,
            content: defaultContent,
          })
        }
      />
      <SettingSection
        title="Password"
        inputType="password"
        dbIndicator="password"
        username={user?.username + ""}
        placeholder="Secure123"
        error={() =>
          setError({
            type: "error",
            title: `An error occurred changing password`,
            content: defaultContent,
          })
        }
      />

      {error && (
        <>
          <div
            className={`fixed bottom-2 left-2 max-w-sm w-[85vw] alert ${
              error.type == "warning" && "alert-warning"
            } ${error.type == "error" && "alert-error"}`}
          >
            <div className="flex flex-col">
              <span className="text-content1 text-base font-bold">
                {error.title}
              </span>
              <span className="text-content2 text-sm">{error.content}</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
