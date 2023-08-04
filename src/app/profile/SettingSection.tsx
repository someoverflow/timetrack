"use client";

import {Save} from "lucide-react";
import {HTMLInputTypeAttribute, useState} from "react";
import {useRouter} from 'next/navigation'

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

        console.log(value)

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
                changeValue(defaultValue)

                router.push("/");
                router.refresh()
                console.log(result);
            })
            .catch(console.error);

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
                <button className="btn btn-solid-primary" onClick={() => change()}>
                    <Save className="w-5 h-5"/>
                </button>
            </div>
        </>
    );
}
