"use server";
import { authCheck, lucia } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function invalidateSession(formData: FormData): Promise<void> {
  const session = formData.get("session");
  if (typeof session !== "string") return;

  const auth = await authCheck();
  if (!auth.user) return;

  const userSessions = await lucia.getUserSessions(auth.user.id);

  if (userSessions.find((sessions) => sessions.id == session) !== undefined)
    await lucia.invalidateSession(session);

  return redirect("/profile");
}
