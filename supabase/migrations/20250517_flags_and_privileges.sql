-- ============================================================
-- ORDER FLAGS  (tailors raise issues on order items)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_flags (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id     uuid        REFERENCES order_items(id) ON DELETE SET NULL,
  raised_by         uuid        NOT NULL REFERENCES profiles(id),
  title             text        NOT NULL,
  description       text,
  status            text        NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open', 'acknowledged', 'resolved')),
  acknowledged_by   uuid        REFERENCES profiles(id),
  acknowledged_at   timestamptz,
  resolved_by       uuid        REFERENCES profiles(id),
  resolved_at       timestamptz,
  resolution_note   text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Link existing media_attachments to flags (nullable — existing rows unaffected)
ALTER TABLE media_attachments
  ADD COLUMN IF NOT EXISTS flag_id uuid REFERENCES order_flags(id) ON DELETE SET NULL;

-- ============================================================
-- USER PRIVILEGE OVERRIDES  (per-user permission adjustments)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_privilege_overrides (
  user_id     uuid    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission  text    NOT NULL,
  granted     boolean NOT NULL,
  granted_by  uuid    REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, permission)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_order_flags_order_id     ON order_flags(order_id);
CREATE INDEX IF NOT EXISTS idx_order_flags_status       ON order_flags(status);
CREATE INDEX IF NOT EXISTS idx_order_flags_raised_by    ON order_flags(raised_by);
CREATE INDEX IF NOT EXISTS idx_media_flag_id            ON media_attachments(flag_id);
CREATE INDEX IF NOT EXISTS idx_privilege_overrides_uid  ON user_privilege_overrides(user_id);

-- ============================================================
-- RLS POLICIES — order_flags
-- ============================================================
ALTER TABLE order_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flags_select" ON order_flags FOR SELECT USING (
  raised_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'tailor_master')
  )
);

CREATE POLICY "flags_insert" ON order_flags FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('tailor', 'tailor_master', 'super_admin', 'admin')
  )
);

CREATE POLICY "flags_update" ON order_flags FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'tailor_master')
  )
);

-- ============================================================
-- RLS POLICIES — user_privilege_overrides
-- ============================================================
ALTER TABLE user_privilege_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "privilege_overrides_all" ON user_privilege_overrides FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
  )
);
