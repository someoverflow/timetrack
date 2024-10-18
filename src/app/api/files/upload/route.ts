import fs from "node:fs";
import { revalidatePath } from "next/cache";
import { extname } from "node:path";
import { authCheck } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";
import { nanoIdValidation } from "@/lib/zod";
import { badRequestResponse } from "@/lib/server-utils";
import { headers } from "next/headers";
import { humanFileSize } from "@/lib/utils";

const uploadsPath = process.env.UPLOADS_PATH ?? "./uploads";

export async function POST(req: NextRequest) {
  // TODO: Translation

  const contentType = headers().get("content-type");
  console.log(contentType);

  const contentLength = headers().get("content-length");
  if (!contentLength)
    return badRequestResponse(
      { message: "Content length missing" },
      "error-message",
    );

  console.log(humanFileSize(BigInt(contentLength)));
  // TOOD: Limit size

  try {
    const formData = await req.formData();

    const { user } = await authCheck();
    if (!user) throw new Error("Not signed in");

    // TODO: Multiple
    const file = formData.get("file") as File;
    if (!file || !(file instanceof File))
      return badRequestResponse({ message: "No file given" }, "error-message");

    // TODO: Check Limit again

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

    console.debug("Upload Folder", folder);
    console.debug("Upload Path", path);

    try {
      // eslint-disable-next-line no-var
      var controller = new AbortController();
      const { signal } = controller;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path, buffer, { signal });

      revalidatePath("/");
    } catch (e) {
      console.warn(e);
      controller!.abort();

      const fileStats = fs.statSync(path);
      if (fileStats) {
        fs.rmSync(path);
      }

      await prisma.ticketUpload.delete({ where: { id: dbUpload.id } });
    }

    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}
