import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import type { Role } from "@prisma/client";
import { Lucia, type Session, type User as LuciaUser } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";

const client = prisma;
const adapter = new PrismaAdapter(client.session, client.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: true,
    },
  },
  getSessionAttributes: (attributes: any) => {
    return {
      ip: attributes.ip,
      userAgent: attributes.user_agent,
      createdAt: attributes.createdAt,
    };
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
    };
  },
});

export const validateRequest = cache(
  async (): Promise<
    { user: LuciaUser; session: Session } | { user: null; session: null }
  > => {
    const cookie = await cookies();

    const sessionId = cookie.get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    const result = await lucia.validateSession(sessionId);
    // next.js throws when you attempt to set cookie when rendering page
    try {
      if (!!result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookie.set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookie.set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch {}

    return result;
  },
);
export async function userData(session: Session) {
  return await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      name: true,
      language: true,
      role: true,
      email: true,
      ticketCreationMail: true,
      ticketUpdateMail: true,
    },
  });
}

export const authCheck = cache(async () => {
  const data = await validateRequest();
  if (data.session && data.user) {
    const user = await userData(data.session);
    return { data, user };
  }
  return { data };
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
  interface DatabaseSessionAttributes {
    ip: string;
    user_agent: string;
    createdAt: Date;
  }
}

interface DatabaseUserAttributes {
  username: string;
  name: string;
  email: string | undefined | null;
  role: Role;
}
