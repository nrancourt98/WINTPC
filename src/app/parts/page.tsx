import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_ORDER, CATEGORIES, categoryRank, isPartCategory, getPartSummaryStats } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function AllPartsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const categoryFilter =
    searchParams.category && isPartCategory(searchParams.category) ? searchParams.category : undefined;

  const parts = await prisma.part.findMany({
    where: categoryFilter ? { category: categoryFilter } : undefined,
    include: { computer: { select: { id: true, name: true } } },
  });

  const sorted = [...parts].sort((a, b) => {
    const rankDiff = categoryRank(a.category) - categoryRank(b.category);
    if (rankDiff !== 0) return rankDiff;
    if (a.computer.name !== b.computer.name) return a.computer.name.localeCompare(b.computer.name);
    return a.label.localeCompare(b.label);
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-neutral-400 hover:underline">
          ← All computers
        </Link>
        <h1 className="text-lg font-medium mt-1">All parts</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/parts" className={categoryFilter ? "btn-secondary" : "btn-primary"}>
          All
        </Link>
        {CATEGORY_ORDER.map((cat) => (
          <Link
            key={cat}
            href={`/parts?category=${cat}`}
            className={categoryFilter === cat ? "btn-primary" : "btn-secondary"}
          >
            {CATEGORIES[cat].label}
          </Link>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-neutral-400">No parts found.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((part) => {
            const stats = getPartSummaryStats(part.category, (part.specs as Record<string, unknown>) ?? {});
            return (
              <li key={part.id}>
                <Link
                  href={`/computers/${part.computer.id}/parts/${part.id}`}
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
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      {CATEGORIES[part.category].label}
                    </p>
                    <p className="font-medium truncate">{part.label}</p>
                    {stats.length > 0 && (
                      <p className="text-sm text-neutral-400 truncate">
                        {stats.map((s) => `${s.label}: ${s.value}`).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-sm text-neutral-500 truncate max-w-[10rem]">
                    {part.computer.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
