import fs from "node:fs";
import { revalidatePath } from "next/cache";
import { extname } from "node:path";
import { authCheck } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { nanoIdValidation } from "@/lib/zod";
import {
  badRequestResponse,
  createErrorResponse,
  defaultResult,
  NO_AUTH_RESPONSE,
} from "@/lib/server-utils";
import { headers } from "next/headers";
import { humanFileSize } from "@/lib/utils";
import { isMimeTypeSupported } from "@/lib/file-utils";
import { getTranslations } from "next-intl/server";

const uploadsPath = process.env.UPLOADS_PATH ?? "./uploads";

const maxFileSize = Math.pow(1024, 2) * Number(process.env.UPLOAD_LIMIT);

export async function POST(req: NextRequest) {
  const t = await getTranslations("Tickets");

  const head = headers();

  const contentLength = head.get("content-length");
  if (!contentLength || Number(contentLength) > maxFileSize)
    return badRequestResponse(
      {
        message: t("fileInfo", {
          supported: contentLength != null,
          oversized: Number(contentLength) > maxFileSize,
          maxFileSize: humanFileSize(BigInt(maxFileSize)),
        }),
      },
      "error-message",
    );

  try {
    const formData = await req.formData();

    const { user } = await authCheck();
    if (!user) return NO_AUTH_RESPONSE;

    const file = formData.get("file") as File;
    if (!file || !(file instanceof File))
      return badRequestResponse({ message: "No file given" }, "error-message");

    if (!isMimeTypeSupported(file.type) || Number(file.size) > maxFileSize)
      return badRequestResponse(
        {
          message: t("fileInfo", {
            supported: isMimeTypeSupported(file.type),
            oversized: Number(file.size) > maxFileSize,
            maxFileSize: humanFileSize(BigInt(maxFileSize)),
          }),
        },
        "error-message",
      );

    const ticketId = formData.get("ticket");
    const ticket = nanoIdValidation.safeParse(ticketId);
    if (!ticket.success) return badRequestResponse(ticket.error, "validation");

    // Create File in db
    // ID, Name, Size, FileType, Uploader, Ticket
    const dbUpload = await prisma.ticketUpload.create({
      data: {
        name: file.name,
        extension: extname(file.name),
        size: file.size,
        type: file.type,
        creatorId: user.id,
        ticketId: ticket.data,
      },
    });

    const folder = `${uploadsPath}/${ticketId}/`;
    const path = `${folder}${dbUpload.id}${dbUpload.extension}`;

    req.signal.addEventListener("abort", () => {
      abort(dbUpload.id, path);
    });

    try {
      // eslint-disable-next-line no-var
      var controller = new AbortController();
      const { signal } = controller;
      signal.addEventListener("abort", () => {
        abort(dbUpload.id, path);
      });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path, buffer, { signal });

      revalidatePath("/");
    } catch (e) {
      console.warn(e);
    }

    const result = defaultResult("created");
    result.result = { ...dbUpload, size: dbUpload.size.toString() };
    return NextResponse.json(result, {
      status: result.status,
    });
  } catch (e) {
    console.error(e);
    return createErrorResponse(500, "Internal Server Error", "unknown");
  }
}

async function abort(id: string, path: string) {
  fs.rmSync(path, { force: false });

  await prisma.ticketUpload.delete({ where: { id } });
}
