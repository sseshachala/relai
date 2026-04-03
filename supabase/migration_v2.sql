-- ─────────────────────────────────────────────────────────────────────
-- Relai — Migration v2
-- Run ONLY if you already ran schema v1 (deals + contacts + sync_state)
-- Safe to run multiple times — uses IF NOT EXISTS everywhere
-- ─────────────────────────────────────────────────────────────────────

-- ── Add unique constraint to deals on thread_id (if not exists) ───────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deals_user_id_thread_id_key'
  ) THEN
    ALTER TABLE deals ADD CONSTRAINT deals_user_id_thread_id_key UNIQUE (user_id, thread_id);
  END IF;
END $$;

-- ── Add is_syncing columns to sync_state (if not exists) ──────────────
ALTER TABLE sync_state ADD COLUMN IF NOT EXISTS is_syncing      boolean     default false;
ALTER TABLE sync_state ADD COLUMN IF NOT EXISTS sync_started_at timestamptz default null;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sync_runs' AND policyname = 'Users see own sync runs'
  ) THEN
    ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own sync runs" ON sync_runs FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'thread_snapshots' AND policyname = 'Users see own snapshots'
  ) THEN
    ALTER TABLE thread_snapshots ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own snapshots" ON thread_snapshots FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'calendar_events' AND policyname = 'Users see own events'
  ) THEN
    ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own events" ON calendar_events FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Digests ───────────────────────────────────────────────────────────
create table if not exists digests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  content      text not null,
  trigger      text check (trigger in ('manual','sync','cron')) default 'manual',
  generated_at timestamptz default now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'digests' AND policyname = 'Users see own digests'
  ) THEN
    ALTER TABLE digests ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own digests" ON digests FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── User settings ─────────────────────────────────────────────────────
create table if not exists user_settings (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  timezone              text default 'America/Chicago',
  digest_hour           int  default 7  check (digest_hour   >= 0 and digest_hour   <= 23),
  digest_minute         int  default 30 check (digest_minute >= 0 and digest_minute <= 59),
  email_digest_enabled  boolean default true,
  sync_limit            int  default 10 check (sync_limit in (10,25,50,100)),
  keyword_filters       text[],
  retention_days        int  default 30,
  updated_at            timestamptz default now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_settings' AND policyname = 'Users see own settings'
  ) THEN
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Indexes ───────────────────────────────────────────────────────────
create index if not exists sync_runs_user_id_idx      on sync_runs       (user_id, started_at desc);
create index if not exists thread_snapshots_user_idx  on thread_snapshots (user_id, created_at desc);
create index if not exists calendar_events_user_idx   on calendar_events  (user_id, start_time asc);
create index if not exists digests_user_id_idx        on digests          (user_id, generated_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- Done. 5 new tables added:
--   sync_runs, thread_snapshots, calendar_events, digests, user_settings
-- 2 columns added to sync_state:
--   is_syncing, sync_started_at
-- 1 constraint added to deals:
--   unique (user_id, thread_id)
-- ─────────────────────────────────────────────────────────────────────
