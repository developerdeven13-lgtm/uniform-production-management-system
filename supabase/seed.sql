-- ============================================================
-- SEED: Create initial super admin user
-- Run this AFTER creating the auth user via Supabase dashboard
-- or via: supabase auth admin create-user
-- ============================================================

-- Update the first registered user to super_admin
-- Replace 'your-user-id-here' with the actual UUID from auth.users
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@yourcompany.com';

-- Example test data (optional — remove in production)
-- INSERT INTO customers (full_name, phone, organization, created_by)
-- VALUES ('Test Customer', '+91 98765 43210', 'City Hospital', '<your-profile-id>');
