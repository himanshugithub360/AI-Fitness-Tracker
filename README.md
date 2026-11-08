# APEX

An AI fitness tracker: snap a meal and get calories and macros, log by voice, and get coached on your
form. AI runs on Mistral and Google Gemini through one shared server-side gateway.

**Status:** Stage 1 (foundation). See the staged plan in the project notes.

## Stack

- Next.js (App Router) with TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Storage) _(added in step 1.3 and 1.4)_
- Mistral and Gemini via a single AI gateway _(step 1.5)_
- Vercel for hosting

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your own keys
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command                | What it does               |
| ---------------------- | -------------------------- |
| `npm run dev`          | Start the dev server       |
| `npm run build`        | Production build           |
| `npm run lint`         | Lint with ESLint           |
| `npm run typecheck`    | Type-check with TypeScript |
| `npm run format`       | Format with Prettier       |
| `npm run format:check` | Check formatting           |

## Project layout

```
src/app/     routes and layouts
design/      reference mockup (apex-mockup.html), not part of the app
```

## Environment variables

See `.env.example`. Secrets live in `.env.local`, which is git-ignored. The Supabase service key and the
AI keys are server-only and must never be used in browser code.
