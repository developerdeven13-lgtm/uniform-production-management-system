-- ============================================================
-- ADDITIONAL COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================

-- Orders: filter by customer + status (customer order history)
CREATE INDEX idx_orders_customer_status
  ON orders(customer_id, status);

-- Orders: date range queries
CREATE INDEX idx_orders_delivery_status
  ON orders(delivery_date, status)
  WHERE delivery_date IS NOT NULL;

-- Order items: embroidery queue
CREATE INDEX idx_order_items_embroidery_status
  ON order_items(has_embroidery, status)
  WHERE has_embroidery = true;

-- Assignments: tailor workload (active + uncompleted)
CREATE INDEX idx_assignments_active_incomplete
  ON tailor_assignments(tailor_id, assigned_at DESC)
  WHERE is_active = true AND completed_at IS NULL;

-- Notifications: unread count per user (used on every page load)
CREATE INDEX idx_notifications_unread_count
  ON notifications(recipient_id)
  WHERE is_read = false;

-- Audit logs: recent activity per resource
CREATE INDEX idx_audit_logs_resource_recent
  ON audit_logs(resource_type, resource_id, created_at DESC);

-- Status history: order timeline view
CREATE INDEX idx_status_history_order_timeline
  ON order_status_history(order_id, created_at ASC);
