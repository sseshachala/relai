-- ─────────────────────────────────────────────────────────────────────
-- Relai — Migration v2
-- ─────────────────────────────────────────────────────────────────────
-- WHAT THIS MIGRATION DOES:
--
-- v1 deals table had:
--   id, user_id, thread_text, is_deal, deal_stage, urgency,
--   confidence, sentiment, next_action, summary, created_at
--   (NO thread_id column)
--
-- v1 had NO: sync_state, sync_runs, thread_snapshots,
--            calendar_events, digests, user_settings
--
-- This migration adds everything needed for v2.
-- Every statement is safe to re-run — will not fail if already applied.
-- ─────────────────────────────────────────────────────────────────────

-- ── 1. Add thread_id column to deals (v1 was missing this) ───────────
ALTER TABLE deals ADD COLUMN IF NOT EXISTS thread_id text;

-- ── 2. Add unique constraint on deals(user_id, thread_id) ────────────
--    Only possible after thread_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deals_user_id_thread_id_key'
  ) THEN
    ALTER TABLE deals
      ADD CONSTRAINT deals_user_id_thread_id_key UNIQUE (user_id, thread_id);
  END IF;
END $$;

-- ── 3. Add index on deals if missing ─────────────────────────────────
CREATE INDEX IF NOT EXISTS deals_user_id_idx ON deals (user_id, created_at DESC);

-- ── 4. Add contacts index if missing ─────────────────────────────────
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts (user_id, created_at DESC);

-- ── 5. Create sync_state if it doesn't exist ─────────────────────────
CREATE TABLE IF NOT EXISTS sync_state (
  user_id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_synced_at   timestamptz,
  last_history_id  text,
  threads_synced   int DEFAULT 0,
  is_syncing       boolean DEFAULT false,
  sync_started_at  timestamptz
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sync_state'
    AND   policyname = 'Users see own sync state'
  ) THEN
    ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own sync state"
      ON sync_state FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 6. Add is_syncing / sync_started_at if sync_state already existed
--    without those columns (some earlier versions omitted them)
ALTER TABLE sync_state ADD COLUMN IF NOT EXISTS is_syncing      boolean     DEFAULT false;
ALTER TABLE sync_state ADD COLUMN IF NOT EXISTS sync_started_at timestamptz DEFAULT null;

-- ── 7. Create sync_runs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_runs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status             text CHECK (status IN ('running','success','partial','failed')) DEFAULT 'running',
  trigger            text CHECK (trigger IN ('manual','cron','onboarding')) DEFAULT 'manual',
  threads_processed  int DEFAULT 0,
  deals_found        int DEFAULT 0,
  contacts_found     int DEFAULT 0,
  error_message      text,
  started_at         timestamptz DEFAULT now(),
  completed_at       timestamptz
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sync_runs'
    AND   policyname = 'Users see own sync runs'
  ) THEN
    ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own sync runs"
      ON sync_runs FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sync_runs_user_id_idx
  ON sync_runs (user_id, started_at DESC);

-- ── 8. Create thread_snapshots ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS thread_snapshots (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sync_run_id        uuid REFERENCES sync_runs(id) ON DELETE SET NULL,
  thread_id          text NOT NULL,
  subject            text,
  participants       text[],
  date_from          timestamptz,
  date_to            timestamptz,
  preview_text       text,
  processing_status  text CHECK (processing_status IN ('success','failed','skipped')) DEFAULT 'success',
  error_message      text,
  created_at         timestamptz DEFAULT now(),
  UNIQUE (user_id, thread_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'thread_snapshots'
    AND   policyname = 'Users see own snapshots'
  ) THEN
    ALTER TABLE thread_snapshots ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own snapshots"
      ON thread_snapshots FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS thread_snapshots_user_idx
  ON thread_snapshots (user_id, created_at DESC);

-- ── 9. Create calendar_events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id          text NOT NULL,
  title             text,
  start_time        timestamptz,
  end_time          timestamptz,
  attendee_emails   text[],
  linked_thread_ids text[],
  created_at        timestamptz DEFAULT now(),
  UNIQUE (user_id, event_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'calendar_events'
    AND   policyname = 'Users see own events'
  ) THEN
    ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own events"
      ON calendar_events FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS calendar_events_user_idx
  ON calendar_events (user_id, start_time ASC);

-- ── 10. Create digests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS digests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content      text NOT NULL,
  trigger      text CHECK (trigger IN ('manual','sync','cron')) DEFAULT 'manual',
  generated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'digests'
    AND   policyname = 'Users see own digests'
  ) THEN
    ALTER TABLE digests ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own digests"
      ON digests FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS digests_user_id_idx
  ON digests (user_id, generated_at DESC);

-- ── 11. Create user_settings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone              text DEFAULT 'America/Chicago',
  digest_hour           int  DEFAULT 7  CHECK (digest_hour   >= 0 AND digest_hour   <= 23),
  digest_minute         int  DEFAULT 30 CHECK (digest_minute >= 0 AND digest_minute <= 59),
  email_digest_enabled  boolean DEFAULT true,
  sync_limit            int  DEFAULT 10 CHECK (sync_limit IN (10,25,50,100)),
  keyword_filters       text[],
  retention_days        int  DEFAULT 30,
  updated_at            timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_settings'
    AND   policyname = 'Users see own settings'
  ) THEN
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own settings"
      ON user_settings FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- Migration v2 complete.
--
-- Changes applied to existing tables:
--   deals        → added column:     thread_id (text)
--   deals        → added constraint: unique(user_id, thread_id)
--   deals        → added index:      deals_user_id_idx
--   contacts     → added index:      contacts_user_id_idx
--   sync_state   → created if missing
--   sync_state   → added columns if missing: is_syncing, sync_started_at
--
-- New tables created:
--   sync_runs       (with RLS + index)
--   thread_snapshots (with RLS + index)
--   calendar_events  (with RLS + index)
--   digests          (with RLS + index)
--   user_settings    (with RLS)
--
-- All existing data in deals, contacts, sync_state is untouched.
-- Safe to re-run — nothing will error if already applied.
-- ─────────────────────────────────────────────────────────────────────
