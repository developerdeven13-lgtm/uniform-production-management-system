export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'support_staff'
  | 'tailor_master'
  | 'tailor'
  | 'embroidery_staff'

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'assigned'
  | 'in_tailoring'
  | 'in_embroidery'
  | 'quality_check'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type ProductType = 'scrubs' | 'apron' | 'head_cap' | 'card_holder'

export type MediaType = 'image' | 'video' | 'voice_note' | 'document'

export type NotificationType =
  | 'order_created'
  | 'order_status_changed'
  | 'order_assigned'
  | 'order_ready'
  | 'order_delivered'
  | 'embroidery_requested'
  | 'quality_check_failed'
  | 'mention'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string
  phone: string
  phone_alt: string | null
  email: string | null
  organization: string | null
  address: string | null
  notes: string | null
  phone_normalized: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  status: OrderStatus
  priority: 1 | 2 | 3 | 4 | 5
  delivery_date: string | null
  total_items: number
  special_instructions: string | null
  notes: string | null
  ai_intake_used: boolean
  ai_transcript: string | null
  ai_confidence: number | null
  created_by: string
  confirmed_by: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  sequence_number: number
  product_type: ProductType
  quantity: number
  gender: 'male' | 'female' | 'unisex' | null
  color: string | null
  piping_color: string | null
  design_config: Record<string, unknown>
  has_embroidery: boolean
  embroidery_name: string | null
  embroidery_logo_url: string | null
  special_instructions: string | null
  status: OrderStatus
  unit_price: number | null
  created_at: string
  updated_at: string
  measurements?: OrderMeasurement
  assignment?: TailorAssignment
  embroidery_detail?: EmbroideryDetail
  media?: MediaAttachment[]
}

export interface OrderMeasurement {
  id: string
  order_item_id: string
  customer_id: string
  product_type: ProductType
  chest: number | null
  waist: number | null
  hip: number | null
  shoulder: number | null
  sleeve_length: number | null
  body_length: number | null
  inseam: number | null
  neck: number | null
  head_circumference: number | null
  card_size: string | null
  custom_measurements: Record<string, unknown>
  prefilled_from_profile: boolean
  notes: string | null
  measured_by: string | null
  measured_at: string | null
  created_at: string
  updated_at: string
}

export interface CustomerMeasurementProfile {
  id: string
  customer_id: string
  product_type: ProductType
  label: string
  chest: number | null
  waist: number | null
  hip: number | null
  shoulder: number | null
  sleeve_length: number | null
  body_length: number | null
  inseam: number | null
  neck: number | null
  head_circumference: number | null
  card_size: string | null
  custom_measurements: Record<string, unknown>
  is_default: boolean
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface TailorAssignment {
  id: string
  order_item_id: string
  tailor_id: string
  assigned_by: string
  assigned_at: string
  started_at: string | null
  completed_at: string | null
  estimated_hours: number | null
  actual_hours: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  tailor?: Profile
}

export interface EmbroideryDetail {
  id: string
  order_item_id: string
  assigned_to: string | null
  assigned_by: string | null
  assigned_at: string | null
  embroidery_type: string | null
  placement: string | null
  thread_colors: string[] | null
  logo_url: string | null
  name_text: string | null
  font_style: string | null
  special_instructions: string | null
  started_at: string | null
  completed_at: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface MediaAttachment {
  id: string
  order_id: string | null
  order_item_id: string | null
  media_type: MediaType
  file_name: string
  file_size_bytes: number
  mime_type: string
  storage_bucket: string
  storage_path: string
  public_url: string | null
  duration_seconds: number | null
  transcription: string | null
  uploaded_by: string
  created_at: string
}

export interface Notification {
  id: string
  recipient_id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  order_item_id: string | null
  from_status: OrderStatus | null
  to_status: OrderStatus
  changed_by: string
  reason: string | null
  metadata: Record<string, unknown>
  created_at: string
  profile?: Profile
}

export interface AuditLog {
  id: string
  actor_id: string
  action: string
  resource_type: string
  resource_id: string
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  actor?: Profile
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  Partial<Record<UserRole, OrderStatus[]>>
> = {
  draft: {
    super_admin: ['confirmed', 'cancelled'],
    admin: ['confirmed', 'cancelled'],
    support_staff: ['confirmed', 'cancelled'],
  },
  confirmed: {
    super_admin: ['assigned', 'cancelled'],
    admin: ['assigned', 'cancelled'],
    tailor_master: ['assigned'],
  },
  assigned: {
    super_admin: ['in_tailoring', 'cancelled'],
    tailor_master: ['in_tailoring'],
    tailor: ['in_tailoring'],
  },
  in_tailoring: {
    super_admin: ['quality_check', 'in_embroidery'],
    tailor_master: ['in_embroidery', 'quality_check'],
    tailor: ['quality_check'],
  },
  in_embroidery: {
    super_admin: ['quality_check'],
    tailor_master: ['quality_check'],
    embroidery_staff: ['quality_check'],
  },
  quality_check: {
    super_admin: ['ready', 'in_tailoring'],
    admin: ['ready', 'in_tailoring'],
    tailor_master: ['ready', 'in_tailoring'],
  },
  ready: {
    super_admin: ['delivered'],
    admin: ['delivered'],
    support_staff: ['delivered'],
  },
  delivered: {},
  cancelled: {},
}
