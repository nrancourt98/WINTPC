import Link from "next/link";
import { notFound } from "next/navigation";
import type { Part, PartCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, ESSENTIAL_CATEGORIES, getPartSummaryStats } from "@/lib/categories";
import { deleteComputer } from "@/lib/actions/computers";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ComputerDetailPage({ params }: { params: { id: string } }) {
  const computer = await prisma.computer.findUnique({
    where: { id: params.id },
    include: { parts: true },
  });

  if (!computer) notFound();

  const partsByCategory = new Map<PartCategory, Part[]>();
  for (const part of computer.parts) {
    const list = partsByCategory.get(part.category) ?? [];
    list.push(part);
    partsByCategory.set(part.category, list);
  }
  for (const list of partsByCategory.values()) {
    list.sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  const otherParts = partsByCategory.get("OTHER") ?? [];

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

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-neutral-400">Parts</h2>

        {ESSENTIAL_CATEGORIES.map((category) => {
          const items = partsByCategory.get(category) ?? [];
          return (
            <div key={category}>
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                {CATEGORIES[category].label}
              </p>
              {items.length === 0 ? (
                <Link
                  href={`/computers/${computer.id}/parts/new?category=${category}`}
                  className="card flex items-center justify-center border-dashed text-sm text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
                >
                  + Add {CATEGORIES[category].label}
                </Link>
              ) : (
                <div className="space-y-2">
                  {items.map((part) => (
                    <PartRow key={part.id} computerId={computer.id} part={part} />
                  ))}
                  <Link
                    href={`/computers/${computer.id}/parts/new?category=${category}`}
                    className="block text-xs text-neutral-500 hover:text-neutral-300"
                  >
                    + Add another {CATEGORIES[category].label}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-400">Other parts</h2>
          <Link href={`/computers/${computer.id}/parts/new?category=OTHER`} className="btn-secondary">
            + Add other part
          </Link>
        </div>
        {otherParts.length === 0 ? (
          <p className="text-sm text-neutral-400">Nothing logged here.</p>
        ) : (
          <div className="space-y-2">
            {otherParts.map((part) => (
              <PartRow key={part.id} computerId={computer.id} part={part} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PartRow({ computerId, part }: { computerId: string; part: Part }) {
  const stats = getPartSummaryStats(part.category, (part.specs as Record<string, unknown>) ?? {});

  return (
    <Link
      href={`/computers/${computerId}/parts/${part.id}`}
      className="card flex items-center gap-4 hover:bg-neutral-900"
    >
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
        <p className="font-medium truncate">{part.label}</p>
        {stats.length > 0 && (
          <p className="text-sm text-neutral-400 truncate">
            {stats.map((s) => `${s.label}: ${s.value}`).join(" · ")}
          </p>
        )}
      </div>
      <span className="flex-shrink-0 text-neutral-600">›</span>
    </Link>
  );
}
