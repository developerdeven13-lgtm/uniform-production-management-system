import { z } from 'zod'

export const OrderItemSchema = z.object({
  product_type: z.enum(['scrubs', 'apron', 'head_cap', 'card_holder']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(100),
  color: z.string().max(50).optional().nullable(),
  piping_color: z.string().max(50).optional().nullable(),
  has_embroidery: z.coerce.boolean().default(false),
  embroidery_name: z.string().max(100).optional().nullable(),
  embroidery_logo_url: z.string().url().optional().nullable().or(z.literal('')),
  special_instructions: z.string().max(500).optional().nullable(),
  unit_price: z.coerce.number().min(0).optional().nullable(),
})

export type OrderItemInput = z.infer<typeof OrderItemSchema>

export const CreateOrderSchema = z.object({
  customer_id: z.string().uuid('Please select a customer'),
  delivery_date: z.string().optional().nullable(),
  priority: z.coerce.number().int().min(1).max(5).default(2),
  special_instructions: z.string().max(1000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

export const MeasurementSchema = z.object({
  chest: z.coerce.number().min(0).max(200).optional().nullable(),
  waist: z.coerce.number().min(0).max(200).optional().nullable(),
  hip: z.coerce.number().min(0).max(200).optional().nullable(),
  shoulder: z.coerce.number().min(0).max(100).optional().nullable(),
  sleeve_length: z.coerce.number().min(0).max(100).optional().nullable(),
  body_length: z.coerce.number().min(0).max(200).optional().nullable(),
  inseam: z.coerce.number().min(0).max(150).optional().nullable(),
  neck: z.coerce.number().min(0).max(100).optional().nullable(),
  head_circumference: z.coerce.number().min(0).max(100).optional().nullable(),
  card_size: z.string().max(20).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type MeasurementInput = z.infer<typeof MeasurementSchema>
