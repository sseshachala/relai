-- ─────────────────────────────────────────────────────────────────────
-- Relai — Supabase schema
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- ─────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables (users only see their own data)

-- ── Deals ─────────────────────────────────────────────────────────────
create table if not exists deals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  thread_text  text,
  is_deal      boolean default false,
  deal_stage   text check (deal_stage in ('prospect','active','stalled','closed')),
  urgency      text check (urgency in ('high','medium','low')),
  confidence   float check (confidence >= 0 and confidence <= 1),
  sentiment    text check (sentiment in ('positive','neutral','negative')),
  next_action  text,
  summary      text,
  created_at   timestamptz default now()
);

alter table deals enable row level security;

create policy "Users see own deals" on deals
  for all using (auth.uid() = user_id);

-- ── Contacts ──────────────────────────────────────────────────────────
create table if not exists contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text,
  email       text,
  company     text,
  role        text,
  sentiment   text check (sentiment in ('positive','neutral','negative')),
  last_topic  text,
  created_at  timestamptz default now(),
  unique (user_id, email)
);

alter table contacts enable row level security;

create policy "Users see own contacts" on contacts
  for all using (auth.uid() = user_id);

-- ── Sync state ───────────────────────────────────────────────────────
create table if not exists sync_state (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  last_synced_at   timestamptz,
  last_history_id  text,        -- Gmail historyId for incremental sync
  threads_synced   int default 0
);

alter table sync_state enable row level security;

create policy "Users see own sync state" on sync_state
  for all using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────
create index if not exists deals_user_id_idx     on deals (user_id, created_at desc);
create index if not exists contacts_user_id_idx  on contacts (user_id, created_at desc);
create index if not exists contacts_email_idx    on contacts (user_id, email);
