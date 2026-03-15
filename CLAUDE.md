# CLAUDE.md

## Package manager

Always use **pnpm**. Never npm or yarn.

```bash
pnpm add <pkg>
pnpm add -D <pkg>
pnpm dev / build / lint
```

## Commits

**Micro commits, conventional format. Non-negotiable.**

```
feat: add confetti on payment claim
fix: correct pnpm lockfile
chore: update readme
refactor: extract celebration utility
```

One logical change per commit. No batching unrelated changes.

## Code style

- Pure CSS — no Tailwind utility classes in JSX
- Server actions in `lib/actions/`
- Shared utilities in `lib/utils/`
- No new files unless necessary; prefer editing existing ones
- No comments unless logic is non-obvious

## Architecture

- Next.js 16 App Router + TypeScript
- Supabase for DB, auth (magic link), and storage
- Three payment flows: `PayeeView`, `ConsolidatedPayeeFlow`, `CollectionBillCard`
- Design tokens in `app/globals.css` `:root`
