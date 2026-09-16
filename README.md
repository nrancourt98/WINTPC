# WINTPC — What's In That PC

A simple, self-hosted log of the parts inside every computer you own or help
manage. One list of computers; inside each one, a list of parts (CPU,
motherboard, RAM, GPU first) with the specs that matter for that kind of
part, and an optional photo.

No accounts, no cloud dependency beyond a Postgres database you already run.
Runs as a single Docker container.

## Features

- Computers: create, view, delete. Each has a name and optional description.
- Parts: add one per category — CPU, Motherboard, RAM, GPU, Storage, PSU,
  Case, Cooling, or Other — each with its own relevant fields (e.g. CPU gets
  core/thread count and socket; storage gets capacity and type). Only a
  part's name is required — every spec field is optional so you can save
  now and fill in details later.
- Parts are always listed in a fixed, predictable order (CPU → Motherboard →
  RAM → GPU → Storage → PSU → Case → Cooling → Other), regardless of the
  order they were added.
- Optional photo per part, stored on disk (not in the database).

## Quick start

Requirements: Docker, and a Postgres database you can point the app at.

1. Copy the env template and fill in your database connection string:

   ```sh
   cp .env.example .env
   ```

   ```env
   DATABASE_URL="postgresql://user:password@your-postgres-host:5432/wintpc?schema=public"
   ```

2. Build and start the container:

   ```sh
   docker compose up -d --build
   ```

   On first start, the container runs `prisma migrate deploy` against
   `DATABASE_URL` automatically — no manual migration step needed, on this
   boot or any future one after you pull a new image.

3. Open [http://localhost:3000](http://localhost:3000).

Uploaded photos are stored in the `wintpc_uploads` named Docker volume, so
they survive rebuilds and restarts.

## Configuration

Environment variables (see `.env.example`):

| Variable       | Required | Description                                                        |
| -------------- | -------- | -------------------------------------------------------------------|
| `DATABASE_URL` | yes      | Postgres connection string for your existing database.             |
| `UPLOAD_DIR`   | no       | Where part photos are stored inside the container. Default `/data/uploads`. |
| `PORT`         | no       | Port the app listens on inside the container. Default `3000`.      |

## Local development (without Docker)

```sh
npm install
npx prisma migrate dev   # applies schema to DATABASE_URL, creates it if new
npm run dev
```

Requires a `DATABASE_URL` pointing at a reachable Postgres instance (a local
one is fine for development) — set it in a `.env` file at the project root.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript — UI, routing, and
  backend logic (Server Actions) in one process.
- [Prisma](https://www.prisma.io) — schema, migrations, and typed DB access
  against your Postgres instance.
- [Tailwind CSS](https://tailwindcss.com) — styling.
- [Zod](https://zod.dev) — form/input validation, including per-category
  part specs.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how it's put together and the
reasoning behind the main design decisions, and
[DEPLOYMENT.md](./DEPLOYMENT.md) for running it on a private GitHub repo +
self-hosted server with Dockhand.

## Known limitations (v1)

- No authentication — the app trusts its network. Run it behind your own
  reverse proxy, VPN (e.g. Tailscale), or firewall if it needs to be
  reachable outside your LAN.
- `npm audit` currently flags a number of advisories against the pinned
  Next.js 14.2.x line (mostly DoS/cache-poisoning issues in subsystems this
  app doesn't use — `next/image`, middleware, Edge runtime). Worth
  revisiting with a Next.js major-version upgrade later; see
  [ARCHITECTURE.md](./ARCHITECTURE.md#known-limitations--future-work).
