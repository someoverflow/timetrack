"use client";

import { Save } from "lucide-react";
import { HTMLInputTypeAttribute, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingSection({
  title,
  placeholder,
  dbIndicator,
  defaultValue = "",
  username,
  inputType,
}: {
  title: string;
  username: string;
  dbIndicator: string;
  placeholder?: string | undefined;
  defaultValue?: string;
  inputType?: HTMLInputTypeAttribute | undefined;
}) {
  const [value, changeValue] = useState(defaultValue);
  const router = useRouter();

  function change() {
    fetch("/api/profile", {
      method: "POST",
      body: JSON.stringify({
        username: username,
        dbIndicator: dbIndicator,
        value: value,
      }),
    })
      .then((result) => result.json())
      .then((result) => {
        changeValue(defaultValue);

        router.push("/");
        router.refresh();
        console.log(result);
      })
      .catch(console.error);
  }

  return (
    <div>
      <p className="flex flex-row items-center gap-2 text-content3 text-md font-mono pb-1">
        <div className="divider divider-vertical h-4 w-2 m-0" />
        {title}
      </p>

      <div className="w-full flex flex-row items-center justify-between gap-1">
        <input
          type={inputType}
          className="w-full input input-solid input-block"
          name={title}
          id={title}
          placeholder={placeholder}
          value={value}
          onChange={(e) => changeValue(e.target.value)}
        />
        <div>
          <button className="btn btn-circle" onClick={() => change()}>
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
