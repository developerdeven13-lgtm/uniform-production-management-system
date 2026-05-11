import { z } from 'zod'

export const AMBIGUITY_THRESHOLD = 0.70

// Wraps any field value with a confidence score
const confident = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    value: schema.nullable(),
    confidence: z.number().min(0).max(1),
  })

const confidentString = confident(z.string())
const confidentNumber = confident(z.number())
const confidentBoolean = confident(z.boolean())

export const ExtractedMeasurementsSchema = z.object({
  chest: confidentNumber,
  waist: confidentNumber,
  hip: confidentNumber,
  shoulder: confidentNumber,
  sleeve_length: confidentNumber,
  body_length: confidentNumber,
  inseam: confidentNumber,
  neck: confidentNumber,
  head_circumference: confidentNumber,
})

export const ExtractedItemSchema = z.object({
  product_type: confident(z.enum(['scrubs', 'apron', 'head_cap', 'card_holder'])),
  quantity: confidentNumber,
  gender: confident(z.enum(['male', 'female', 'unisex'])),
  color: confidentString,
  piping_color: confidentString,
  has_embroidery: confidentBoolean,
  embroidery_name: confidentString,
  special_instructions: confidentString,
  measurements: ExtractedMeasurementsSchema,
})

export const ExtractedOrderFieldsSchema = z.object({
  customer: z.object({
    name: confidentString,
    phone: confidentString,
    organization: confidentString,
  }),
  items: z.array(ExtractedItemSchema),
  delivery_date: confidentString,
  special_instructions: confidentString,
  overall_confidence: z.number().min(0).max(1),
})

export type ExtractedOrderFields = z.infer<typeof ExtractedOrderFieldsSchema>
export type ExtractedItem = z.infer<typeof ExtractedItemSchema>

// Returns true if a field is ambiguous (low confidence or null)
export function isAmbiguous(field: { value: unknown; confidence: number } | null | undefined): boolean {
  if (!field) return false
  if (field.value === null) return false  // null = not mentioned, not ambiguous
  return field.confidence < AMBIGUITY_THRESHOLD
}

// Collect all ambiguous field paths from the extracted response
export function getAmbiguousFields(fields: ExtractedOrderFields): string[] {
  const ambiguous: string[] = []

  if (isAmbiguous(fields.customer.name)) ambiguous.push('customer.name')
  if (isAmbiguous(fields.customer.phone)) ambiguous.push('customer.phone')
  if (isAmbiguous(fields.customer.organization)) ambiguous.push('customer.organization')
  if (isAmbiguous(fields.delivery_date)) ambiguous.push('delivery_date')
  if (isAmbiguous(fields.special_instructions)) ambiguous.push('special_instructions')

  fields.items.forEach((item, i) => {
    if (isAmbiguous(item.product_type)) ambiguous.push(`items.${i}.product_type`)
    if (isAmbiguous(item.quantity)) ambiguous.push(`items.${i}.quantity`)
    if (isAmbiguous(item.gender)) ambiguous.push(`items.${i}.gender`)
    if (isAmbiguous(item.color)) ambiguous.push(`items.${i}.color`)
    if (isAmbiguous(item.has_embroidery)) ambiguous.push(`items.${i}.has_embroidery`)
    if (isAmbiguous(item.embroidery_name)) ambiguous.push(`items.${i}.embroidery_name`)
  })

  return ambiguous
}
