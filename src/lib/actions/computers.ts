"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { deleteUpload } from "@/lib/uploads";

export interface ActionState {
  error?: string;
}

const computerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function createComputer(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = computerSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const computer = await prisma.computer.create({ data: parsed.data });
  revalidatePath("/");
  redirect(`/computers/${computer.id}`);
}

export async function updateComputer(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = computerSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.computer.update({ where: { id }, data: parsed.data });
  revalidatePath("/");
  revalidatePath(`/computers/${id}`);
  revalidatePath("/parts");
  redirect(`/computers/${id}`);
}

export async function deleteComputer(id: string): Promise<void> {
  const parts = await prisma.part.findMany({
    where: { computerId: id },
    select: { imageUrl: true },
  });

  await prisma.computer.delete({ where: { id } });

  await Promise.all(parts.map((p) => deleteUpload(p.imageUrl)));

  revalidatePath("/");
  revalidatePath("/parts");
  redirect("/");
}
