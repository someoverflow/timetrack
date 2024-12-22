import { authCheck } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import fs from "fs";
import { createErrorResponse, defaultResult } from "@/lib/server-utils";

const uploadsPath = process.env.UPLOADS_PATH ?? "./uploads";

export async function GET(_req: NextRequest, props: { params: Promise<{ file: string }> }) {
  const params = await props.params;
  const auth = await authCheck();
  const user = auth.user;
  if (!user) notFound();

  const upload = await prisma.ticketUpload.findUnique({
    where: {
      id: params.file,
      OR: [
        { creatorId: user.id },
        {
          ticket: {
            OR: [
              { creatorId: user.id },
              { assignees: { some: { id: user.id } } },
              {
                projects: {
                  some: { customer: { users: { some: { id: user.id } } } },
                },
              },
            ],
          },
        },
      ],
    },
  });

  if (!upload) notFound();

  redirect(`/api/files/${upload.id}/${upload.name}`);
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ file: string }> }) {
  const params = await props.params;
  const auth = await authCheck();
  const user = auth.user;
  if (!user) notFound();

  const upload = await prisma.ticketUpload.findUnique({
    where: {
      id: params.file,
      creatorId: user.role === "ADMIN" ? undefined : user.id,
    },
  });

  if (!upload) notFound();

  try {
    const result = await prisma.ticketUpload.delete({
      where: upload,
    });

    const path = `${uploadsPath}/${result.ticketId}/${result.id}${result.extension}`;

    fs.rmSync(path, { force: true });
  } catch (e) {
    console.warn(e);
    return createErrorResponse(500, "Internal Server Error", "unknown");
  }

  const result = defaultResult("deleted");
  result.result = params.file;
  return NextResponse.json(result, {
    status: result.status,
  });
}
