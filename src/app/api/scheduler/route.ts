import {
  type TicketCreatedMailData,
  TicketUpdate,
} from "@/emails/ticket-update";
import { sendMail } from "@/lib/mail";
import prisma from "@/lib/prisma";
import { defaultResult, api } from "@/lib/server-utils";
import { getTranslations } from "next-intl/server";
import { NextResponse, userAgent } from "next/server";

export const GET = api(
  async (request, _user, _json) => {
    const result = defaultResult("ok");

    // Check curl
    const agent = userAgent({ headers: request.headers });
    console.log("Scheduler AGENT", agent.ua);
    if (!agent.ua.startsWith("curl/"))
      return NextResponse.json(result, { status: result.status });

    // Check IP
    console.log("Scheduler HOST", request.nextUrl.hostname);
    if (
      request.nextUrl.hostname !== "0.0.0.0" &&
      process.env.NODE_ENV != "development"
    )
      return NextResponse.json(result, { status: result.status });

    const secret = request.nextUrl.searchParams.get("DUH");
    console.log("Scheduler SECRET", secret);
    if (secret != process.env.SCHEDULER_SECRET)
      return NextResponse.json(result, { status: result.status });

    const t = await getTranslations("Mail");

    console.log("!!! Scheduler Called");

    if (process.env.SMTP_HOST == undefined) {
      console.info("Mailing is not enabled.");
      return NextResponse.json("Mailing is not enabled", {
        status: result.status,
      });
    }

    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);

    const prismaToday = {
      gte: today,
    };

    const users = await prisma.user.findMany({
      where: {
        NOT: {
          email: null,
          username: "admin",
        },
        ticketUpdateMail: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        customerName: true,
        language: true,
      },
    });

    for (const user of users) {
      if (user.email == null) continue;

      // Get all changes in tickets (created today / edited today)
      const tickets = await prisma.ticket.findMany({
        where: {
          AND: {
            hidden: false,
            archived: false,

            OR:
              user.role == "CUSTOMER"
                ? [
                    {
                      creatorId: user.id,
                    },
                    {
                      assignees: {
                        some: {
                          id: user.id,
                        },
                      },
                    },
                    {
                      projects:
                        user.role === "CUSTOMER"
                          ? {
                              some: {
                                customerName: user.customerName,
                              },
                            }
                          : undefined,
                    },
                  ]
                : undefined,
          },

          OR: [
            {
              createdAt: prismaToday,
            },
            {
              updatedAt: prismaToday,
            },
          ],
        },
        include: {
          creator: {
            select: {
              name: true,
              username: true,
            },
          },
          updatedBy: {
            select: {
              name: true,
              username: true,
            },
          },
          assignees: {
            where:
              user.role == "CUSTOMER"
                ? {
                    OR: [
                      {
                        customer: {
                          users: { some: { id: user.id } },
                        },
                      },
                      { role: { not: "CUSTOMER" } },
                    ],
                  }
                : {},
            select: {
              name: true,
              username: true,
              email: true,
              role: true,
              customer: true,
            },
          },
          projects: {
            where:
              user.role == "CUSTOMER"
                ? {
                    customer: {
                      users: { some: { id: user.id } },
                    },
                  }
                : undefined,
            select: {
              name: true,
              customer: true,
            },
          },
        },
      });

      if (tickets.length == 0) continue;

      const ticketLink = process.env.URL + "/ticket?link=";

      const groupedTickets = Object.groupBy(tickets, (ticket) => {
        return ticket.createdAt.getTime() == ticket.updatedAt.getTime()
          ? "created"
          : "updated";
      });

      const createdTickets = groupedTickets.created ?? [];
      const updatedTickets = groupedTickets.updated ?? [];

      await TicketUpdate({
        created: createdTickets.map(
          ({
            id,
            priority,
            status,
            task,
            description,
            assignees,
            projects,
            createdAt,
            creator,
          }) => ({
            link: ticketLink + id,
            assignees:
              assignees.length == 0
                ? null
                : assignees.map((a) => a.name ?? a.username).join(", "),
            projects:
              projects.length == 0
                ? null
                : projects.map((p) => p.name).join(", "),
            priority: priority.toString(),
            status,
            task,
            description: description ?? undefined,
            createdAt: createdAt.toLocaleString(user.language),
            createdBy: creator.name ?? creator.username,
          }),
        ),
        updated: updatedTickets.map(
          ({
            id,
            priority,
            status,
            task,
            description,
            assignees,
            projects,
            updatedAt,
            updatedBy,
            creator,
          }) => ({
            link: ticketLink + id,
            assignees: assignees.map((a) => a.name ?? a.username).join(", "),
            projects: projects.map((p) => p.name).join(", "),
            priority: priority.toString(),
            status,
            task,
            description: description ?? undefined,
            updatedAt: updatedAt.toLocaleString(user.language),
            updatedBy:
              updatedBy?.name ??
              updatedBy?.username ??
              creator.name ??
              creator.username,
          }),
        ),
      } satisfies TicketCreatedMailData)
        .then(({ text, html }) => {
          return sendMail({
            receipents: [
              {
                address: user.email ?? "",
                name: user.name ?? user.username,
              },
            ],
            subject: t("updateSubject"),
            text,
            html,
          });
        })
        .then((result) =>
          console.log(
            `* MAIL UPDATE ${result.pending ? "Pending" : ""}${result.accepted ? "Accepted" : ""}${result.rejected ? "Rejected" : ""}`,
          ),
        );
    }

    // Send mail?
    return NextResponse.json({ ok: true }, { status: 404 });
  },
  { verifySession: false, parseJson: false },
);
