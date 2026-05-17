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
  | 'flags.raise'
  | 'flags.resolve'

export const PERMISSION_LABELS: Record<Permission, string> = {
  'users.manage':          'Manage Users',
  'users.view':            'View Users',
  'customers.create':      'Create Customers',
  'customers.read':        'View Customers',
  'customers.update':      'Edit Customers',
  'customers.delete':      'Delete Customers',
  'orders.create':         'Create Orders',
  'orders.read.all':       'View All Orders',
  'orders.read.own':       'View Own Orders',
  'orders.confirm':        'Confirm Orders',
  'orders.cancel':         'Cancel Orders',
  'orders.advance_status': 'Advance Order Status',
  'orders.delete':         'Delete Orders',
  'measurements.create':   'Add Measurements',
  'measurements.read':     'View Measurements',
  'measurements.update':   'Edit Measurements',
  'assignments.create':    'Create Assignments',
  'assignments.read':      'View Assignments',
  'assignments.update':    'Update Assignments',
  'embroidery.assign':     'Assign Embroidery',
  'embroidery.update':     'Update Embroidery',
  'media.upload':          'Upload Media',
  'media.delete':          'Delete Media',
  'ai.voice_intake':       'AI Voice Intake',
  'notifications.read':    'Read Notifications',
  'audit_logs.read':       'View Audit Logs',
  'analytics.read':        'View Analytics',
  'settings.manage':       'Manage Settings',
  'flags.raise':           'Raise Flags / Issues',
  'flags.resolve':         'Resolve Flags',
}

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  { label: 'Users',        permissions: ['users.manage', 'users.view'] },
  { label: 'Customers',    permissions: ['customers.create', 'customers.read', 'customers.update', 'customers.delete'] },
  { label: 'Orders',       permissions: ['orders.create', 'orders.read.all', 'orders.read.own', 'orders.confirm', 'orders.cancel', 'orders.advance_status', 'orders.delete'] },
  { label: 'Measurements', permissions: ['measurements.create', 'measurements.read', 'measurements.update'] },
  { label: 'Assignments',  permissions: ['assignments.create', 'assignments.read', 'assignments.update'] },
  { label: 'Embroidery',   permissions: ['embroidery.assign', 'embroidery.update'] },
  { label: 'Media',        permissions: ['media.upload', 'media.delete'] },
  { label: 'Flags',        permissions: ['flags.raise', 'flags.resolve'] },
  { label: 'System',       permissions: ['ai.voice_intake', 'notifications.read', 'audit_logs.read', 'analytics.read', 'settings.manage'] },
]

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
    'flags.raise', 'flags.resolve',
  ],
  admin: [
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
    'flags.raise', 'flags.resolve',
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
    'flags.raise', 'flags.resolve',
  ],
  tailor: [
    'orders.read.own',
    'orders.advance_status',
    'measurements.read', 'measurements.update',
    'assignments.read',
    'media.upload',
    'notifications.read',
    'flags.raise',
  ],
  embroidery_staff: [
    'orders.read.own',
    'orders.advance_status',
    'embroidery.update',
    'media.upload',
    'notifications.read',
    'flags.raise',
  ],
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}
