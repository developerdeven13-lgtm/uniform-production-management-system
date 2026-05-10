-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'support_staff',
  'tailor_master',
  'tailor',
  'embroidery_staff'
);

CREATE TYPE order_status AS ENUM (
  'draft',
  'confirmed',
  'assigned',
  'in_tailoring',
  'in_embroidery',
  'quality_check',
  'ready',
  'delivered',
  'cancelled'
);

CREATE TYPE product_type AS ENUM (
  'scrubs',
  'apron',
  'head_cap',
  'card_holder'
);

CREATE TYPE media_type AS ENUM (
  'image',
  'video',
  'voice_note',
  'document'
);

CREATE TYPE notification_type AS ENUM (
  'order_created',
  'order_status_changed',
  'order_assigned',
  'order_ready',
  'order_delivered',
  'embroidery_requested',
  'quality_check_failed',
  'mention'
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  role          user_role NOT NULL DEFAULT 'support_staff',
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  phone             TEXT NOT NULL,
  phone_alt         TEXT,
  email             TEXT,
  organization      TEXT,
  address           TEXT,
  notes             TEXT,
  phone_normalized  TEXT GENERATED ALWAYS AS (regexp_replace(phone, '[^0-9]', '', 'g')) STORED,
  search_vector     TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(full_name, '') || ' ' ||
      coalesce(phone, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(organization, '')
    )
  ) STORED,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_customers_phone_normalized ON customers(phone_normalized);
CREATE INDEX idx_customers_search_vector ON customers USING GIN(search_vector);
CREATE INDEX idx_customers_full_name ON customers(full_name);
CREATE INDEX idx_customers_organization ON customers(organization);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          TEXT NOT NULL UNIQUE,
  customer_id           UUID NOT NULL REFERENCES customers(id),
  status                order_status NOT NULL DEFAULT 'draft',
  priority              SMALLINT NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 5),
  delivery_date         DATE,
  total_items           SMALLINT NOT NULL DEFAULT 0,
  special_instructions  TEXT,
  notes                 TEXT,
  ai_intake_used        BOOLEAN NOT NULL DEFAULT false,
  ai_transcript         TEXT,
  ai_confidence         NUMERIC(4,3),
  created_by            UUID NOT NULL REFERENCES profiles(id),
  confirmed_by          UUID REFERENCES profiles(id),
  confirmed_at          TIMESTAMPTZ,
  search_vector         TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(order_number, '') || ' ' ||
      coalesce(special_instructions, '') || ' ' ||
      coalesce(notes, '')
    )
  ) STORED,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_search_vector ON orders USING GIN(search_vector);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sequence_number       SMALLINT NOT NULL,
  product_type          product_type NOT NULL,
  quantity              SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  color                 TEXT,
  piping_color          TEXT,
  design_config         JSONB NOT NULL DEFAULT '{}',
  has_embroidery        BOOLEAN NOT NULL DEFAULT false,
  embroidery_name       TEXT,
  embroidery_logo_url   TEXT,
  special_instructions  TEXT,
  status                order_status NOT NULL DEFAULT 'draft',
  unit_price            NUMERIC(10,2),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, sequence_number)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_type ON order_items(product_type);
CREATE INDEX idx_order_items_status ON order_items(status);
CREATE INDEX idx_order_items_has_embroidery ON order_items(has_embroidery) WHERE has_embroidery = true;

-- ============================================================
-- ORDER MEASUREMENTS
-- ============================================================
CREATE TABLE order_measurements (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id           UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  customer_id             UUID NOT NULL REFERENCES customers(id),
  product_type            product_type NOT NULL,
  chest                   NUMERIC(5,1),
  waist                   NUMERIC(5,1),
  hip                     NUMERIC(5,1),
  shoulder                NUMERIC(5,1),
  sleeve_length           NUMERIC(5,1),
  body_length             NUMERIC(5,1),
  inseam                  NUMERIC(5,1),
  neck                    NUMERIC(5,1),
  head_circumference      NUMERIC(5,1),
  card_size               TEXT,
  custom_measurements     JSONB NOT NULL DEFAULT '{}',
  prefilled_from_profile  BOOLEAN NOT NULL DEFAULT false,
  notes                   TEXT,
  measured_by             UUID REFERENCES profiles(id),
  measured_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_measurements_order_item_id ON order_measurements(order_item_id);
CREATE INDEX idx_measurements_customer_id ON order_measurements(customer_id);
CREATE INDEX idx_measurements_customer_product ON order_measurements(customer_id, product_type);

-- ============================================================
-- CUSTOMER MEASUREMENT PROFILES (reusable)
-- ============================================================
CREATE TABLE customer_measurement_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_type          product_type NOT NULL,
  label                 TEXT NOT NULL DEFAULT 'Default',
  chest                 NUMERIC(5,1),
  waist                 NUMERIC(5,1),
  hip                   NUMERIC(5,1),
  shoulder              NUMERIC(5,1),
  sleeve_length         NUMERIC(5,1),
  body_length           NUMERIC(5,1),
  inseam                NUMERIC(5,1),
  neck                  NUMERIC(5,1),
  head_circumference    NUMERIC(5,1),
  card_size             TEXT,
  custom_measurements   JSONB NOT NULL DEFAULT '{}',
  is_default            BOOLEAN NOT NULL DEFAULT false,
  notes                 TEXT,
  created_by            UUID NOT NULL REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, product_type, label)
);

CREATE INDEX idx_cmp_customer_product ON customer_measurement_profiles(customer_id, product_type);

-- ============================================================
-- TAILOR ASSIGNMENTS
-- ============================================================
CREATE TABLE tailor_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id   UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  tailor_id       UUID NOT NULL REFERENCES profiles(id),
  assigned_by     UUID NOT NULL REFERENCES profiles(id),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  estimated_hours NUMERIC(4,1),
  actual_hours    NUMERIC(4,1),
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_order_item_id ON tailor_assignments(order_item_id);
CREATE INDEX idx_assignments_tailor_id ON tailor_assignments(tailor_id);
CREATE INDEX idx_assignments_tailor_active ON tailor_assignments(tailor_id, is_active) WHERE is_active = true;
CREATE INDEX idx_assignments_assigned_at ON tailor_assignments(assigned_at DESC);

-- ============================================================
-- EMBROIDERY DETAILS
-- ============================================================
CREATE TABLE embroidery_details (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id         UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  assigned_to           UUID REFERENCES profiles(id),
  assigned_by           UUID REFERENCES profiles(id),
  assigned_at           TIMESTAMPTZ,
  embroidery_type       TEXT,
  placement             TEXT,
  thread_colors         TEXT[],
  logo_url              TEXT,
  name_text             TEXT,
  font_style            TEXT,
  special_instructions  TEXT,
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_embroidery_order_item_id ON embroidery_details(order_item_id);
CREATE INDEX idx_embroidery_assigned_to ON embroidery_details(assigned_to);
CREATE INDEX idx_embroidery_status ON embroidery_details(status);

-- ============================================================
-- ORDER STATUS HISTORY (immutable audit trail)
-- ============================================================
CREATE TABLE order_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id   UUID REFERENCES order_items(id) ON DELETE CASCADE,
  from_status     order_status,
  to_status       order_status NOT NULL,
  changed_by      UUID NOT NULL REFERENCES profiles(id),
  reason          TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_status_history_changed_by ON order_status_history(changed_by);
CREATE INDEX idx_status_history_created_at ON order_status_history(created_at DESC);

-- ============================================================
-- MEDIA ATTACHMENTS
-- ============================================================
CREATE TABLE media_attachments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id     UUID REFERENCES order_items(id) ON DELETE CASCADE,
  CONSTRAINT media_must_have_parent CHECK (
    order_id IS NOT NULL OR order_item_id IS NOT NULL
  ),
  media_type        media_type NOT NULL,
  file_name         TEXT NOT NULL,
  file_size_bytes   BIGINT NOT NULL,
  mime_type         TEXT NOT NULL,
  storage_bucket    TEXT NOT NULL,
  storage_path      TEXT NOT NULL,
  public_url        TEXT,
  duration_seconds  NUMERIC(8,2),
  transcription     TEXT,
  uploaded_by       UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_order_id ON media_attachments(order_id);
CREATE INDEX idx_media_order_item_id ON media_attachments(order_item_id);
CREATE INDEX idx_media_uploaded_by ON media_attachments(uploaded_by);
CREATE INDEX idx_media_media_type ON media_attachments(media_type);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          notification_type NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  data          JSONB NOT NULL DEFAULT '{}',
  is_read       BOOLEAN NOT NULL DEFAULT false,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_is_read ON notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID NOT NULL REFERENCES profiles(id),
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID NOT NULL,
  before_state    JSONB,
  after_state     JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
