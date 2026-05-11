-- Add gender field to order_items
-- This is important because male/female uniform designs differ significantly

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'unisex')) DEFAULT 'unisex';
