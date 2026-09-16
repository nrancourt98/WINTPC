# Deploying WINTPC to your Ubuntu server

This covers: keeping the repo private on GitHub, pulling it onto the server
securely, and wiring it into Dockhand for scheduled auto-updates — without
ever needing a Docker image registry (private or otherwise).

## Why Docker Hub doesn't matter here

`docker-compose.yml` builds the image from source (`build: .`) instead of
pulling a pre-built one. Docker never talks to Docker Hub, GHCR, or any
registry in this setup — the server builds the image itself from whatever's
in the cloned repo. Docker Hub's 1-private-repo cap on the free tier simply
isn't a constraint for a single self-hosted server.

(That only changes if you later want a CI pipeline to build the image once
and ship the same artifact to multiple servers. If that day comes, [GitHub
Container Registry](https://ghcr.io) gives free private image storage tied
to your GitHub account — a better fit than Docker Hub anyway, since it's
already where the source lives.)

## 1. Make the GitHub repo private

GitHub private repos are free and unlimited on any account — no plan
upgrade needed. If `nrancourt98/WINTPC` doesn't exist on GitHub yet, create
it as **Private** from github.com/new. If it already exists, check
**Settings → General → Danger Zone → Change visibility**.

Push your local work once it's ready:

```sh
git add -A
git commit -m "Initial WINTPC scaffold"
git push -u origin main
```

## 2. Give the server read-only access via a Deploy Key

Don't reuse your personal GitHub SSH key or a broad personal access token on
the server. Use a **Deploy Key**: an SSH keypair scoped to this one repo,
read-only by default, revocable independently of your account. If the
server is ever compromised, the blast radius is "can read this one repo,"
not "can act as you."

On the Ubuntu server:

```sh
ssh-keygen -t ed25519 -C "wintpc-deploy" -f ~/.ssh/wintpc_deploy -N ""
cat ~/.ssh/wintpc_deploy.pub
```

Add that public key: GitHub repo → **Settings → Deploy keys → Add deploy
key** → paste it → leave "Allow write access" unchecked.

Then tell SSH to use that key for this repo specifically (useful once you
have more than one deploy key on the box, e.g. for friends' repos too):

```sh
# ~/.ssh/config
Host github.com-wintpc
  HostName github.com
  User git
  IdentityFile ~/.ssh/wintpc_deploy
  IdentitiesOnly yes
```

## 3. Clone and do a manual first run

```sh
git clone git@github.com-wintpc:nrancourt98/WINTPC.git
cd WINTPC
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres instance
docker compose up -d --build
```

Confirm it's up at `http://<server-ip>:3000` before automating anything —
easier to debug a first run interactively than through Dockhand's logs.

## 4. Wire it into Dockhand for scheduled updates

Since Dockhand is already running on the box:

1. **Settings → Git** — add the repo. Dockhand's git credential form takes
   either an SSH key or a token depending on the URL scheme you give it; use
   the same `~/.ssh/wintpc_deploy` key material (or, if the form wants a
   token instead of SSH, generate a **fine-grained personal access token**
   scoped to only this repo with read-only Contents access, rather than a
   classic all-repo token).
2. **New stack → Deploy from Git** — point it at the repo and
   `docker-compose.yml` at the repo root.
3. Turn on **"Build images on deploy"** — required, since this compose file
   builds from source rather than pulling a tagged image.
4. Environment variables: `.env` is gitignored on purpose (it holds your
   `DATABASE_URL`), so it won't come from the git pull. Set the real values
   in Dockhand's per-stack env/secrets UI instead — mark `DATABASE_URL` as a
   **secret**, `UPLOAD_DIR`/`PORT` as regular vars. Dockhand injects these at
   deploy time without ever writing them into the repo checkout.
5. **Scheduling** — set a cron-style auto-sync interval, e.g. every 30
   minutes: `*/30 * * * *`. Dockhand only redeploys when the commit it sees
   has actually changed, so a short interval is cheap.

The `wintpc_uploads` named volume isn't part of the build context, so
scheduled rebuilds never touch your stored part photos.

## Updating later

Just `git push` to `main`. Dockhand picks up the new commit on its next
scheduled check, rebuilds, and redeploys — migrations run automatically via
`docker/entrypoint.sh` on container start, same as any other boot.
