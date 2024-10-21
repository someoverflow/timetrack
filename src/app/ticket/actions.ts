"use server";

import { authCheck } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { nanoIdValidation } from "@/lib/zod";
import { revalidatePath } from "next/cache";
import fs from "fs";

const uploadsPath = process.env.UPLOADS_PATH ?? "./uploads";

export async function deleteUpload(formData: FormData) {
  const auth = await authCheck();
  const user = auth.user;

  if (!user) return;

  const id = formData.get("id");

  const validation = nanoIdValidation.safeParse(id);
  if (!validation.success) return;

  try {
    const result = await prisma.ticketUpload.delete({
      where: {
        id: validation.data,
        creatorId: user.role == "ADMIN" ? undefined : user.id,
      },
    });

    const path = `${uploadsPath}/${result.ticketId}/${result.id}${result.extension}`;

    fs.rmSync(path, { force: true });
  } catch (e) {}

  revalidatePath("/");
}
