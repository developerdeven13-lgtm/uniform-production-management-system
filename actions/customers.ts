'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CustomerSchema, UpdateCustomerSchema } from '@/lib/validations/customer.schema'
import type { Customer, ActionResult } from '@/types/app.types'

export async function createCustomer(
  _prevState: ActionResult<Customer>,
  formData: FormData
): Promise<ActionResult<Customer>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const raw = Object.fromEntries(formData)
  const parsed = CustomerSchema.safeParse({
    ...raw,
    email: raw['email'] || null,
    phone_alt: raw['phone_alt'] || null,
    organization: raw['organization'] || null,
    address: raw['address'] || null,
    notes: raw['notes'] || null,
  })

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Check for duplicate phone (normalized)
  const normalizedPhone = parsed.data.phone.replace(/[^0-9]/g, '')
  const { data: existing } = await supabase
    .from('customers')
    .select('id, full_name, phone')
    .eq('phone_normalized', normalizedPhone)
    .maybeSingle()

  if (existing) {
    return {
      success: false,
      error: `A customer with this phone number already exists: ${existing.full_name}`,
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: 'Failed to create customer. Please try again.' }
  }

  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'customer.create',
      resource_type: 'customer',
      resource_id: data.id,
      after_state: data,
    })
  } catch { /* non-fatal */ }

  revalidatePath('/customers')
  return { success: true, data: data as Customer }
}

export async function updateCustomer(
  customerId: string,
  _prevState: ActionResult<Customer>,
  formData: FormData
): Promise<ActionResult<Customer>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const raw = Object.fromEntries(formData)
  const parsed = UpdateCustomerSchema.safeParse({
    ...raw,
    email: raw['email'] || null,
    phone_alt: raw['phone_alt'] || null,
    organization: raw['organization'] || null,
    address: raw['address'] || null,
    notes: raw['notes'] || null,
  })

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Check phone dedup if phone changed
  if (parsed.data.phone) {
    const normalizedPhone = parsed.data.phone.replace(/[^0-9]/g, '')
    const { data: existing } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('phone_normalized', normalizedPhone)
      .neq('id', customerId)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        error: `Phone number already used by: ${existing.full_name}`,
      }
    }
  }

  const { data: before } = await supabase
    .from('customers').select('*').eq('id', customerId).single()

  const { data, error } = await supabase
    .from('customers')
    .update(parsed.data)
    .eq('id', customerId)
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: 'Failed to update customer.' }
  }

  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'customer.update',
      resource_type: 'customer',
      resource_id: customerId,
      before_state: before,
      after_state: data,
    })
  } catch { /* non-fatal */ }

  revalidatePath('/customers')
  revalidatePath(`/customers/${customerId}`)
  return { success: true, data: data as Customer }
}

// General-purpose customer search — searches name, phone, organization, email
export async function searchCustomers(query: string): Promise<ActionResult<Customer[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const q = query.trim()
  if (q.length < 2) return { success: true, data: [] }

  // Build OR search across name, phone, org, email
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,organization.ilike.%${q}%,email.ilike.%${q}%`
    )
    .order('full_name')
    .limit(8)

  if (error) return { success: false, error: 'Search failed' }
  return { success: true, data: (data ?? []) as Customer[] }
}

// Phone-dedup specific search (used during customer creation)
export async function searchCustomersForDedup(phone: string): Promise<ActionResult<Customer[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const normalized = phone.replace(/[^0-9]/g, '')
  if (normalized.length < 7) return { success: true, data: [] }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('phone_normalized', `%${normalized}%`)
    .limit(5)

  if (error) return { success: false, error: 'Search failed' }
  return { success: true, data: (data ?? []) as Customer[] }
}

export async function getCustomers(
  page = 1,
  pageSize = 50
): Promise<ActionResult<{ customers: Customer[]; total: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { success: false, error: 'Failed to fetch customers' }
  return { success: true, data: { customers: (data ?? []) as Customer[], total: count ?? 0 } }
}

export async function getCustomer(customerId: string): Promise<ActionResult<Customer>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()

  if (error || !data) return { success: false, error: 'Customer not found' }
  return { success: true, data: data as Customer }
}
