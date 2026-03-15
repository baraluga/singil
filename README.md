# Singil

Split bills and collect payments easily.

## Walking Skeleton Setup

This is a bullet-tracer development approach - deploy early, iterate fast.

### Prerequisites

- [x] Next.js 16 with TypeScript and Tailwind v4
- [x] Supabase project created
- [x] Environment variables configured
- [ ] Database schema applied
- [ ] Storage buckets created
- [ ] Deployed to Vercel

### Setup Instructions

#### 1. Database Setup

Run the migration in Supabase SQL Editor:
- File: [supabase/migrations/20260315_init_schema.sql](supabase/migrations/20260315_init_schema.sql)
- Go to: https://supabase.com/dashboard/project/crmflgafhzdytacttxnq/sql/new
- Copy, paste, and run

#### 2. Storage Setup

Follow instructions in: [supabase/setup-storage.md](supabase/setup-storage.md)

Or use the Dashboard:
1. Go to Storage → New Bucket
2. Create "receipts" (public)
3. Create "qr-codes" (public)

#### 3. Local Development

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)

#### 4. Deploy to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

## Project Structure

```
singil/
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout with fonts
│   ├── globals.css      # Tailwind config with design tokens
│   └── page.tsx         # Home page
├── lib/                 # Shared utilities
│   ├── supabase.ts      # Browser client
│   ├── supabase-server.ts # SSR client
│   └── supabase-admin.ts  # Admin client (server-only)
├── middleware.ts        # Auth middleware
└── supabase/
    └── migrations/      # Database migrations
```

## Tech Stack

- **Framework**: Next.js 16.1 with App Router
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS v4 with design tokens
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Magic Link)
- **Storage**: Supabase Storage
- **Deployment**: Vercel
- **Package Manager**: pnpm

## Design Tokens

See [mockups.html](mockups.html) for the full design system.

Key colors:
- Background: `#F5F0E8`
- Surface: `#FDFAF4`
- Ink: `#1A1612`
- Accent: `#D4522A`
- Green: `#2A7A4B`

Fonts:
- Sans: DM Sans (300, 400, 500, 600)
- Serif: DM Serif Display (regular, italic)
