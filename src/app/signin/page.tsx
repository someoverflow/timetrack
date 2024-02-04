"use client";

// UI
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    <main className="min-h-dvh flex flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Create project</CardTitle>
          <CardDescription>Deploy your new project in one-click.</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Name of your project" />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
        </CardFooter>
      </Card>

      {/**
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
       */}
    </main>
  );
}
