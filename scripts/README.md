# Relai — Scripts

## Seed Script (Layer 1 Testing)

Loads realistic test data into Supabase. Based on real B2BSphere and Organicaphere business scenarios — FreshFields, GreenWave, TechWave, FreshMart, Gulf Fresh and more.

### What it loads

| Table | Count | Detail |
|-------|-------|--------|
| contacts | 12 | Real SEA business contacts across SG, MY, IN, AE, AU |
| deals | 8 | 3 active, 2 prospect, 2 stalled, 1 pending docs |
| thread_snapshots | 10 | Email preview snapshots linked to deals |
| sync_runs | 3 | One success, one partial, one onboarding |
| calendar_events | 3 | Today + next 48h, linked to thread participants |
| digests | 1 | Realistic AI-written daily briefing |
| user_settings | 1 | America/Chicago, 7:30am digest, 10 email limit |
| sync_state | 1 | Last synced 2h ago, history checkpoint set |

### Setup

1. Make sure `.env.local` has these two values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

2. Find your Supabase user ID:
   - Go to Supabase → Authentication → Users
   - Copy the UUID next to your email address

### Running

```bash
# Install deps first (only needed once)
npm install

# Seed data for a specific user (safe — upserts, won't duplicate)
npm run seed -- --user <your-supabase-user-id>

# Example
npm run seed -- --user 75979ae3-4f72-4258-bdec-a3db310cd2b7

# Clear all existing data first, then seed fresh
npm run seed:clear -- --user 75979ae3-4f72-4258-bdec-a3db310cd2b7
```

### Test accounts

Run separately for each account to give each user their own pipeline:

| Email | Purpose |
|-------|---------|
| sudhi@b2bsphere.com | Primary test — B2BSphere deals |
| info@b2bsphere.com | Secondary test — inbound enquiries |
| salessupport@organicaphere.com | Organicaphere sales pipeline |

### After seeding

Open https://prelai.org and you should see:
- **Pipeline** — 8 deals across 4 stages
- **Contacts** — 12 contacts with sentiment and last topic
- **Meetings** — 3 upcoming meetings with linked email context
- **Sync logs** — 3 sync runs with expandable thread detail
- **Daily digest** — cached briefing ready to read
- **Settings** — pre-configured with Houston timezone

### Resetting

To wipe and start fresh:
```bash
npm run seed:clear -- --user <id>
```

This clears deals, contacts, thread_snapshots, sync_runs, calendar_events, digests, sync_state, and user_settings for that user only. Other users are not affected.
