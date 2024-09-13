//#region Imports
import Navigation from "@/components/navigation";

import ProfileSection from "./profile-section";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { authCheck, lucia } from "@/lib/auth";
import { userAgentFromString } from "next/server";
import { cn } from "@/lib/utils";
import type { Session } from "lucia";
import {
  CircleHelp,
  Cpu,
  Gamepad2,
  Smartphone,
  Tablet,
  Tv,
  Watch,
} from "lucide-react";
import { invalidateSession } from "./actions";
import { Badge } from "@/components/ui/badge";
//#endregion

export async function generateMetadata() {
  const t = await getTranslations({ namespace: "Profile.Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Profile() {
  const auth = await authCheck();
  if (!auth.user || !auth.data) return redirect("/login");
  const user = auth.user;

  const t = await getTranslations("Profile");
  const locale = await getLocale();

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { language: true },
  });

  const sessions = await lucia.getUserSessions(user.id);

  return (
    <Navigation>
      <section className="w-full max-h-[95svh] flex flex-col items-center gap-1 p-4">
        <div className=" font-mono text-center pt-2 ">
          <div className="text-2xl font-mono relative">
            {t("title")}
            <Badge
              variant="default"
              className="absolute top-0 -right-1/2 translate-x-1/2"
            >
              {user.username}
            </Badge>
          </div>
        </div>

        <ProfileSection userData={user} language={userData?.language} />

        <section className="max-w-md w-[95vw] overflow-hidden flex flex-col items-start">
          <h1 className="text-sm text-muted-foreground">{t("sessions")}</h1>
          <div className="rounded-md grid grid-flow-col grid-rows-1 sm:grid-rows-2 w-full overflow-x-auto gap-2 p-2">
            {sessions.map((session) => (
              <SessionInfo
                key={session.id}
                session={session}
                userSession={auth.data.session}
                locale={locale}
              />
            ))}
          </div>
        </section>
      </section>
    </Navigation>
  );
}

const SessionInfo = ({
  session,
  userSession,
  locale,
}: {
  session: Session;
  userSession: Session;
  locale: string;
}) => {
  const agent = userAgentFromString(session.userAgent);

  const isSession = session.id === userSession.id;

  let Icon = <CircleHelp className="size-5" />;

  switch (agent.device.vendor) {
    case "Apple":
      Icon = AppleIcon;
      break;
    default:
      break;
  }

  switch (agent.device.type) {
    case "console":
      Icon = <Gamepad2 className="size-5" />;
      break;
    case "mobile":
      Icon = <Smartphone className="size-5" />;
      break;
    case "tablet":
      Icon = <Tablet className="size-5" />;
      break;
    case "smarttv":
      Icon = <Tv className="size-5" />;
      break;
    case "wearable":
      Icon = <Watch className="size-5" />;
      break;
    case "embedded":
      Icon = <Cpu className="size-5" />;
      break;
    default:
      break;
  }

  return (
    <form action={invalidateSession} className="h-fit">
      <input type="hidden" value={session.id} name="session" />
      <button
        type="submit"
        className={cn(
          "min-w-52 p-4 rounded-md bg-secondary text-nowrap",
          isSession && "bg-primary-foreground border-border border",
          session.expiresAt <= new Date() && "border-destructive",
        )}
      >
        <div className="flex flex-row justify-center gap-1">
          {Icon}
          <h1>{agent.os.name}</h1>
        </div>
        <p>{agent.browser.name}</p>
        <div className="my-2">
          <p className="text-sm text-muted-foreground">
            {`${new Date(session.createdAt + "").toLocaleDateString(locale)} - ${session.expiresAt.toLocaleDateString(locale)}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {session.expiresAt.toLocaleTimeString(locale)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{session.ip}</p>
      </button>
    </form>
  );
};

const AppleIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className="fill-primary size-5"
  >
    <path d="M22 17.607c-.786 2.28-3.139 6.317-5.563 6.361-1.608.031-2.125-.953-3.963-.953-1.837 0-2.412.923-3.932.983-2.572.099-6.542-5.827-6.542-10.995 0-4.747 3.308-7.1 6.198-7.143 1.55-.028 3.014 1.045 3.959 1.045.949 0 2.727-1.29 4.596-1.101.782.033 2.979.315 4.389 2.377-3.741 2.442-3.158 7.549.858 9.426zm-5.222-17.607c-2.826.114-5.132 3.079-4.81 5.531 2.612.203 5.118-2.725 4.81-5.531z" />
  </svg>
);

// const ChromeIcon = (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     width="24"
//     height="24"
//     viewBox="0 0 24 24"
//     className="fill-primary size-5"
//   >
//     <path d="M2.897 4.181c2.43-2.828 5.763-4.181 9.072-4.181 4.288 0 8.535 2.273 10.717 6.554-2.722.001-6.984 0-9.293 0-1.674.001-2.755-.037-3.926.579-1.376.724-2.415 2.067-2.777 3.644l-3.793-6.596zm5.11 7.819c0 2.2 1.789 3.99 3.988 3.99s3.988-1.79 3.988-3.99-1.789-3.991-3.988-3.991-3.988 1.791-3.988 3.991zm5.536 5.223c-2.238.666-4.858-.073-6.293-2.549-1.095-1.891-3.989-6.933-5.305-9.225-1.33 2.04-1.945 4.294-1.945 6.507 0 5.448 3.726 10.65 9.673 11.818l3.87-6.551zm2.158-9.214c1.864 1.734 2.271 4.542 1.007 6.719-.951 1.641-3.988 6.766-5.46 9.248 7.189.443 12.752-5.36 12.752-11.972 0-1.313-.22-2.66-.69-3.995h-7.609z" />
//   </svg>
// );
