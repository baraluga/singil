# singil

> *Filipino. /siŋˈil/* — to collect what is owed.

Split bills. Share a link. Get paid. No accounts needed for payees.

---

## How it works

```
Organizer creates a bill → shares a link → payees tap "Bayad na ako!" → organizer confirms → done
```

**For organizers** — create bills, set amounts, choose equal or honesty split, add payment QR codes, track who's paid.

**For payees** — open a link, pick your name, optionally attach proof, tap the button. That's it.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript 5.9 |
| Database | Supabase (Postgres) |
| Auth | Supabase Magic Link |
| Storage | Supabase Storage |
| Styling | Pure CSS + design tokens |
| Deploy | Vercel |
| Package manager | pnpm |

---

## Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase keys
pnpm dev
```

**Env vars needed:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

---

## Database & storage

1. Run [`supabase/migrations/20260315_init_schema.sql`](supabase/migrations/20260315_init_schema.sql) in the Supabase SQL editor
2. Follow [`supabase/setup-storage.md`](supabase/setup-storage.md) to create the `receipts` and `qr-codes` buckets

---

## Deploy

```bash
vercel
```

Add the three env vars above in the Vercel dashboard.

---

## Project layout

```
app/
  bills/         organizer bill management
  collections/   multi-bill groupings
  pay/           payee-facing payment flows
  settings/      payment method + QR setup
components/
  bills/         bill detail, member rows
  pay/           payee views, collection cards
  ui/            shared primitives (toast, modal…)
lib/
  actions/       server actions
  utils/         currency, split, avatars, celebration
```

---

## Design tokens

| Token | Value | |
|---|---|---|
| `--bg` | `#F5F0E8` | warm parchment background |
| `--surface` | `#FDFAF4` | card surface |
| `--ink` | `#1A1612` | primary text |
| `--accent` | `#D4522A` | orange — action |
| `--green` | `#2A7A4B` | success / paid |

Fonts: **DM Sans** (UI) + **DM Serif Display** (headings)
