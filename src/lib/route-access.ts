import type { AccountRole } from "@/lib/auth";

const publicRoutes = new Set([
  "", "index", "welcome", "role-login", "login", "register",
  "forgot-password", "verify-otp", "phone-login", "vendor-login",
  "admin-login", "driver-login", "vendor-forgot-password", "vendor-register",
  "about", "contact", "faq", "franchise", "privacy", "terms",
]);

const routesByRole: Record<AccountRole, Set<string>> = {
  customer: new Set([
    "(tabs)", "customer-dashboard", "address-map", "addresses", "booking",
    "cart", "checkout", "favorites", "hub", "loyalty", "notifications",
    "order-details", "orders", "profile", "search", "service-details",
    "services", "settings", "store-details", "stores", "subscriptions", "support",
  ]),
  vendor: new Set([
    "vendor", "vendor-bookings", "vendor-services", "vendor-schedule",
    "vendor-areas", "vendor-pos",
  ]),
  driver: new Set(["driver", "driver-orders"]),
  admin: new Set([
    "admin", "admin-bookings", "analytics", "categories", "commissions",
    "contact-messages", "coupons", "customers", "drivers", "invoices",
    "promo-codes", "reports", "service-items", "shops", "subcategories",
  ]),
};

export function isPublicRoute(segment: string): boolean {
  return publicRoutes.has(segment);
}

export function canRoleAccessRoute(role: AccountRole, segment: string): boolean {
  return isPublicRoute(segment) || routesByRole[role].has(segment);
}
