# AI Coding Agent Instructions (Rankovo)

Concise project knowledge to be productive quickly. Keep answers specific to THIS repo.

## 1. Architecture & Technology Stack

**Framework**: Next.js 15 (App Router) + React 19 with strict TypeScript

**Server vs Client Components**: Use React Server Components by default. Only add `"use client"` directive when needed for interactivity. File naming convention:

- Server: `reviews-list.tsx`
- Client: `reviews-list.client.tsx`

**UI Layer**: Components under `src/components` (design system wrappers in `components/ui`, domain widgets, form components). Prefer existing wrappers over raw Radix / third‑party libs.

**Data / API Layer**: `src/data` holds all backend interaction with strict abstraction patterns:

- Queries (`queries.ts`): Database queries via Drizzle ORM.
- Server Actions (`actions.ts`): Server Actions to create/edit/delete data in the database. Uses Drizzle ORM for database access.

## 2. Key Development Commands

```bash
bun run dev          # Development with Turbopack
bun run tsc          # TypeScript type checking
bun run lint         # ESLint with project-specific rules
bun run check        # Combined linting and type-checking
bun run build        # Production build
```

There is also always a running terminal task that monitors TypeScript errors called "Monitor TS Errors". Instead of running the type-check yourself, you can look at the output terminal of this task.

## 3. Coding Conventions (Enforced / Important)

- Replace boolean prop names with expressive states. Use enums / union literals (`variant`, `mode`, `qualityClass`) vs. `isActive` when possible.
- Use provided UI wrappers (`@/components/ui/...`) instead of raw Radix primitives; styling via Tailwind + `cn` helper.
- Keep components together when they belong together, instead of creating a new file for each.
- Try to handle URL search params in Server Components and pass them down as props. Sometimes it makes sense to use them in client components, for that you have to use our own `useSearchParamsHelper` hook in `url-state.ts`.
- Use normal functions (`function handleClick() {}`) instead of arrow functions (`const handleClick = () => {}`).

## 4. Forms & Validation

Forms are use with Server Actions and our helpers `action-utils.ts` and `form-utils.tsx`.

## 5. Error Handling

- Favor explicit `throw new Error("Some error...")` when invariants broken; upstream boundaries (React Error components in `app/error.tsx` or custom error wrappers) handle UI.

## 6. What To Do

- Feel free to run linting or type-checking all the time while you're doing changes when you think it is necessary, but you HAVE to run linting, type-checking and tests when you think you finished all changes at the end.

## 7. What NOT To Do

- Do not use type assertions (... as Foo) in TypeScript, only as a last resort. Type-safety in the codebase is extremely important.

---

Refine these instructions by updating this file when new decisions are added to README decision log.
