# Lumina Laundry application audit

Audit date: 2026-10-29  
Project: `C:\Users\nirdo\Projects\LuminaLaundryApp`  
Scope: source and configuration review plus the customer search implementation in this batch. The live website was consulted for the public service/discovery proposition; it was not modified. Source presence is not proof of runtime or backend functionality.

## Summary

The repository is an Expo Router / React Native app on Expo SDK 58 (`expo ~58.0.21`, React Native 0.88). The active customer navigator has Home, Services, Orders and Profile tabs. Root navigation is a Stack. There are existing customer checkout/account/support pages and separate admin, vendor and driver routes. The app has a themed provider, reusable themed styles, AsyncStorage preview records, API helpers and secure token storage.

This audit found broad screen coverage but substantial unverified behavior. Many operations routes are local storage previews, and admin/vendor/delivery APIs and role protections were not evidenced in these route components. Payment, OTP, booking, refund, GPS and notification outcomes must not be described as working against production. The implementation batch adds global service search at `/search`, linked from Home, using the configured catalogue API with debounced results and explicit loading, error and empty states.

## Status definitions

- **EXISTING**: route/config/source feature is present; runtime behavior may still need testing.
- **INCOMPLETE**: some relevant flow/UI exists but requested behavior is partial or unverified.
- **MISSING**: no active implementation found in inspected source.
- **BACKEND_BLOCKED**: requires an API/provider/server-side capability not verified in this audit.
- **VERIFIED**: behavior was exercised with evidence. No production, device, authentication, payment or external API behavior is marked verified here.

## Route inventory

`src/app/_layout.tsx` defines the root stack with headers hidden. `src/app/(tabs)/_layout.tsx` defines the customer bottom tabs. `(tabs)` is a route group and its pages resolve to the root customer paths.

| Route | Screen / role | Source and audit notes |
|---|---|---|
| `/` | Customer home entry | `src/app/(tabs)/index.tsx` is the active Home tab. No active `src/app/index.tsx` file was found; Expo Router group index supplies `/`. Several historical `.bak` files are not routes. |
| `/services` | Customer services tab | `src/app/(tabs)/services.tsx`; catalogue search/filter/favourite/cart UI. |
| `/orders` | Customer orders tab | `src/app/(tabs)/orders.tsx`; API/local outcomes require verification. |
| `/profile` | Customer profile tab | `src/app/(tabs)/profile.tsx`. |
| `/search` | Customer global service search | Added in this batch, `src/app/search.tsx`; uses `fetchServices` and routes to details. |
| `/service-details` | Customer service detail | `src/app/service-details.tsx`; reads `id` query parameter. |
| `/cart` | Customer cart | `src/app/cart.tsx`; local cart state. |
| `/booking` | Customer booking/scheduling | `src/app/booking.tsx`. |
| `/checkout` | Customer checkout | `src/app/checkout.tsx`; payment/provider outcome not exercised. |
| `/addresses` | Customer address book | `src/app/addresses.tsx`. |
| `/address-map` | Customer address map | `src/app/address-map.tsx`; permission/device map behavior not tested. |
| `/favorites` | Customer saved services | `src/app/favorites.tsx`. |
| `/categories` | Customer category page | `src/app/categories.tsx`. |
| `/subcategories` | Customer subcategory page | `src/app/subcategories.tsx`. |
| `/service-items` | Service item management/list | `src/app/service-items.tsx`; data behavior needs context/API verification. |
| `/stores` | Store discovery | `src/app/stores.tsx`; live distance/hours/availability not verified. |
| `/shops` | Shop information | `src/app/shops.tsx`; relationship to `/stores` should be clarified. |
| `/login` | Customer login | `src/app/login.tsx`; API not tested. |
| `/register` | Customer registration | `src/app/register.tsx`; API not tested. |
| `/phone-login` | Phone login entry | `src/app/phone-login.tsx`. |
| `/verify-otp` | Development OTP preview | `src/app/verify-otp.tsx` explicitly accepts any six digits and labels itself development-only; it does not verify identity. |
| `/forgot-password` | Password recovery | `src/app/forgot-password.tsx`; reset provider response unverified. |
| `/role-login` | Role sign-in chooser | `src/app/role-login.tsx`; calls `signIn` for server role and routes based on returned role. |
| `/customer-dashboard` | Customer dashboard | `src/app/customer-dashboard.tsx`; separate from customer tab Home. |
| `/welcome` | Welcome/entry | `src/app/welcome.tsx`; no complete onboarding/language flow found. |
| `/notifications` | Notification center | `src/app/notifications.tsx`; push/deep-link delivery unverified. |
| `/loyalty` | Customer rewards | `src/app/loyalty.tsx`; backend points/referrals not connected. |
| `/subscriptions` | Membership/subscription | `src/app/subscriptions.tsx`; billing/recurrence not verified. |
| `/promo-codes` | Customer promotions | `src/app/promo-codes.tsx`. |
| `/support` | Customer support | `src/app/support.tsx`; ticket submission not verified. |
| `/contact` | Contact | `src/app/contact.tsx`; delivery/actions not verified. |
| `/faq` | FAQ | `src/app/faq.tsx`. |
| `/about` | About | `src/app/about.tsx`. |
| `/terms` | Terms | `src/app/terms.tsx`. |
| `/privacy` | Privacy | `src/app/privacy.tsx`; deletion/retention controls unverified. |
| `/admin-login` | Admin login entry | `src/app/admin-login.tsx`. |
| `/admin` | Admin dashboard | `src/app/admin.tsx`; reads/writes AsyncStorage `lumina_orders`, not verified operational API. |
| `/admin-bookings` | Admin bookings | `src/app/admin-bookings.tsx`; local feature page. |
| `/customers` | Admin customers | `src/app/customers.tsx`; local feature page. |
| `/drivers` | Admin delivery partners | `src/app/drivers.tsx`; local feature page. |
| `/analytics` | Admin analytics | `src/app/analytics.tsx`; local feature page. |
| `/commissions` | Admin commissions | `src/app/commissions.tsx`; local feature page. |
| `/coupons` | Admin coupons | `src/app/coupons.tsx`; local feature page. |
| `/contact-messages` | Admin contact messages | `src/app/contact-messages.tsx`; local feature page. |
| `/invoices` | Invoice administration | `src/app/invoices.tsx`; issuance/payment data unverified. |
| `/reports` | Admin reports | `src/app/reports.tsx`; local feature page. |
| `/vendor-login` | Vendor sign-in | `src/app/vendor-login.tsx`; API/auth not tested. |
| `/vendor-register` | Vendor onboarding | `src/app/vendor-register.tsx`; approval/documents not verified. |
| `/vendor-forgot-password` | Vendor recovery | `src/app/vendor-forgot-password.tsx`. |
| `/vendor` | Vendor dashboard | `src/app/vendor.tsx`; `LocalFeaturePage`, device storage only. |
| `/vendor-bookings` | Vendor orders | `src/app/vendor-bookings.tsx`; local preview. |
| `/vendor-services` | Vendor services/pricing | `src/app/vendor-services.tsx`; local preview. |
| `/vendor-schedule` | Vendor hours/availability | `src/app/vendor-schedule.tsx`; local preview. |
| `/vendor-areas` | Vendor coverage | `src/app/vendor-areas.tsx`; local preview. |
| `/vendor-pos` | Vendor point of sale | `src/app/vendor-pos.tsx`; local preview, payment outcome not established. |
| `/driver-login` | Delivery partner sign-in | `src/app/driver-login.tsx`; API/auth not tested. |
| `/driver` | Delivery partner dashboard | `src/app/driver.tsx`; `LocalFeaturePage`, device storage only. |
| `/driver-orders` | Delivery tasks | `src/app/driver-orders.tsx`; local preview. |
| `/franchise` | Franchise inquiry | `src/app/franchise.tsx`; submission not verified. |
| `/hub` | Website/content hub | `src/app/hub.tsx`; inspect route intent before further work. |
| `/webview-test` | Development utility | `src/app/webview-test.tsx`; not a customer feature. |

Route file scan found no two active files resolving to the same path. A static scan of literal `router.push` / `router.replace` targets found no obvious missing target among the active route files. Dynamic route construction and actual navigation were not exhaustively runtime-tested. Routes are reachable through Expo Router; direct route access is not itself proof of role permission.

## Feature-by-feature status

| Scope | Status | Evidence, files and blockers |
|---|---|---|
| Splash, onboarding, language, launch | INCOMPLETE / MISSING | Splash config in `app.json`; `welcome` exists, but complete first-run onboarding and language selection were not found or device-tested. |
| Home, bottom nav, search, notifications, links | INCOMPLETE | Home and four tabs are present. New `/search` covers global service catalogue lookup. Home banners, repeat order, recent view, review/seasonal content, notification delivery and deep-link destinations remain incomplete. |
| Services, stores, pricing and discovery | INCOMPLETE | `/services`, `/service-details`, `/stores`, `/shops`, category pages exist. Service endpoint uses `fetchServices`; live response untested. Distance, hours, map, ratings/reviews, sort and availability remain incomplete/unverified. Website reference describes service browsing and nearby-store discovery; it is context, not API evidence. |
| Cart, pickup, checkout and confirmation | INCOMPLETE / BACKEND_BLOCKED | Cart uses AsyncStorage; booking/checkout screens and `createBooking` exist. Provider outcomes and booking API response were not verified. Care notes, complete fees/tax, express, coupon/loyalty redemption and server confirmation remain partial. |
| Orders and timeline | INCOMPLETE / BACKEND_BLOCKED | `fetchOrders` and customer order screens exist. Stages, status timeline, cancellations, reschedules, reorders, invoices, reviews and issue reports are not end-to-end verified. |
| Customer identity and account | INCOMPLETE / BACKEND_BLOCKED | `src/lib/auth.ts` uses API login/register/me/logout and token storage, but no API/auth response was verified. `verify-otp.tsx` is a clearly labelled mock. Profile/contact verification, secure session lifecycle and deletion are incomplete. |
| Payments, receipts and refunds | BACKEND_BLOCKED | `src/lib/payments.ts` / checkout flow present; no provider signature/server confirmation or refund response verified. |
| Support and policies | INCOMPLETE | FAQ/contact/support/policy routes exist; ticket persistence, WhatsApp/call/email actions and complaint resolution unverified. |
| Admin operations | BACKEND_BLOCKED | `admin.tsx` uses local order storage. Many management pages use `LocalFeaturePage`. No server-side admin operation or audit log was verified. Route-level authorization was not evidenced on dashboard components; their current storage actions are local previews, not live admin privileges. |
| Vendor operations | BACKEND_BLOCKED | Routes cover dashboard, onboarding, services, schedule, areas, bookings and POS. Local previews do not establish document approval, order acceptance/stages, handover, inventory, earnings or settlements. |
| Delivery operations | BACKEND_BLOCKED | Driver routes exist; local preview does not establish assignments, directions, contact, pickup/delivery proof, OTP, failure handling, earnings or performance. |
| Advanced features | INCOMPLETE / BACKEND_BLOCKED | Loyalty/subscription screens exist. Referral, points, recurring orders, live ETA/GPS, reminders, corporate orders, QR, damage claims, vouchers, multi-city and multilingual behavior not verified. |
| Design system and accessibility | INCOMPLETE | `src/constants/theme.ts`, `src/providers/app-theme-provider.tsx`, `src/hooks/use-themed-styles.ts` exist; this batch reused theming. Screen-reader/contrast/device checks remain. |
| Engineering and release | BACKEND_BLOCKED | Expo SDK 58 config, API wrapper, secure token storage and route structure exist. API contract checks, role authorization, automated test suite, device builds, privacy deletion, logging/rate limits and release rollback were not verified. |

## Source evidence reviewed

- Required project inputs: `MASTER_FEATURE_TRACKER.md`, `PROJECT_STATUS.md`, `PROJECT_FILE_INVENTORY.txt`, `package.json`, `app.json`, `app.config.js`, and `AGENTS.md`.
- Navigation and customer UI: `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, Home, services, cart, checkout, orders, profile and service detail routes.
- Theme and reusable UI: `src/constants/theme.ts`, `src/providers/app-theme-provider.tsx`, `src/hooks/use-themed-styles.ts`, `src/components/LocalFeaturePage.tsx`.
- Service, order and identity integrations: `src/lib/laundry-api.ts`, `src/lib/mobile-api.ts`, `src/lib/auth.ts`, `src/lib/payments.ts`, token storage and address-book helpers.
- Role route review: admin, vendor and driver dashboards plus role login and OTP preview.
- Website context: [Lumina Laundry public site](https://luminalaundry.com/). Its public statements (for example live tracking) were not treated as proof that the mobile API supports those features.
- Expo version context: [Expo SDK 58 reference](https://docs.expo.dev/versions/v58.0.0/), consistent with `package.json`.

## Risks and blockers

1. The `EXPO_PUBLIC_API_URL` configuration and staging contract/response were not verified. An API helper in source is not evidence that a request succeeds.
2. Authentication helpers exist, but protected screens must rely on server-side authorization for every privileged operation. A client route selector cannot enforce permissions.
3. Several management routes store records on-device through `LocalFeaturePage`; labels and UX must continue to make preview/local-only state explicit.
4. Payment, refund, OTP, booking, push and GPS flows require provider/server evidence and must not be simulated as successful.
5. Android JavaScript export is not a signed build or device test. Current validation outcomes are in `PROJECT_STATUS.md`.

## Implemented in this audit run

- Added `src/app/search.tsx`, a themed, debounced catalogue search with loading/error/empty states and navigation to service details.
- Added an accessible search entry to the Home header without changing the existing color, card or typography system.
- Updated `MASTER_FEATURE_TRACKER.md` with unique group statuses and evidence. No feature is marked `VERIFIED` based only on source presence.

## Remaining backlog

1. Verify auth and role authorization against staging; add session-gated UI only after server contract is clear.
2. Verify catalogue, address, booking, payment, order and refund endpoint contracts using safe staging credentials.
3. Complete customer order detail/timeline, cancellation/rescheduling rules, invoice and issue-report flows.
4. Complete missing home discovery content and store detail/map/hours, plus onboarding/language behavior.
5. Convert admin/vendor/delivery preview pages to role-authorized API workflows only when their APIs and response contracts exist.
6. Complete automated behavioral/accessibility tests and manual Android/iOS device checks. Current checks: `npx.cmd expo lint` passed with 16 warnings; `npx.cmd tsc --noEmit` passed; `npx.cmd expo export --platform android --no-bytecode` passed and produced a JS bundle only.
