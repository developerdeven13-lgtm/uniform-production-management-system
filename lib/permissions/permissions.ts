import type { UserRole } from '@/types/app.types'

export type Permission =
  | 'users.manage'
  | 'users.view'
  | 'customers.create'
  | 'customers.read'
  | 'customers.update'
  | 'customers.delete'
  | 'orders.create'
  | 'orders.read.all'
  | 'orders.read.own'
  | 'orders.confirm'
  | 'orders.cancel'
  | 'orders.advance_status'
  | 'orders.delete'
  | 'measurements.create'
  | 'measurements.read'
  | 'measurements.update'
  | 'assignments.create'
  | 'assignments.read'
  | 'assignments.update'
  | 'embroidery.assign'
  | 'embroidery.update'
  | 'media.upload'
  | 'media.delete'
  | 'ai.voice_intake'
  | 'notifications.read'
  | 'audit_logs.read'
  | 'analytics.read'
  | 'settings.manage'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'users.manage', 'users.view',
    'customers.create', 'customers.read', 'customers.update', 'customers.delete',
    'orders.create', 'orders.read.all', 'orders.read.own',
    'orders.confirm', 'orders.cancel', 'orders.advance_status', 'orders.delete',
    'measurements.create', 'measurements.read', 'measurements.update',
    'assignments.create', 'assignments.read', 'assignments.update',
    'embroidery.assign', 'embroidery.update',
    'media.upload', 'media.delete',
    'ai.voice_intake',
    'notifications.read',
    'audit_logs.read',
    'analytics.read',
    'settings.manage',
  ],
  admin: [
    'users.view',
    'customers.create', 'customers.read', 'customers.update', 'customers.delete',
    'orders.create', 'orders.read.all', 'orders.read.own',
    'orders.confirm', 'orders.cancel', 'orders.advance_status', 'orders.delete',
    'measurements.create', 'measurements.read', 'measurements.update',
    'assignments.create', 'assignments.read', 'assignments.update',
    'embroidery.assign', 'embroidery.update',
    'media.upload', 'media.delete',
    'ai.voice_intake',
    'notifications.read',
    'audit_logs.read',
    'analytics.read',
  ],
  support_staff: [
    'customers.create', 'customers.read', 'customers.update',
    'orders.create', 'orders.read.all', 'orders.read.own',
    'orders.confirm', 'orders.cancel',
    'measurements.create', 'measurements.read', 'measurements.update',
    'media.upload',
    'ai.voice_intake',
    'notifications.read',
  ],
  tailor_master: [
    'users.view',
    'customers.read',
    'orders.read.all', 'orders.read.own', 'orders.advance_status',
    'measurements.create', 'measurements.read', 'measurements.update',
    'assignments.create', 'assignments.read', 'assignments.update',
    'embroidery.assign', 'embroidery.update',
    'media.upload',
    'notifications.read',
    'analytics.read',
  ],
  tailor: [
    'orders.read.own',
    'orders.advance_status',
    'measurements.read', 'measurements.update',
    'assignments.read',
    'media.upload',
    'notifications.read',
  ],
  embroidery_staff: [
    'orders.read.own',
    'orders.advance_status',
    'embroidery.update',
    'media.upload',
    'notifications.read',
  ],
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}
