// Staff Lock — password gate for protected admin sections.
// Change STAFF_ADMIN_PASSWORD to update the PIN for restaurant staff.
export const STAFF_ADMIN_PASSWORD = '3557';

// These admin paths require the staff password.
// /admin/orders is intentionally absent — always open to staff.
export const LOCKED_PATHS = new Set([
  '/admin/dashboard',
  '/admin/users',
  '/admin/settings',
]);
