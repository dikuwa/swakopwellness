export const permissionCodes = [
  "bookings:view",
  "bookings:create",
  "bookings:update",
  "bookings:delete",
  "clients:view",
  "clients:update",
  "services:manage",
  "documents:create",
  "documents:void",
  "payments:record",
  "financials:view",
  "settings:manage",
  "users:manage",
  "suitability:view",
  "activity:view",
] as const;

export type PermissionCode = (typeof permissionCodes)[number];

export const rolePermissionDefaults: Record<"Owner" | "Admin" | "Staff", PermissionCode[]> = {
  Owner: [...permissionCodes],
  Admin: [
    "bookings:view",
    "bookings:create",
    "bookings:update",
    "clients:view",
    "clients:update",
    "services:manage",
    "documents:create",
    "payments:record",
  ],
  Staff: ["bookings:view", "bookings:create", "clients:view"],
};

export function hasPermission(permissions: Iterable<string>, required: PermissionCode) {
  return new Set(permissions).has(required);
}
