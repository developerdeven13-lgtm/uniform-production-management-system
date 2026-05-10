-- ============================================================
-- FULL RESET - run this in Supabase SQL Editor to wipe everything
-- and start fresh. Safe to run multiple times.
-- ============================================================

-- Drop materialized view first
DROP MATERIALIZED VIEW IF EXISTS mv_tailor_performance CASCADE;

-- Drop all application tables (CASCADE handles triggers + foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS media_attachments CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS embroidery_details CASCADE;
DROP TABLE IF EXISTS tailor_assignments CASCADE;
DROP TABLE IF EXISTS customer_measurement_profiles CASCADE;
DROP TABLE IF EXISTS order_measurements CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS order_number_seq CASCADE;

-- Drop all functions with CASCADE (removes dependent triggers automatically)
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS sync_order_total_items() CASCADE;
DROP FUNCTION IF EXISTS record_order_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_order_status_change() CASCADE;
DROP FUNCTION IF EXISTS auth_user_role() CASCADE;
DROP FUNCTION IF EXISTS refresh_analytics() CASCADE;
DROP FUNCTION IF EXISTS search_orders(TEXT, TEXT[], TEXT[], UUID, DATE, DATE, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS get_overdue_orders() CASCADE;

-- Drop custom types (CASCADE removes dependent columns)
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS media_type CASCADE;
DROP TYPE IF EXISTS product_type CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
