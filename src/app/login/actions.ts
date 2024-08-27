"use server";
import { cookies, headers } from "next/headers";
import { lucia } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function login(
  _: any,
  formData: FormData,
): Promise<{
  error: string;
  update: Date;
}> {
  const head = headers();

  const username = formData.get("username");
  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 31 ||
    !/^[a-z0-9_-]+$/.test(username)
  ) {
    return {
      update: new Date(),
      error: "Invalid username",
    };
  }
  const password = formData.get("password");
  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return {
      update: new Date(),
      error: "Invalid password",
    };
  }

  const user = await prisma.user
    .findUnique({
      where: {
        username: username,
      },
    })
    .catch(() => undefined);

  if (user === undefined) {
    return {
      update: new Date(),
      error: "There is an issue with the database.",
    };
  }

  if (!user) {
    return {
      update: new Date(),
      error: "Incorrect username or password",
    };
  }

  // TODO: Migrate to @node-rs/argon2 ( import { verify } from "@node-rs/argon2"; )
  //const validPassword = await verify(user.password, password, {
  //  memoryCost: 19456,
  //  timeCost: 2,
  //  outputLen: 32,
  //  parallelism: 1,
  //});
  const validPassword = await compare(password, user.password);
  if (!validPassword) {
    return {
      update: new Date(),
      error: "Incorrect username or password",
    };
  }

  let ip = head.get("x-real-ip") ?? head.get("x-forwarded-for") ?? "?";
  if (ip.substr(0, 7) == "::ffff:") ip = ip.substr(7);

  const session = await lucia.createSession(user.id, {
    user_agent: head.get("user-agent"),
    ip: ip,
  });
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect("/");
}
