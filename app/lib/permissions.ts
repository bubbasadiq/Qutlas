export const STAFF_ROLES = [
  'super_admin',
  'catalogue_manager',
  'pricing_manager',
  'inventory_manager',
  'order_manager',
  'customer_support',
  'production_manager',
  'reporting',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function hasStaffPermission(userRoles: readonly StaffRole[], allowedRoles: readonly StaffRole[]) {
  return userRoles.includes('super_admin') || allowedRoles.some((role) => userRoles.includes(role));
}