-- ============================================================
-- FULL-TEXT SEARCH FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION search_orders(
  search_term    TEXT DEFAULT NULL,
  status_filter  order_status[] DEFAULT NULL,
  product_filter product_type[] DEFAULT NULL,
  tailor_filter  UUID DEFAULT NULL,
  date_from      DATE DEFAULT NULL,
  date_to        DATE DEFAULT NULL,
  lim            INT DEFAULT 50,
  off            INT DEFAULT 0
)
RETURNS SETOF orders AS $$
BEGIN
  RETURN QUERY
  SELECT o.*
  FROM orders o
  WHERE
    (search_term IS NULL OR search_term = ''
      OR o.search_vector @@ plainto_tsquery('english', search_term)
      OR EXISTS (
        SELECT 1 FROM customers c
        WHERE c.id = o.customer_id
          AND c.search_vector @@ plainto_tsquery('english', search_term)
      )
    )
    AND (status_filter IS NULL OR o.status = ANY(status_filter))
    AND (date_from IS NULL OR o.created_at >= date_from)
    AND (date_to IS NULL OR o.created_at < date_to + interval '1 day')
    AND (product_filter IS NULL OR EXISTS (
      SELECT 1 FROM order_items oi
      WHERE oi.order_id = o.id AND oi.product_type = ANY(product_filter)
    ))
    AND (tailor_filter IS NULL OR EXISTS (
      SELECT 1 FROM order_items oi
      JOIN tailor_assignments ta ON ta.order_item_id = oi.id
      WHERE oi.order_id = o.id AND ta.tailor_id = tailor_filter AND ta.is_active = true
    ))
  ORDER BY
    CASE WHEN search_term IS NOT NULL AND search_term <> ''
      THEN ts_rank(o.search_vector, plainto_tsquery('english', search_term))
    END DESC NULLS LAST,
    o.created_at DESC
  LIMIT lim OFFSET off;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- OVERDUE ORDERS FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION get_overdue_orders()
RETURNS SETOF orders AS $$
  SELECT * FROM orders
  WHERE delivery_date < CURRENT_DATE
    AND status NOT IN ('delivered', 'cancelled')
  ORDER BY delivery_date ASC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- TAILOR PERFORMANCE MATERIALIZED VIEW
-- ============================================================
CREATE MATERIALIZED VIEW mv_tailor_performance AS
SELECT
  p.id AS tailor_id,
  p.full_name AS tailor_name,
  COUNT(ta.id) FILTER (WHERE ta.is_active) AS active_assignments,
  COUNT(ta.id) FILTER (WHERE ta.completed_at IS NOT NULL) AS completed_assignments,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (ta.completed_at - ta.started_at)) / 3600)
    FILTER (WHERE ta.completed_at IS NOT NULL AND ta.started_at IS NOT NULL)
  ::NUMERIC, 1) AS avg_hours_per_item
FROM profiles p
LEFT JOIN tailor_assignments ta ON ta.tailor_id = p.id
WHERE p.role IN ('tailor', 'tailor_master')
GROUP BY p.id, p.full_name;

CREATE UNIQUE INDEX ON mv_tailor_performance(tailor_id);

-- Refresh function (called manually or via pg_cron)
CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tailor_performance;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- NOTIFY ON ORDER STATUS CHANGE (for realtime-like server alerts)
-- ============================================================
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM pg_notify(
      'order_status_changed',
      json_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'from_status', OLD.status,
        'to_status', NEW.status
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
