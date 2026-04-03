-- ─────────────────────────────────────────────────────────────────────
-- Relai — Migration v3
-- Adds encrypted refresh token storage to sync_state
-- Safe to re-run — uses IF NOT EXISTS
-- ─────────────────────────────────────────────────────────────────────

-- Add encrypted_refresh_token column to sync_state
ALTER TABLE sync_state
  ADD COLUMN IF NOT EXISTS encrypted_refresh_token text;

-- ─────────────────────────────────────────────────────────────────────
-- Done.
-- sync_state → added column: encrypted_refresh_token (text, nullable)
-- After running this migration, update your .env.local and Vercel
-- environment variables with TOKEN_ENCRYPTION_KEY (see README).
-- ─────────────────────────────────────────────────────────────────────
