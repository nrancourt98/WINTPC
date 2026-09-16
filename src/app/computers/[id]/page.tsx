import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, categoryRank } from "@/lib/categories";
import { deleteComputer } from "@/lib/actions/computers";
import { deletePart } from "@/lib/actions/parts";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ComputerDetailPage({ params }: { params: { id: string } }) {
  const computer = await prisma.computer.findUnique({
    where: { id: params.id },
    include: { parts: true },
  });

  if (!computer) notFound();

  const parts = [...computer.parts].sort((a, b) => {
    const rankDiff = categoryRank(a.category) - categoryRank(b.category);
    if (rankDiff !== 0) return rankDiff;
    if (a.position !== b.position) return a.position - b.position;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/" className="text-sm text-neutral-400 hover:underline">
            ← All computers
          </Link>
          <h1 className="text-lg font-medium mt-1">{computer.name}</h1>
          {computer.description && (
            <p className="text-sm text-neutral-400">{computer.description}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Link href={`/computers/${computer.id}/edit`} className="btn-secondary">
            Edit
          </Link>
          <DeleteButton
            action={deleteComputer.bind(null, computer.id)}
            confirmMessage={`Delete "${computer.name}" and all of its parts? This can't be undone.`}
            className="btn-danger"
          >
            Delete
          </DeleteButton>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-400">Parts</h2>
        <Link href={`/computers/${computer.id}/parts/new`} className="btn-primary">
          + Add part
        </Link>
      </div>

      {parts.length === 0 ? (
        <p className="text-sm text-neutral-400">No parts logged yet.</p>
      ) : (
        <ul className="space-y-3">
          {parts.map((part) => (
            <li key={part.id} className="card flex items-center gap-4">
              {part.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/uploads/${part.imageUrl}`}
                  alt=""
                  className="h-14 w-14 flex-shrink-0 rounded object-cover"
                />
              ) : (
                <div className="h-14 w-14 flex-shrink-0 rounded bg-neutral-800" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  {CATEGORIES[part.category].label}
                </p>
                <p className="font-medium truncate">{part.label}</p>
                {part.notes && (
                  <p className="text-sm text-neutral-400 truncate">{part.notes}</p>
                )}
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <Link
                  href={`/computers/${computer.id}/parts/${part.id}`}
                  className="btn-secondary"
                >
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
