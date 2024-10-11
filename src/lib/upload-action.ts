"use server";
import fs from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { authCheck } from "./auth";

const uploadsPath = process.env.UPLOADS_PATH ?? "./uploads";

export async function uploadFile(formData: FormData) {
  const { user } = await authCheck();
  if (!user) throw new Error("Not signed in");

  const file = formData.get("file") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  await fs.mkdir(uploadsPath, { recursive: true });
  await fs.writeFile(`${uploadsPath}/${file.name}`, buffer);

  revalidatePath("/");
}
