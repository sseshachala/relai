-- ─────────────────────────────────────────────────────────────────────
-- Relai — Migration v4
-- Adds deal_contacts join table and dead deal stage
-- Safe to re-run — uses IF NOT EXISTS
-- ─────────────────────────────────────────────────────────────────────

-- ── 1. Add 'dead' to deals.deal_stage ────────────────────────────────
-- Drop existing check constraint and recreate with dead included
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_deal_stage_check;
ALTER TABLE deals ADD CONSTRAINT deals_deal_stage_check
  CHECK (deal_stage IN ('prospect','active','stalled','closed','dead'));

-- ── 2. Create deal_contacts join table ───────────────────────────────
CREATE TABLE IF NOT EXISTS deal_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     uuid REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  contact_id  uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  role        text CHECK (role IN ('primary','stakeholder','cc')) DEFAULT 'primary',
  created_at  timestamptz DEFAULT now(),
  UNIQUE (deal_id, contact_id)
);

ALTER TABLE deal_contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'deal_contacts'
    AND policyname = 'Users see own deal contacts'
  ) THEN
    CREATE POLICY "Users see own deal contacts"
      ON deal_contacts FOR ALL
      USING (
        auth.uid() = (SELECT user_id FROM deals WHERE id = deal_id)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS deal_contacts_deal_id_idx    ON deal_contacts (deal_id);
CREATE INDEX IF NOT EXISTS deal_contacts_contact_id_idx ON deal_contacts (contact_id);

-- ─────────────────────────────────────────────────────────────────────
-- Done.
-- deals       → stage check now includes 'dead'
-- deal_contacts → new join table with RLS and indexes
-- ─────────────────────────────────────────────────────────────────────
