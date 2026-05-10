import type { UserRole } from '@/types/app.types'

export const ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'support_staff',
  'tailor_master',
  'tailor',
  'embroidery_staff',
]

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  support_staff: 'Support Staff',
  tailor_master: 'Tailor Master',
  tailor: 'Tailor',
  embroidery_staff: 'Embroidery Staff',
}

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin']
export const MANAGEMENT_ROLES: UserRole[] = ['super_admin', 'admin', 'tailor_master']
export const STAFF_ROLES: UserRole[] = ['super_admin', 'admin', 'support_staff']
export const ALL_STAFF_ROLES: UserRole[] = [
  'super_admin', 'admin', 'support_staff', 'tailor_master', 'tailor', 'embroidery_staff',
]
export const PRODUCTION_ROLES: UserRole[] = ['tailor_master', 'tailor', 'embroidery_staff']
