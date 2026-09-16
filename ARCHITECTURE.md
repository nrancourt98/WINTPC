# Architecture

## Overview

WINTPC is a single Next.js (App Router) application that serves both the UI
and the backend logic — there is no separate API service. It runs as one
Docker container and talks to a Postgres database the user hosts elsewhere.

```
Docker container
 └─ Next.js (standalone build), one Node process
     ├─ App Router pages           — server-rendered UI
     ├─ Server Actions             — all create/update/delete mutations
     └─ /uploads/[...path] route   — streams part photos from disk
              │
              ├─ Postgres (external, user-hosted) — via Prisma
              └─ Docker volume at UPLOAD_DIR       — part photos
```

At container startup, `docker/entrypoint.sh` runs `prisma migrate deploy`
against `DATABASE_URL` before starting the server, so schema changes apply
automatically whenever a new image boots — no separate migration step to
remember.

## Data model

`prisma/schema.prisma` defines two models:

- **`Computer`** — `id`, `name`, `description?`, timestamps. Has many `Part`s
  (cascade delete).
- **`Part`** — belongs to a `Computer`. Has a `category` (enum:
  `CPU | MOTHERBOARD | RAM | GPU | STORAGE | PSU | CASE | COOLING | OTHER`),
  a required `label` (its display name, e.g. "Ryzen 7 7800X3D"), optional
  `notes`, optional `imageUrl`, a `specs` JSON column, and a `position` int
  for manual ordering within a category (currently always `0` — ties break
  on `createdAt` — but the column exists so drag-to-reorder can be added
  later without a schema change).

### Why `specs` is a JSON column, not one table per category

The brief calls for *structured*, category-appropriate fields (CPU gets
core/thread count; GPU gets VRAM; etc.), as opposed to fully freeform
key-value pairs. There were two ways to get that:

1. One SQL table per category (`CpuPart`, `GpuPart`, ...), each with its own
   typed columns.
2. One `Part` table for everything, with a `Json` column for category-
   specific fields, where the *structure* (which fields exist, their types,
   required-ness) is enforced by the application, not the database schema.

This project uses **(2)**. Reasoning:

- Listing "all parts for a computer, in order" — the app's central query —
  stays a single `findMany` with an in-memory sort, instead of a union
  across 8 tables.
- Adding or changing a category's fields (e.g. adding "chipset" to
  Motherboard) is a one-line change in `src/lib/categories.ts`, not a
  migration.
- The structure is still real: `src/lib/categories.ts` is a single registry
  mapping each `PartCategory` to a Zod schema and a field list (label, type,
  options, unit) that both the server action validation and the dynamic
  form UI read from — so it's not a "put anything in a bag" freeform system,
  it's schema-driven, just validated in the app layer instead of via SQL
  columns.

The trade-off: you can't write a SQL `WHERE` clause against, say, `vramGB`
without reaching into the JSON column. That's an acceptable trade for a
personal cataloging tool with no reporting/search-by-spec requirement today.
If cross-part querying by spec ever becomes a real need, the categories with
that need can be promoted to real columns (or a `PartSpecValue` side table)
without touching the rest of the schema.

### Category field registry

`src/lib/categories.ts` is the single source of truth for:

- `CATEGORY_ORDER` — the fixed display order (CPU, Motherboard, RAM, GPU,
  Storage, PSU, Case, Cooling, Other). This is a constant, not a DB column —
  reordering categories is a one-line change.
- `CATEGORIES` — per-category `{ label, fields, schema }`, where `fields`
  drives the dynamic part form (`src/components/PartForm.tsx`) and `schema`
  (a Zod object) validates submitted specs in the matching Server Action.

## Request flow

There's no REST/JSON API. Mutations go through Next.js Server Actions in
`src/lib/actions/` (`computers.ts`, `parts.ts`), called directly from forms
(`ComputerForm`, `PartForm`, both client components using
`react-dom`'s `useFormState` for inline validation errors and
`useFormStatus` for pending state) or from `DeleteButton` (a client
component that calls a bound server action directly after a `confirm()`).

Reads happen in the page components themselves (React Server Components),
querying Prisma directly — no client-side data fetching layer.

## Image uploads

- `UPLOAD_DIR` (default `/data/uploads`) is a directory outside Next's
  `public/` folder, mounted as a named Docker volume so photos survive
  image rebuilds.
- Upload: the part create/update Server Action reads a `File` off the
  submitted `FormData`, validates its MIME type and size
  (`src/lib/uploads.ts`), writes it to `UPLOAD_DIR` under a generated
  filename, and stores that filename in `Part.imageUrl`.
- Serving: `src/app/uploads/[...path]/route.ts` reads the file from
  `UPLOAD_DIR` and streams it with the right `Content-Type`. A route handler
  is used (instead of aliasing `UPLOAD_DIR` into `public/`) because the
  upload directory lives outside the Next.js build output and its path is
  only known at runtime.
- Replacing or removing a part's photo deletes the old file from disk.

## Folder structure

```
prisma/schema.prisma        — data model (see above)
src/
  app/
    page.tsx                          — computer list
    computers/new/page.tsx            — create computer
    computers/[id]/page.tsx           — computer detail + part list
    computers/[id]/edit/page.tsx      — edit computer
    computers/[id]/parts/new/page.tsx — category picker, then part form
    computers/[id]/parts/[partId]/page.tsx — edit part
    uploads/[...path]/route.ts        — serves photos from UPLOAD_DIR
  components/
    ComputerForm.tsx, PartForm.tsx    — forms (client components)
    SubmitButton.tsx                  — submit button with pending state
    DeleteButton.tsx                  — confirm() + delete action
  lib/
    prisma.ts               — Prisma client singleton
    categories.ts            — category order + field/schema registry
    uploads.ts               — save/delete helpers for UPLOAD_DIR
    actions/computers.ts     — createComputer, updateComputer, deleteComputer
    actions/parts.ts         — createPart, updatePart, deletePart
docker/entrypoint.sh         — runs migrations, then starts the server
Dockerfile, docker-compose.yml
```

Every page that reads from the database is marked `export const dynamic =
"force-dynamic"`, so Next never tries to statically prerender them at build
time (which would require a live database connection during `docker build`).
The Dockerfile's build stage sets a placeholder `DATABASE_URL` only so
Prisma Client's constructor doesn't throw during Next's build-time page-data
collection step; it's discarded when the final image stage starts, and the
real value comes from `docker-compose`'s `env_file` at container start.

## Non-goals (v1)

- **No authentication.** The app assumes it's reachable only by people who
  should have access (home network, VPN, or a reverse proxy that handles
  auth). Revisit if it's ever exposed more broadly.
- **No multi-tenancy.** All computers are visible to anyone who can reach
  the app; there's no concept of "my computers" vs. "your computers."
- **No image resizing/optimization pipeline.** Uploaded photos are stored
  and served as-is (capped at 8MB, JPEG/PNG/WEBP/GIF only).

## Future extension points

- **Auth**: since there's no client-side state tied to "no auth," a simple
  session-cookie gate (or handing this off entirely to a reverse proxy)
  could be added without restructuring anything above the route layer.
- **More categories or fields**: extend `CATEGORY_ORDER` / `CATEGORIES` in
  `src/lib/categories.ts` — no migration needed since specs are JSON.
- **Manual reordering**: the `Part.position` column already exists; add a
  drag-and-drop UI that calls a new `reorderParts` action.
- **Part templates / cloning**: "duplicate this GPU for another build" is a
  natural fit given specs already live in a portable JSON blob.

## Known limitations / future work

- `npm audit` reports a number of advisories against Next.js 14.2.x
  (currently pinned to the latest 14.2.x patch, `14.2.35`). Most concern
  subsystems this app doesn't use (`next/image` optimizer, middleware, Edge
  runtime, i18n rewrites) or require conditions that don't apply to a
  same-origin, no-auth, LAN-only deployment, but a Next.js major-version
  upgrade (15 or 16) should be revisited to close them out — it wasn't done
  as part of the initial build because it involves breaking API changes
  (async `params`/`searchParams`, React 19, `useFormState` →
  `useActionState`) that deserve their own testing pass rather than being
  bundled into the first version.
- This environment's build sandbox doesn't have Docker or a live Postgres
  instance, so `docker build` / `docker compose up` and a real browser
  smoke test haven't been run here — only `npm run build` and `npm run
  lint`, both clean. Run the Quick Start steps in the README to verify the
  container end-to-end before relying on it.
