# AutoHub — Vercel Deployment Guide

## What changed

The backend now separates **Express application construction** from **local server startup**. `server/app.ts` creates and configures the reusable Express app, while `server/_core/index.ts` remains the local runtime that attaches Vite in development or static-file serving in a local production build before opening a port. The `pnpm dev` command therefore continues to use the same local startup flow.

Vercel invokes `api/index.ts` as a serverless function. The function uses the shared Express app and restores the original `/api/...` URL after Vercel routes the request through the function endpoint. This preserves the existing public paths, including `/api/trpc`, `/api/upload`, `/api/auth/*`, and the existing `/uploads/*` proxy route, without changing frontend callers.

| File | Change | Purpose |
|---|---|---|
| `server/app.ts` | New | Creates the reusable Express application and registers existing middleware and routes. |
| `server/_core/index.ts` | Updated | Retains the current local `app.listen()` lifecycle while consuming the shared app factory. |
| `api/index.ts` | New | Vercel-compatible serverless entry point that delegates to Express. |
| `vercel.json` | New | Builds the Vite client, publishes `dist/public`, routes API requests to the function, and preserves SPA deep links. |
| `package.json` | Updated | Adds a client-only build command used by Vercel; the existing `pnpm build` behavior remains available for local production builds. |
| `tsconfig.json` | Updated | Includes the new `/api` TypeScript entry point in `pnpm check`. |
| `server/_core/oauth.ts` | Updated | Uses a relative shared-module import compatible with Vercel Function TypeScript bundling. |
| `server/_core/sdk.ts` | Updated | Uses relative shared-module imports for the same bundling compatibility reason. |
| `server/_core/trpc.ts` | Updated | Uses a relative shared-module import for the same bundling compatibility reason. |

## Vercel project settings

The committed `vercel.json` is the required configuration. In the Vercel dashboard, set the project root directory to this repository directory and leave the build and output settings to the values in `vercel.json`:

| Setting | Value |
|---|---|
| Framework Preset | `Other` |
| Install Command | Default pnpm detection from `pnpm-lock.yaml` |
| Build Command | `pnpm build:client` |
| Output Directory | `dist/public` |
| Production Node runtime | Use Vercel’s supported Node.js runtime |

The rewrite order is intentional: `/uploads/*` and `/api/*` are routed to the serverless handler before all other application paths fall back to `index.html` for the existing React SPA router. Vercel Functions are automatically discovered from the root `/api` directory, while Vite SPAs require a fallback rewrite for deep links. [1] [2]

## Required environment variables

Use the Vercel dashboard to add values separately for **Preview** and **Production**. Never commit their values to the repository.

| Variable | Required | Production value / use |
|---|---:|---|
| `DATA_MODE` | Yes | Set to `mysql`; do not use local JSON storage on Vercel. |
| `DATABASE_URL` | Yes | A serverless-compatible MySQL connection string for the existing Drizzle schema. |
| `JWT_SECRET` | Yes | A long, random secret used to sign session cookies and JWT sessions. |
| `GOOGLE_MAPS_API_KEY` | If maps are enabled server-side | Existing Maps API key where required. |
| `OPENAI_API_KEY` or `LLM_API_KEY` | Only if AI features are enabled | Existing AI provider credential. |

Vercel provides HTTPS and forwarding headers. The shared Express app trusts the first platform proxy, while the existing session-cookie helper already checks the forwarded protocol, so the same-origin authentication flow can issue secure cookies in deployment.

> **Important:** Vercel Function filesystems are not durable application storage. Set `DATA_MODE=mysql` with `DATABASE_URL` for production data. The existing local `/uploads` disk mode is suitable only for local development. Although the project exposes `S3_*` environment placeholders, the current `server/storage.ts` implementation does not yet contain an object-storage adapter, so production uploads must remain disabled or be completed as a separate storage-focused change. Vercel recommends using serverless-friendly database connectivity and connection pooling because functions can scale into multiple concurrent instances. [3]

## Deployment steps

1. Commit and push the refactor to the Git repository connected to Vercel.
2. In Vercel, configure the environment variables listed above for Preview and Production.
3. Ensure the production database already has the existing Drizzle migrations applied from a controlled environment. Do not run migrations automatically as part of a Vercel request.
4. Trigger a Preview deployment and verify `/api/trpc`, login, and one authenticated request before promoting the deployment.
5. Promote the validated deployment to Production.

## Local commands

| Purpose | Command |
|---|---|
| Existing local development flow | `pnpm dev` |
| Type checking | `pnpm check` |
| Tests | `pnpm test` |
| Local full production build | `pnpm build` |
| Vite client build used by Vercel | `pnpm build:client` |
| Vercel environment simulation | `npx vercel dev` |

## References

[1]: https://vercel.com/docs/functions/runtimes/node-js "Using the Node.js Runtime with Vercel Functions"
[2]: https://vercel.com/docs/frameworks/frontend/vite "Vite on Vercel"
[3]: https://vercel.com/kb/guide/using-express-with-vercel "Using Express.js with Vercel"
