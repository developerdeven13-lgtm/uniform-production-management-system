-- ============================================================
-- STORAGE BUCKETS
-- Create buckets first, then apply RLS policies
-- ============================================================

-- Private bucket for order media (images, voice notes)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'order-media',
  'order-media',
  false,
  26214400
) ON CONFLICT (id) DO NOTHING;

-- Private bucket for embroidery logos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'embroidery-logos',
  'embroidery-logos',
  false,
  5242880
) ON CONFLICT (id) DO NOTHING;

-- Public bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES
-- Note: auth_user_role() must exist (from 00002) before running this
-- ============================================================

-- Drop existing policies first so this migration is idempotent
DROP POLICY IF EXISTS "order_media_select" ON storage.objects;
DROP POLICY IF EXISTS "order_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "order_media_delete" ON storage.objects;
DROP POLICY IF EXISTS "embroidery_logos_select" ON storage.objects;
DROP POLICY IF EXISTS "embroidery_logos_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;

-- order-media: select (admin + assigned tailors)
CREATE POLICY "order_media_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'order-media'
    AND (
      auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master')
      OR (
        auth_user_role() = 'tailor'
        AND (storage.foldername(name))[1] IN (
          SELECT oi.order_id::text
          FROM order_items oi
          JOIN tailor_assignments ta ON ta.order_item_id = oi.id
          WHERE ta.tailor_id = auth.uid() AND ta.is_active = true
        )
      )
    )
  );

-- order-media: insert
CREATE POLICY "order_media_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'order-media'
    AND auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor')
  );

-- order-media: delete (admin only)
CREATE POLICY "order_media_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'order-media'
    AND auth_user_role() IN ('super_admin', 'admin')
  );

-- embroidery-logos: select
CREATE POLICY "embroidery_logos_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'embroidery-logos'
    AND auth_user_role() IN (
      'super_admin', 'admin', 'support_staff', 'tailor_master', 'embroidery_staff'
    )
  );

-- embroidery-logos: insert
CREATE POLICY "embroidery_logos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'embroidery-logos'
    AND auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master')
  );

-- avatars: anyone authenticated can read
CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- avatars: user uploads their own avatar only
CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
