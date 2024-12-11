import { authCheck } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import { notFound } from "next/navigation";
import { type NextRequest } from "next/server";

const uploadsPath = process.env.UPLOADS_PATH ?? "./uploads";

export async function GET(
  _req: NextRequest,
  { params }: { params: { file: string; name: string } },
) {
  const auth = await authCheck();
  const user = auth.user;
  if (!user) notFound();

  const upload = await prisma.ticketUpload.findUnique({
    where: {
      id: params.file,
      name: params.name,
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

  const folder = `${uploadsPath}/${upload.ticketId}/`;
  const path = `${folder}${upload.id}${upload.extension}`;

  const file = fs.readFileSync(path);

  const headers = new Headers();
  headers.set("Content-Type", upload.type);
  headers.set("Content-Length", upload.size + "");

  return new Response((file.buffer as any), {
    headers,
  });
}
