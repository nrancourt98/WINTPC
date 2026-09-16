import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, getPartAllStats } from "@/lib/categories";
import { deletePart } from "@/lib/actions/parts";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function PartDetailPage({
  params,
}: {
  params: { id: string; partId: string };
}) {
  const part = await prisma.part.findUnique({
    where: { id: params.partId },
    include: { computer: { select: { id: true, name: true } } },
  });
  if (!part || part.computerId !== params.id) notFound();

  const stats = getPartAllStats(part.category, (part.specs as Record<string, unknown>) ?? {});

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/computers/${part.computer.id}`}
            className="text-sm text-neutral-400 hover:underline"
          >
            ← {part.computer.name}
          </Link>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mt-1">
            {CATEGORIES[part.category].label}
          </p>
          <h1 className="text-lg font-medium">{part.label}</h1>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Link href={`/computers/${part.computerId}/parts/${part.id}/edit`} className="btn-secondary">
            Edit
          </Link>
          <DeleteButton
            action={deletePart.bind(null, part.id)}
            confirmMessage={`Delete "${part.label}"?`}
            className="btn-danger"
          >
            Delete
          </DeleteButton>
        </div>
      </div>

      {part.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/uploads/${part.imageUrl}`}
          alt=""
          className="h-40 w-40 rounded-lg object-cover"
        />
      )}

      {stats.length > 0 ? (
        <dl className="card grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">{s.label}</dt>
              <dd className="text-sm">{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-neutral-400">No details added yet.</p>
      )}

      {part.notes && (
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{part.notes}</p>
        </div>
      )}
    </div>
  );
}
