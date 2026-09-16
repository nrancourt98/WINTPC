"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PartCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, isPartCategory } from "@/lib/categories";
import { deleteUpload, saveUpload } from "@/lib/uploads";
import type { ActionState } from "@/lib/actions/computers";

const baseSchema = z.object({
  label: z.string().trim().min(1, "Name is required").max(200),
  notes: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

function buildSpecsInput(category: PartCategory, formData: FormData) {
  const fields = CATEGORIES[category].fields;
  const raw: Record<string, unknown> = {};
  for (const f of fields) {
    raw[f.key] = formData.get(f.key) ?? "";
  }
  return raw;
}

async function handleImage(
  formData: FormData,
  currentImageUrl: string | null
): Promise<string | null | undefined> {
  const removeImage = formData.get("removeImage") === "on";
  const file = formData.get("image");

  if (file instanceof File && file.size > 0) {
    const filename = await saveUpload(file);
    if (currentImageUrl) await deleteUpload(currentImageUrl);
    return filename;
  }

  if (removeImage && currentImageUrl) {
    await deleteUpload(currentImageUrl);
    return null;
  }

  return undefined; // no change
}

export async function createPart(
  computerId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const categoryRaw = String(formData.get("category") ?? "");
  if (!isPartCategory(categoryRaw)) {
    return { error: "Choose a valid category" };
  }
  const category = categoryRaw as PartCategory;

  const parsedBase = baseSchema.safeParse({
    label: formData.get("label"),
    notes: formData.get("notes"),
  });
  if (!parsedBase.success) {
    return { error: parsedBase.error.issues[0]?.message ?? "Invalid input" };
  }

  const parsedSpecs = CATEGORIES[category].schema.safeParse(
    buildSpecsInput(category, formData)
  );
  if (!parsedSpecs.success) {
    return { error: parsedSpecs.error.issues[0]?.message ?? "Invalid part details" };
  }

  let imageUrl: string | null = null;
  try {
    const result = await handleImage(formData, null);
    imageUrl = result ?? null;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save image" };
  }

  await prisma.part.create({
    data: {
      computerId,
      category,
      label: parsedBase.data.label,
      notes: parsedBase.data.notes ?? null,
      imageUrl,
      specs: parsedSpecs.data as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/computers/${computerId}`);
  revalidatePath("/parts");
  redirect(`/computers/${computerId}`);
}

export async function updatePart(
  partId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const existing = await prisma.part.findUniqueOrThrow({ where: { id: partId } });

  const parsedBase = baseSchema.safeParse({
    label: formData.get("label"),
    notes: formData.get("notes"),
  });
  if (!parsedBase.success) {
    return { error: parsedBase.error.issues[0]?.message ?? "Invalid input" };
  }

  const parsedSpecs = CATEGORIES[existing.category].schema.safeParse(
    buildSpecsInput(existing.category, formData)
  );
  if (!parsedSpecs.success) {
    return { error: parsedSpecs.error.issues[0]?.message ?? "Invalid part details" };
  }

  let imageUrl: string | null | undefined;
  try {
    imageUrl = await handleImage(formData, existing.imageUrl);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save image" };
  }

  await prisma.part.update({
    where: { id: partId },
    data: {
      label: parsedBase.data.label,
      notes: parsedBase.data.notes ?? null,
      specs: parsedSpecs.data as Prisma.InputJsonValue,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  });

  revalidatePath(`/computers/${existing.computerId}`);
  revalidatePath(`/computers/${existing.computerId}/parts/${partId}`);
  revalidatePath("/parts");
  redirect(`/computers/${existing.computerId}/parts/${partId}`);
}

export async function deletePart(partId: string): Promise<void> {
  const existing = await prisma.part.findUniqueOrThrow({ where: { id: partId } });

  await prisma.part.delete({ where: { id: partId } });
  await deleteUpload(existing.imageUrl);

  revalidatePath(`/computers/${existing.computerId}`);
  revalidatePath("/parts");
  redirect(`/computers/${existing.computerId}`);
}
