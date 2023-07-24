"use client";

import { XCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState(searchParams.get("error") ? true : false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function start() {
    signIn("credentials", {
      username: username,
      password: password,
      callbackUrl: callbackUrl,
      redirect: true,
    });
  }

  return (
    <main>
      <section className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-center font-mono text-4xl">Sign In</div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
          className="flex flex-col items-center gap-2"
        >
          <input
            className="input input-solid"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          ></input>
          <input
            className="input input-solid"
            placeholder="Passwort"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          ></input>
          <button type="submit" className="btn btn-primary">
            Signin
          </button>
        </form>

        {error && (
          <>
            <div className="absolute bottom-2 alert alert-error max-w-sm w-[95vw]">
              <div className="flex w-full justify-between items-center">
                <div className="flex flex-col">
                  <span>
                    <b>Wrong Credentials</b>
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => setError(false)}
                    className="btn btn-circle btn-solid-error"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
