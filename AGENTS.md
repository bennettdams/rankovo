# AI Coding Agent Instructions (Rankovo)

## Key Development Commands

Requires Bun `^1.4.0` (`package.json` `engines.bun`, matching `@types/bun`). `bun run test` uses that runtime.

```bash
bun run dev          # Development with Turbopack
bun run tsc          # TypeScript type checking
bun run lint         # ESLint with project-specific rules
bun run test         # Unit tests (`bun test`)
bun run check        # Combined linting and type-checking
bun run build        # Production build
bun run db:seed      # Reset local DB and seed (includes dev accounts)
```

There is also always a running terminal task that monitors TypeScript errors called "Monitor TS Errors". Instead of running the type-check yourself, you can look at the output terminal of this task.

## Dev accounts

Seed (`bun run db:seed`) creates two local accounts so you can sign in without Google OAuth. They only exist after a seed. `/dev/login` is off unless `ALLOW_DEV_LOGIN=true` in `.env.local` **and** `NODE_ENV` is not `production`.

| Username            | Role  | Email                           | Password      |
| ------------------- | ----- | ------------------------------- | ------------- |
| `rankovo-dev-user`  | user  | `rankovo-dev-user@example.com`  | `rankovo-dev` |
| `rankovo-dev-admin` | admin | `rankovo-dev-admin@example.com` | `rankovo-dev` |

To sign in, open `/dev/login` (the **Anmelden** button goes there when `ALLOW_DEV_LOGIN` is set) and choose the account. Use the user account for regular flows (reviews, profile). Use the admin account for `/admin`. Dev accounts work only under `next dev`, not `next start`.

If sign-in fails, re-run `bun run db:seed`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

Refine these instructions by updating this file when new decisions are added to README decision log.
