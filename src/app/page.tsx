import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const computers = await prisma.computer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { parts: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Your computers</h1>
        <Link href="/computers/new" className="btn-primary">
          + New computer
        </Link>
      </div>

      {computers.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No computers yet. Add your first one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {computers.map((c) => (
            <li key={c.id}>
              <Link
                href={`/computers/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  {c.description && (
                    <p className="text-sm text-neutral-400 truncate">{c.description}</p>
                  )}
                </div>
                <span className="flex-shrink-0 text-sm text-neutral-500">
                  {c._count.parts} part{c._count.parts === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
