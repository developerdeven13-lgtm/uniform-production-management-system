import { z } from 'zod'

export const CustomerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string()
    .min(7, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .regex(/^[+\d\s\-().]+$/, 'Invalid phone number format'),
  phone_alt: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  organization: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export type CustomerInput = z.infer<typeof CustomerSchema>

export const UpdateCustomerSchema = CustomerSchema.partial().extend({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
})

export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>
