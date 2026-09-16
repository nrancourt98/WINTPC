import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/categories";
import { PartForm } from "@/components/PartForm";
import { updatePart } from "@/lib/actions/parts";

export const dynamic = "force-dynamic";

export default async function EditPartPage({
  params,
}: {
  params: { id: string; partId: string };
}) {
  const part = await prisma.part.findUnique({ where: { id: params.partId } });
  if (!part || part.computerId !== params.id) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/computers/${params.id}`} className="text-sm text-neutral-400 hover:underline">
          ← Back
        </Link>
        <h1 className="text-lg font-medium mt-1">Edit {CATEGORIES[part.category].label}</h1>
      </div>
      <PartForm
        category={part.category}
        action={updatePart.bind(null, part.id)}
        defaultValues={{
          label: part.label,
          notes: part.notes,
          imageUrl: part.imageUrl,
          specs: (part.specs as Record<string, unknown>) ?? {},
        }}
      />
    </div>
  );
}
