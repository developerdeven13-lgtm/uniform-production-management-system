-- ============================================================
-- HELPER: get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_measurement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE embroidery_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (auth_user_role() IN ('super_admin', 'admin', 'tailor_master'));

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_role"
  ON profiles FOR UPDATE
  USING (auth_user_role() = 'super_admin');

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE POLICY "customers_select_all_staff"
  ON customers FOR SELECT
  USING (auth_user_role() IN (
    'super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor', 'embroidery_staff'
  ));

CREATE POLICY "customers_insert"
  ON customers FOR INSERT
  WITH CHECK (auth_user_role() IN ('super_admin', 'admin', 'support_staff'));

CREATE POLICY "customers_update"
  ON customers FOR UPDATE
  USING (auth_user_role() IN ('super_admin', 'admin', 'support_staff'));

CREATE POLICY "customers_delete"
  ON customers FOR DELETE
  USING (auth_user_role() = 'super_admin');

-- ============================================================
-- ORDERS
-- ============================================================
CREATE POLICY "orders_select_admin"
  ON orders FOR SELECT
  USING (auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master'));

CREATE POLICY "orders_select_tailor"
  ON orders FOR SELECT
  USING (
    auth_user_role() IN ('tailor', 'embroidery_staff')
    AND id IN (
      SELECT oi.order_id FROM order_items oi
      JOIN tailor_assignments ta ON ta.order_item_id = oi.id
      WHERE ta.tailor_id = auth.uid() AND ta.is_active = true
    )
  );

CREATE POLICY "orders_insert"
  ON orders FOR INSERT
  WITH CHECK (auth_user_role() IN ('super_admin', 'admin', 'support_staff'));

CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master'));

CREATE POLICY "orders_update_tailor"
  ON orders FOR UPDATE
  USING (
    auth_user_role() = 'tailor'
    AND id IN (
      SELECT oi.order_id FROM order_items oi
      JOIN tailor_assignments ta ON ta.order_item_id = oi.id
      WHERE ta.tailor_id = auth.uid() AND ta.is_active = true
    )
  );

CREATE POLICY "orders_delete_draft"
  ON orders FOR DELETE
  USING (auth_user_role() IN ('super_admin', 'admin') AND status = 'draft');

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE POLICY "order_items_select_admin"
  ON order_items FOR SELECT
  USING (auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master'));

CREATE POLICY "order_items_select_tailor"
  ON order_items FOR SELECT
  USING (
    auth_user_role() IN ('tailor', 'embroidery_staff')
    AND id IN (
      SELECT order_item_id FROM tailor_assignments
      WHERE tailor_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "order_items_insert"
  ON order_items FOR INSERT
  WITH CHECK (auth_user_role() IN ('super_admin', 'admin', 'support_staff'));

CREATE POLICY "order_items_update_admin"
  ON order_items FOR UPDATE
  USING (auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master'));

CREATE POLICY "order_items_update_tailor"
  ON order_items FOR UPDATE
  USING (
    auth_user_role() = 'tailor'
    AND id IN (
      SELECT order_item_id FROM tailor_assignments
      WHERE tailor_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================
-- ORDER MEASUREMENTS
-- ============================================================
CREATE POLICY "measurements_select"
  ON order_measurements FOR SELECT
  USING (
    auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master')
    OR (
      auth_user_role() = 'tailor'
      AND order_item_id IN (
        SELECT order_item_id FROM tailor_assignments
        WHERE tailor_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "measurements_insert"
  ON order_measurements FOR INSERT
  WITH CHECK (auth_user_role() IN (
    'super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor'
  ));

CREATE POLICY "measurements_update"
  ON order_measurements FOR UPDATE
  USING (auth_user_role() IN (
    'super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor'
  ));

-- ============================================================
-- CUSTOMER MEASUREMENT PROFILES
-- ============================================================
CREATE POLICY "cmp_select"
  ON customer_measurement_profiles FOR SELECT
  USING (auth_user_role() IN (
    'super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor'
  ));

CREATE POLICY "cmp_insert"
  ON customer_measurement_profiles FOR INSERT
  WITH CHECK (auth_user_role() IN (
    'super_admin', 'admin', 'support_staff', 'tailor_master'
  ));

CREATE POLICY "cmp_update"
  ON customer_measurement_profiles FOR UPDATE
  USING (auth_user_role() IN (
    'super_admin', 'admin', 'support_staff', 'tailor_master'
  ));

CREATE POLICY "cmp_delete"
  ON customer_measurement_profiles FOR DELETE
  USING (auth_user_role() IN ('super_admin', 'admin'));

-- ============================================================
-- TAILOR ASSIGNMENTS
-- ============================================================
CREATE POLICY "assignments_select_admin"
  ON tailor_assignments FOR SELECT
  USING (auth_user_role() IN ('super_admin', 'admin', 'tailor_master'));

CREATE POLICY "assignments_select_own"
  ON tailor_assignments FOR SELECT
  USING (tailor_id = auth.uid());

CREATE POLICY "assignments_insert"
  ON tailor_assignments FOR INSERT
  WITH CHECK (auth_user_role() IN ('super_admin', 'admin', 'tailor_master'));

CREATE POLICY "assignments_update"
  ON tailor_assignments FOR UPDATE
  USING (
    auth_user_role() IN ('super_admin', 'admin', 'tailor_master')
    OR (tailor_id = auth.uid() AND auth_user_role() = 'tailor')
  );

-- ============================================================
-- EMBROIDERY DETAILS
-- ============================================================
CREATE POLICY "embroidery_select_admin"
  ON embroidery_details FOR SELECT
  USING (auth_user_role() IN ('super_admin', 'admin', 'tailor_master'));

CREATE POLICY "embroidery_select_own"
  ON embroidery_details FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "embroidery_insert"
  ON embroidery_details FOR INSERT
  WITH CHECK (auth_user_role() IN ('super_admin', 'admin', 'tailor_master'));

CREATE POLICY "embroidery_update"
  ON embroidery_details FOR UPDATE
  USING (
    auth_user_role() IN ('super_admin', 'admin', 'tailor_master')
    OR (assigned_to = auth.uid() AND auth_user_role() = 'embroidery_staff')
  );

-- ============================================================
-- MEDIA ATTACHMENTS
-- ============================================================
CREATE POLICY "media_select_admin"
  ON media_attachments FOR SELECT
  USING (auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master'));

CREATE POLICY "media_select_tailor"
  ON media_attachments FOR SELECT
  USING (
    auth_user_role() = 'tailor'
    AND order_item_id IN (
      SELECT order_item_id FROM tailor_assignments
      WHERE tailor_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "media_insert"
  ON media_attachments FOR INSERT
  WITH CHECK (
    auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master')
    OR (
      auth_user_role() = 'tailor'
      AND order_item_id IN (
        SELECT order_item_id FROM tailor_assignments
        WHERE tailor_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "media_delete"
  ON media_attachments FOR DELETE
  USING (
    auth_user_role() IN ('super_admin', 'admin')
    OR (uploaded_by = auth.uid() AND created_at > now() - interval '24 hours')
  );

-- ============================================================
-- ORDER STATUS HISTORY
-- ============================================================
CREATE POLICY "status_history_select"
  ON order_status_history FOR SELECT
  USING (
    auth_user_role() IN ('super_admin', 'admin', 'support_staff', 'tailor_master')
    OR (
      auth_user_role() IN ('tailor', 'embroidery_staff')
      AND order_id IN (
        SELECT oi.order_id FROM order_items oi
        JOIN tailor_assignments ta ON ta.order_item_id = oi.id
        WHERE ta.tailor_id = auth.uid() AND ta.is_active = true
      )
    )
  );

-- Inserted by SECURITY DEFINER trigger only
CREATE POLICY "status_history_insert_trigger_only"
  ON order_status_history FOR INSERT
  WITH CHECK (false);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid());

-- Inserts done via service role inside Server Actions
CREATE POLICY "notifications_no_client_insert"
  ON notifications FOR INSERT
  WITH CHECK (false);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE POLICY "audit_logs_select"
  ON audit_logs FOR SELECT
  USING (auth_user_role() IN ('super_admin', 'admin'));

-- Only service role can insert audit logs
CREATE POLICY "audit_logs_no_client_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (false);
