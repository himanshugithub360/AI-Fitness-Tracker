# APEX

An AI fitness tracker: snap a meal and get calories and macros, log by voice, and get coached on your
form. AI runs on Mistral and Google Gemini through one shared server-side gateway.

**Status:** Stage 1 (foundation). Sign-in, the database schema, the AI gateway and automated checks
are in place. Tracking features start in Stage 2.

## Stack

- Next.js 16 (App Router, Cache Components) with TypeScript
- Tailwind CSS 4 and shadcn/ui, themed in `src/app/globals.css`
- Supabase: Postgres with row level security, and Auth (email, magic link, Google)
- Mistral and Gemini through the Vercel AI SDK, behind one gateway in `src/lib/ai`
- Vitest for unit tests, GitHub Actions for CI, Vercel for hosting

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your own keys
npm run dev
```

Open http://localhost:3000.

### One-time Supabase setup

1. Run `supabase/migrations/20261108000000_init.sql` in the Supabase SQL Editor, then
   `supabase/migrations/20261108000100_grants.sql` (newer projects need the explicit grants).
2. Run `npm run test:rls` to prove users cannot see each other's data.
3. For Google sign-in, enable the Google provider in Supabase (Authentication, Providers) and add
   `http://localhost:3000/auth/callback` and your deployed URL to the redirect allow list.

## Scripts

| Command                | What it does                                |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start the dev server                        |
| `npm run build`        | Production build                            |
| `npm run lint`         | Lint with ESLint                            |
| `npm run typecheck`    | Type-check with TypeScript                  |
| `npm run format`       | Format with Prettier                        |
| `npm run format:check` | Check formatting                            |
| `npm test`             | Unit tests (Vitest)                         |
| `npm run test:rls`     | Security test against your Supabase project |

## Project layout

```
src/app/            routes: (auth) pages, /app, /dev/ai, /style-guide
src/components/     ui/ (shadcn, APEX-styled) and auth/ forms
src/lib/auth/       sign-in helpers, validation, current-user lookup
src/lib/ai/         the AI gateway: routing, fallback, daily limits, usage log
src/lib/supabase/   server, admin and proxy clients
src/proxy.ts        refreshes the session and guards /app and /dev
supabase/           database migrations
scripts/            test-rls.mjs
design/             reference mockup (apex-mockup.html), not part of the app
```

## The AI gateway

Every AI call goes through `getGateway()` from `src/lib/ai`. Each task (`chat`, `plan`,
`food-vision`, `food-verify`, `insight-report`, `quick`) has a route of one Mistral and one Gemini
model. If the first model fails, the next one answers. Calls are capped per user per 24 hours and
logged in the `ai_usage` table. Change models with the `AI_MODEL_*` variables in `.env.example`.

Open `/dev/ai` (signed in, local or with `ENABLE_DEV_PAGES=true`) to check that both providers answer.

## Environment variables

See `.env.example`. Secrets live in `.env.local`, which is git-ignored. The Supabase service key and the
AI keys are server-only and must never be used in browser code.
