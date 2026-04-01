# Relai — AI Relationship Intelligence

CRM that builds itself from your email and calendar. No manual entry.

## Stack

- **Next.js 14** (App Router) — frontend + API routes
- **Supabase** — Postgres database + Google OAuth
- **Anthropic Claude** — deal intelligence + daily digest
- **Resend** — digest email delivery
- **Vercel** — hosting (zero config deploy)

---

## Setup in 4 steps

### 1. Clone and install

```bash
git clone https://github.com/yourname/relai
cd relai
npm install
```

### 2. Create your services (all free tiers)

**Supabase**
1. Create project at supabase.com
2. Go to SQL Editor → paste and run `supabase/schema.sql`
3. Go to Authentication → Providers → enable Google
4. Copy URL and anon key from Settings → API

**Anthropic**
1. Get API key at console.anthropic.com

**Google OAuth**
1. Go to console.cloud.google.com
2. Create project → Enable Gmail API + Google Calendar API
3. OAuth consent screen → add scopes:
   - `gmail.readonly`
   - `calendar.readonly`
4. Create OAuth 2.0 credentials → Web application
5. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`

**Resend** (optional — for email digest)
1. Get API key at resend.com
2. Verify your sending domain

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all `.env.local` values as environment variables in the Vercel dashboard.

Update `NEXT_PUBLIC_APP_URL` to your Vercel URL.

Update Google OAuth redirect URI to your Vercel URL.

---

## Project structure

```
src/
  app/
    api/
      analyse/route.ts   ← deal intelligence (Claude)
      digest/route.ts    ← daily briefing (Claude + Resend)
      contacts/route.ts  ← contacts CRUD
    pipeline/            ← kanban board
    contacts/            ← contact list
    analyse/             ← thread analysis form
    digest/              ← daily digest
    login/               ← Google OAuth login
    auth/callback/       ← OAuth callback
  components/
    layout/Sidebar.tsx   ← persistent navigation
  lib/
    claude.ts            ← all AI calls (analyseThread, generateDigest)
    supabase/
      client.ts          ← browser Supabase client
      server.ts          ← server Supabase client
  types/
    index.ts             ← shared TypeScript types
supabase/
  schema.sql             ← run once in Supabase SQL editor
```

---

## Post-MVP additions (week 3+)

- Gmail API ingestion (auto-sync without pasting)
- Outlook + Microsoft Calendar OAuth
- LLM router (swap Claude for GPT-4o, Gemini, etc.)
- Stripe billing (14-day trial → Pro at $19/month)
- Mobile PWA manifest
- Cron job for automated daily digest emails
