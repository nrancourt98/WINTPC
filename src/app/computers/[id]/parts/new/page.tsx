import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORY_ORDER, CATEGORIES, isPartCategory } from "@/lib/categories";
import { PartForm } from "@/components/PartForm";
import { createPart } from "@/lib/actions/parts";

export const dynamic = "force-dynamic";

export default async function NewPartPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { category?: string };
}) {
  const computer = await prisma.computer.findUnique({ where: { id: params.id } });
  if (!computer) notFound();

  const category = searchParams.category;

  if (!category || !isPartCategory(category)) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href={`/computers/${computer.id}`}
            className="text-sm text-neutral-400 hover:underline"
          >
            ← {computer.name}
          </Link>
          <h1 className="text-lg font-medium mt-1">Add a part</h1>
        </div>
        <p className="text-sm text-neutral-400">Choose a category to start.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORY_ORDER.map((cat) => (
            <Link
              key={cat}
              href={`/computers/${computer.id}/parts/new?category=${cat}`}
              className="card text-center hover:bg-neutral-900"
            >
              {CATEGORIES[cat].label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/computers/${computer.id}`}
          className="text-sm text-neutral-400 hover:underline"
        >
          ← {computer.name}
        </Link>
        <h1 className="text-lg font-medium mt-1">Add {CATEGORIES[category].label}</h1>
      </div>
      <PartForm category={category} action={createPart.bind(null, computer.id)} />
    </div>
  );
}
