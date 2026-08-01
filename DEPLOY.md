# Deploying the backend on Railway

This backend is an Express + TypeScript API using Prisma (Postgres), Redis,
Google Gemini and Tavily.

## What was changed for Railway

- `src/index.ts` now listens on `process.env.PORT` (Railway injects this) and
  reads allowed CORS origins from `FRONTEND_URL` instead of a hard-coded domain.
- Auth is **header-based Bearer tokens**: `/signin` returns a JWT in the response
  body and the `auth` middleware reads it from the `Authorization: Bearer` header.
  No cookies, so it works in every browser across different domains.
- Protected routes now derive the user identity from the **verified token**
  (`res.locals.userId`) instead of a client-supplied `userId` header, so a logged-in
  user can no longer read another user's cached data by spoofing that header.
- `package.json` has real `build` and `start` scripts and an `engines` field.
- Added `railway.json`, `.env.example`, `.gitignore`.
- Removed the old `vercel.json` and stale compiled files at the repo root.
- Removed a bogus dependency (`typescipt` typo) and added `@types/node`.

## Environment variables to set on Railway

| Variable       | Where it comes from                                             |
|----------------|-----------------------------------------------------------------|
| `DATABASE_URL` | The Railway **Postgres** plugin (reference `${{Postgres.DATABASE_URL}}`) |
| `REDIS_KEY`    | The Railway **Redis** plugin (reference `${{Redis.REDIS_URL}}`)  |
| `JWT_KEY`      | Any long random secret string                                    |
| `AI_KEY`       | Google Generative AI (Gemini) API key                            |
| `TAVILY_KEY`   | Tavily API key                                                   |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` (comma-separate to allow several) |

`PORT` is provided automatically by Railway — do **not** set it yourself.

## Steps

1. Push this folder to a GitHub repo.
2. On [railway.app](https://railway.app): **New Project → Deploy from GitHub repo**.
3. In the project, **+ New → Database → Add PostgreSQL**, and again for **Redis**.
4. Open your service → **Variables** and add the variables in the table above.
   Use Railway's variable references for `DATABASE_URL` and `REDIS_KEY` so they
   stay in sync with the plugins.
5. Railway auto-detects Node (Nixpacks) and runs `npm run build` then
   `npm run start`. `start` runs `prisma migrate deploy` (creates the `User`
   table) and then boots the server.
6. Service → **Settings → Networking → Generate Domain**. Copy this URL — it is
   your backend API base URL for the frontend.
7. After the frontend is live on Vercel, set `FRONTEND_URL` to the Vercel URL and
   redeploy (Railway redeploys on save).

## Local development

```bash
cp .env.example .env   # fill in the values
npm install
npm run build
npm start
```

## Troubleshooting

- **Build fails on `prisma generate` / "query engine" error at runtime:** add a
  binary target to `prisma/schema.prisma` and redeploy:

  ```prisma
  generator client {
    provider      = "prisma-client-js"
    binaryTargets = ["native", "debian-openssl-3.0.x"]
  }
  ```

- **`prisma migrate deploy` fails:** make sure `DATABASE_URL` is set and points at
  the Railway Postgres plugin. The migration in `prisma/migrations/` creates the
  `User` table.

- **CORS errors in the browser:** `FRONTEND_URL` must exactly match the Vercel
  origin (scheme + host, no trailing slash), e.g. `https://your-app.vercel.app`.

