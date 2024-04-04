"use client";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

// Auth
import { signIn } from "next-auth/react";

// Navigation
import { useRouter, useSearchParams } from "next/navigation";

// React
import { useState } from "react";

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    var result = await signIn("credentials", {
      username: username,
      password: password,
      callbackUrl: callbackUrl,
      redirect: false,
    });
    if (result) {
      if (result.status == 200) {
        router.push(result.url ? result.url : callbackUrl);
        return;
      }
      if (result.error === "CredentialsSignin") {
        toast.error("Wrong Credentials", {
          description: "Try again with a different username and password",
        });
      }
    } else
      toast.error("No result data", {
        description: "Try again now or later",
      });
    setLoading(false);
  }

  return (
    <main className="min-h-[90svh] flex flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
          >
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button type="submit" variant="outline" disabled={loading}>
                Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
