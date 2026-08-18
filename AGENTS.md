# AI Coding Agent Instructions (Rankovo)

## Key Development Commands

```bash
bun run dev          # Development with Turbopack
bun run tsc          # TypeScript type checking
bun run lint         # ESLint with project-specific rules
bun run check        # Combined linting and type-checking
bun run build        # Production build
```

There is also always a running terminal task that monitors TypeScript errors called "Monitor TS Errors". Instead of running the type-check yourself, you can look at the output terminal of this task.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

Refine these instructions by updating this file when new decisions are added to README decision log.
