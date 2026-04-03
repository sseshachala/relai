-- ─────────────────────────────────────────────────────────────────────
-- Relai — Full Schema v2
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- ─────────────────────────────────────────────────────────────────────

-- ── Deals ─────────────────────────────────────────────────────────────
create table if not exists deals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  thread_id    text,
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
create policy "Users see own deals" on deals for all using (auth.uid() = user_id);

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
create policy "Users see own contacts" on contacts for all using (auth.uid() = user_id);

-- ── Sync state ────────────────────────────────────────────────────────
create table if not exists sync_state (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  last_synced_at   timestamptz,
  last_history_id  text,
  threads_synced   int default 0,
  is_syncing       boolean default false,
  sync_started_at  timestamptz
);
alter table sync_state enable row level security;
create policy "Users see own sync state" on sync_state for all using (auth.uid() = user_id);

-- ── Sync runs ─────────────────────────────────────────────────────────
create table if not exists sync_runs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  status             text check (status in ('running','success','partial','failed')) default 'running',
  trigger            text check (trigger in ('manual','cron','onboarding')) default 'manual',
  threads_processed  int default 0,
  deals_found        int default 0,
  contacts_found     int default 0,
  error_message      text,
  started_at         timestamptz default now(),
  completed_at       timestamptz
);
alter table sync_runs enable row level security;
create policy "Users see own sync runs" on sync_runs for all using (auth.uid() = user_id);

-- ── Thread snapshots ──────────────────────────────────────────────────
create table if not exists thread_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  sync_run_id        uuid references sync_runs(id) on delete set null,
  thread_id          text not null,
  subject            text,
  participants       text[],
  date_from          timestamptz,
  date_to            timestamptz,
  preview_text       text,
  processing_status  text check (processing_status in ('success','failed','skipped')) default 'success',
  error_message      text,
  created_at         timestamptz default now(),
  unique (user_id, thread_id)
);
alter table thread_snapshots enable row level security;
create policy "Users see own snapshots" on thread_snapshots for all using (auth.uid() = user_id);

-- ── Calendar events ───────────────────────────────────────────────────
create table if not exists calendar_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  event_id          text not null,
  title             text,
  start_time        timestamptz,
  end_time          timestamptz,
  attendee_emails   text[],
  linked_thread_ids text[],
  created_at        timestamptz default now(),
  unique (user_id, event_id)
);
alter table calendar_events enable row level security;
create policy "Users see own events" on calendar_events for all using (auth.uid() = user_id);

-- ── Digests ───────────────────────────────────────────────────────────
create table if not exists digests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  content      text not null,
  trigger      text check (trigger in ('manual','sync','cron')) default 'manual',
  generated_at timestamptz default now()
);
alter table digests enable row level security;
create policy "Users see own digests" on digests for all using (auth.uid() = user_id);

-- ── User settings ─────────────────────────────────────────────────────
create table if not exists user_settings (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  timezone              text default 'America/Chicago',
  digest_hour           int default 7 check (digest_hour >= 0 and digest_hour <= 23),
  digest_minute         int default 30 check (digest_minute >= 0 and digest_minute <= 59),
  email_digest_enabled  boolean default true,
  sync_limit            int default 10 check (sync_limit in (10,25,50,100)),
  keyword_filters       text[],
  retention_days        int default 30,
  updated_at            timestamptz default now()
);
alter table user_settings enable row level security;
create policy "Users see own settings" on user_settings for all using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────
create index if not exists deals_user_id_idx          on deals (user_id, created_at desc);
create index if not exists contacts_user_id_idx       on contacts (user_id, created_at desc);
create index if not exists sync_runs_user_id_idx      on sync_runs (user_id, started_at desc);
create index if not exists thread_snapshots_user_idx  on thread_snapshots (user_id, created_at desc);
create index if not exists calendar_events_user_idx   on calendar_events (user_id, start_time asc);
create index if not exists digests_user_id_idx        on digests (user_id, generated_at desc);
