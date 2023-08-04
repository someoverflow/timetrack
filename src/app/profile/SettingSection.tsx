"use client";

import { Save } from "lucide-react";
import { HTMLInputTypeAttribute, useState } from "react";

export default function SettingSection({
  title,
  placeholder,
  defaultValue = "",
  username,
  inputType,
}: {
  title: string;
  username: string;
  placeholder?: string | undefined;
  defaultValue?: string;
  inputType?: HTMLInputTypeAttribute | undefined;
}) {
  const [value, changeValue] = useState(defaultValue);

  function change() {
    // send the request
  }

  return (
    <>
      <p className="text-content3 text-md font-mono">{title}</p>
      <div className="flex flex-row items-center gap-2">
        <input
          type={inputType}
          className="input input-solid"
          name={title}
          id={title}
          placeholder={placeholder}
          value={value}
          onChange={(e) => changeValue(e.target.value)}
        />
        <button className="btn btn-solid-primary">
          <Save className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}
