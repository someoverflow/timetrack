import { TicketCreated } from "@/emails/ticket-created";
import { sendMail } from "@/lib/mail";
import prisma from "@/lib/prisma";
import { defaultResult, badRequestResponse, api } from "@/lib/server-utils";
import { todoCreateApiValidation, todoUpdateApiValidation } from "@/lib/zod";
import type { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";

// Create a todo (task, description?, deadline?, assignees?)
/*{
	"task": 			<task>
	"description": 		<description?>
	"deadline": 		<Date?>
	"assignees": 		[<username>]?
	"projects": 		[<projectName>]?
	"priority"			"HIGH"-"MEDIUM"-"LOW"
}*/
export const POST = api(
  async (_request, user, json) => {
    if (!user) throw Error("User is undefined");
    if (!json) throw Error("Request is undefined");

    // Prepare data
    const result = defaultResult("created", 201);

    // Validate request
    const validationResult = todoCreateApiValidation.safeParse(json);
    if (!validationResult.success)
      return badRequestResponse(validationResult.error.issues, "validation");
    const data = validationResult.data;

    // Check if user can see ALL given projects
    if (user.role === "CUSTOMER")
      if (!data.projects)
        return badRequestResponse(
          { message: "No Projects given." },
          "error-message",
        );

    if (data.projects) {
      const projectsCheck = await prisma.project.findMany({
        where: {
          name: {
            in: data.projects,
          },
          customer:
            user.role == "CUSTOMER"
              ? {
                  users: {
                    some: {
                      id: user.id,
                    },
                  },
                }
              : undefined,
        },
      });

      if (projectsCheck.length !== data.projects.length)
        return badRequestResponse(
          { message: "Project not found." },
          "error-message",
        );

      const customer = projectsCheck[0]?.customerName;

      for (const projects of projectsCheck) {
        if (projects.customerName !== (customer ?? null))
          return badRequestResponse(
            { message: "Projects are invalid." },
            "error-message",
          );
      }
    }

    // Check if user can see ALL given users
    if (data.assignees && user.role === "CUSTOMER") {
      const usersCheck = await prisma.user.count({
        where: {
          username: {
            in: data.assignees,
          },
          OR: [
            {
              NOT: {
                role: "CUSTOMER",
              },
            },
            {
              customer: {
                users: {
                  some: {
                    id: user.id,
                  },
                },
              },
            },
          ],
        },
      });

      if (usersCheck != data.assignees.length)
        return badRequestResponse("User not found.", "error-message");
    }

    const createData: Prisma.Without<
      Prisma.TicketCreateInput,
      Prisma.TicketUncheckedCreateInput
    > &
      Prisma.TicketUncheckedCreateInput = {
      task: data.task,
      description: data.description,
      deadline: data.deadline ? new Date(data.deadline) : undefined,

      priority: data.priority ?? "MEDIUM",

      assignees: data.assignees
        ? {
            connect: data.assignees.map((username) => ({
              username: username,
            })),
          }
        : undefined,

      projects: data.projects
        ? {
            connect: data.projects.map((name) => ({ name: name })),
          }
        : undefined,

      creatorId: user.id,
      updatedById: user.id,
    };

    // Create the todo
    try {
      const databaseResult = await prisma.ticket.create({
        data: createData,
        include: {
          assignees: {
            select: {
              name: true,
              username: true,
              email: true,
              role: true,
              ticketCreationMail: true,
            },
          },
          projects: {
            select: {
              name: true,
              customer: {
                select: {
                  name: true,
                  users: {
                    select: {
                      email: true,
                      name: true,
                      username: true,
                      ticketCreationMail: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      //#region Mail
      // TODO: Upgrade to NEXT15 and use after
      if (process.env.SMTP_HOST) {
        const mailT = await getTranslations("Mail");
        const receipents: any[] = [];

        if (user.email && user.email !== "" && user.ticketCreationMail)
          receipents.push({
            address: user.email,
            name: user.name ?? user.username,
          });

        const addedCustomers: string[] = [];

        databaseResult.projects.forEach((p) => {
          if (p.customer && !addedCustomers.includes(p.customer.name)) {
            addedCustomers.push(p.customer.name);

            p.customer.users.forEach((u) => {
              if (u.email && u.email !== "" && u.ticketCreationMail) {
                if (receipents.find((r) => r.address == u.email) == undefined)
                  receipents.push({
                    address: u.email,
                    name: u.name ?? u.username,
                  });
              }
            });
          }
        });

        databaseResult.assignees.forEach((u) => {
          if (
            u.email &&
            u.email !== "" &&
            u.role !== "CUSTOMER" &&
            u.ticketCreationMail
          ) {
            if (receipents.find((r) => r.address == u.email) == undefined)
              receipents.push({
                address: u.email,
                name: u.name ?? u.username,
              });
          }
        });

        if (receipents.length !== 0) {
          TicketCreated({
            link: process.env.URL + "/ticket?link=" + databaseResult.id,
            priority: databaseResult.priority.toLowerCase(),
            task: databaseResult.task,
            description: databaseResult.description,
            assignees:
              databaseResult.assignees.length == 0
                ? undefined
                : databaseResult.assignees.map(
                    (assignee) => assignee.name ?? assignee.username,
                  ),
            projects:
              databaseResult.projects.length == 0
                ? undefined
                : databaseResult.projects.map((project) => project.name),
          })
            .then(({ text, html }) => {
              return sendMail({
                receipents,
                subject: mailT("subject", {
                  name: user.name ?? user.username,
                  projectsCount: data.projects?.length ?? 0,
                  projects: data.projects ? data.projects?.join(" / ") : "",
                }),
                priority: { HIGH: "high", MEDIUM: "normal", LOW: "low" }[
                  databaseResult.priority
                ] as "high" | "normal" | "low",
                text,
                html,
              });
            })
            .then((result) =>
              console.log(
                `MAIL Ticket-Created <${databaseResult.id}> ${result.pending ? "Pending" : ""}${result.accepted ? "Accepted" : ""}${result.rejected ? "Rejected" : ""}`,
              ),
            );
        }
      } else console.info("Mailing is not enabled.");
      //#endregion

      result.result = { id: databaseResult.id };
      return NextResponse.json(result, { status: result.status });
    } catch (e) {
      result.success = false;
      result.status = 500;
      result.type = "unknown";
      result.result = `Server issue occurred ${
        e instanceof PrismaClientKnownRequestError ? e.code : ""
      }`;
      console.warn(e);
      return NextResponse.json(result, { status: result.status });
    }
  },
  { allowCustomers: true },
);

// Update a todo
/*

	/?type=<UPDATE(default) | START_PROGRESS | FINISH | ARCHIVE>

	// Changeable by creator & assignees when not archived
	{
		"task": 			<task?>
		"description": 		<description?>
		"status": 			<Status?>
		"priority": 		<Priority?>
		"deadline": 		<Date?>
		"assignees": {
			"add": 			[<username>]?
			"remove": 		[<username>]?
		}?
		"projects": {
			"add": 			[<username>]?
			"remove": 		[<username>]?
		}?
	}
*/
export const PUT = api(
  async (request, user, json) => {
    if (!user) throw Error("User is undefined");
    if (!json) throw Error("Request is undefined");

    // Prepare data
    const result = defaultResult("updated");

    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get("type") ?? "UPDATE").toUpperCase();

    // Validate request
    const validationResult = todoUpdateApiValidation.safeParse(json);
    if (!validationResult.success)
      return badRequestResponse(validationResult.error.issues, "validation");
    const data = validationResult.data;

    // Check if the type can be handled
    if (!["UPDATE", "ARCHIVE", "VISIBILITY"].includes(type))
      return badRequestResponse(
        "Request-Type cannot be processed.",
        "error-message",
      );

    // Get the todo
    const todo = await prisma.ticket
      .findUnique({
        where: {
          id: data.id,
          projects:
            user.role == "CUSTOMER"
              ? {
                  some: {
                    customer: {
                      users: {
                        some: {
                          id: user.id,
                        },
                      },
                    },
                  },
                }
              : undefined,
        },
        include: {
          projects: {
            select: {
              customerName: true,
              name: true,
            },
          },
          assignees: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
      .catch(() => null);

    // Check if todo exists
    if (todo == null)
      return badRequestResponse(
        {
          id: data.id,
          message: "Todo does not exist.",
        },
        "not-found",
      );

    // Check if todo is archived (Archived projects cannot be changed anymore)
    if (todo.archived && type !== "VISIBILITY")
      return badRequestResponse(
        {
          id: data.id,
          message: "Todo is archived.",
        },
        "error-message",
      );

    let projectsToAdd = undefined;
    if (data.projects?.add && data.projects?.add.length !== 0) {
      projectsToAdd = await prisma.project.findMany({
        where: {
          name: {
            in: data.projects.add,
          },
          customer:
            user.role === "CUSTOMER"
              ? {
                  users: {
                    some: {
                      id: user.id,
                    },
                  },
                }
              : undefined,
        },
      });

      if (projectsToAdd.length !== data.projects.add.length)
        return badRequestResponse(
          { message: "Projects invalid." },
          "error-message",
        );
    }

    console.log(data.projects);

    let tempProjects = todo.projects;
    if (data.projects?.remove)
      tempProjects = tempProjects.filter(
        (p) => !data.projects?.remove?.includes(p.name),
      );

    if (projectsToAdd) projectsToAdd.forEach((p) => tempProjects.push(p));

    if (user.role === "CUSTOMER" && tempProjects.length == 0)
      return badRequestResponse(
        { message: "No Projects is not possible." },
        "error-message",
      );

    const customer = tempProjects[0]?.customerName;

    for (const projects of tempProjects) {
      if (projects.customerName !== (customer ?? null))
        return badRequestResponse(
          { message: "Projects are invalid." },
          "error-message",
        );
    }

    // Prepare data
    const isByCreator = todo.creatorId === user.id;

    const updateData: Prisma.Without<
      Prisma.TicketUpdateInput,
      Prisma.TicketUncheckedUpdateInput
    > &
      Prisma.TicketUncheckedUpdateInput = {
      updatedById: user.id,
    };

    switch (type) {
      case "UPDATE":
        updateData.task = data.task;
        updateData.description = data.description;
        updateData.deadline =
          data.deadline !== undefined
            ? data.deadline
              ? new Date(data.deadline)
              : null
            : undefined;

        if (data.status) updateData.status = data.status;
        if (data.priority) updateData.priority = data.priority;

        if (data.assignees) {
          if (data.assignees.add) {
            updateData.assignees = {
              ...updateData.assignees,
              connect: data.assignees.add.map((username) => ({
                username: username,
              })),
            };
          }
          if (data.assignees.remove) {
            updateData.assignees = {
              ...updateData.assignees,
              disconnect: data.assignees.remove.map((username) => ({
                username: username,
              })),
            };
          }
        }

        if (data.projects) {
          updateData.projects = {
            set: tempProjects,
          };
        }
        break;
      case "ARCHIVE":
        if (!isByCreator)
          return badRequestResponse(
            {
              id: data.id,
              message: "Todos can only be archived by the creator.",
            },
            "error-message",
          );

        updateData.archived = true;
        break;

      case "VISIBILITY":
        updateData.hidden = !todo.hidden;
        break;
    }

    // Update Todo Data
    try {
      const databaseResult = await prisma.ticket.update({
        where: {
          id: todo.id,
        },
        data: updateData,
      });

      result.result = databaseResult;
      return NextResponse.json(result, { status: result.status });
    } catch (e) {
      result.success = false;
      result.status = 500;
      result.type = "unknown";
      result.result = `Server issue occurred ${
        e instanceof PrismaClientKnownRequestError ? e.code : ""
      }`;
      console.warn(e);
      return NextResponse.json(result, { status: result.status });
    }
  },
  { allowCustomers: true },
);
