# Lumina Laundry — Mobile/API Integration Audit

Audit scope: existing React Native + Expo application and Laravel sources already present in this workspace. This audit includes a fresh source-level review of active app flows and the fuller local Laravel API source. No staging credentials or reachable staging environment were available; source inspection is not live verification.

The dated execution notes below preserve audit history. **“Comprehensive workflow and contract audit — 2026-11-04” is the authoritative current snapshot and supersedes earlier statements where implementation has since changed.**

Reference screen: [`src/app/vendor-login.tsx`](./src/app/vendor-login.tsx). The vendor login is a role-entry screen; credential submission is delegated to [`src/app/role-login.tsx`](./src/app/role-login.tsx) and [`src/lib/auth.ts`](./src/lib/auth.ts).

## Executive summary

The app is an Expo Router application on Expo SDK 58 with a centralized HTTP client and a partially integrated Laravel mobile API. Customer authentication, catalogue loading, booking submission, order history/details/cancellation, address CRUD, pickup serviceability/slot lookup, vendor order lookup/driver assignment, driver task actions, and admin order operations have client implementations. The mobile vendor application endpoint and admin approval/rejection path are present in the current workspace.

The app is not fully backend-ready. Several screens still use `AsyncStorage` or explicit demo data, payments have no configured provider, OTP is unavailable, and vendor/admin/driver route authorization is only source-verified. A prior read-only API probe to the configured private-LAN host received no HTTP response. No end-to-end/live staging behavior is claimed.

## Project/configuration inspected

- [`package.json`](./package.json): current Expo `~58.0.23`, Expo Router `~58.0.30`, React Native `0.88.1`, SecureStore, AsyncStorage, Location, Maps, WebView, Reanimated.
- [`app.json`](./app.json) and [`app.config.js`](./app.config.js): Expo Router plugin, `luminalaundryapp` scheme, platform assets, optional Google Maps Android key, and runtime `EXPO_PUBLIC_API_URL` usage through config/environment.
- [`.env.example`](./.env.example): declares `EXPO_PUBLIC_API_URL` with the Laravel website host. Local `.env` files exist but their secret/config values are not reproduced in this report.
- [`src/app/_layout.tsx`](./src/app/_layout.tsx) and [`src/components/app-tabs.tsx`](./src/components/app-tabs.tsx): root Stack and customer tab navigation. Routes are file-based under [`src/app/`](./src/app).
- [`src/lib/mobile-api.ts`](./src/lib/mobile-api.ts): shared fetch wrapper, JSON parsing, Bearer token attachment, 401 token/session clearing, and API base URL validation.
- [`src/lib/token-storage.ts`](./src/lib/token-storage.ts): native SecureStore token storage; web fallback is [`src/lib/token-storage.web.ts`](./src/lib/token-storage.web.ts).
- [`src/lib/auth.ts`](./src/lib/auth.ts): account types, sign-in/register/session/profile/logout, role dashboard mapping.
- [`src/lib/laundry-api.ts`](./src/lib/laundry-api.ts): customer, address, availability, vendor, driver, and admin API functions.
- [`src/lib/address-book.ts`](./src/lib/address-book.ts): local address book and selected-address state.
- [`src/lib/demo-store.ts`](./src/lib/demo-store.ts): hardcoded service catalogue and local demo bookings.
- [`src/lib/payments.ts`](./src/lib/payments.ts): provider interface only; no provider is configured.
- [`src/lib/pickup-availability.ts`](./src/lib/pickup-availability.ts): provider abstraction with remote serviceability/availability fallback.

## Route and feature inventory

### Customer routes

Implemented screens include home, service catalogue/search, service details, stores/store details, cart, checkout, orders, order details, addresses/address map, profile, favourites, support, notifications, loyalty, subscriptions, settings, login/register/password reset, phone/OTP preview, and informational pages.

Primary files inspected:

- [`src/app/(tabs)/index.tsx`](./src/app/(tabs)/index.tsx)
- [`src/app/(tabs)/services.tsx`](./src/app/(tabs)/services.tsx)
- [`src/app/(tabs)/orders.tsx`](./src/app/(tabs)/orders.tsx)
- [`src/app/(tabs)/profile.tsx`](./src/app/(tabs)/profile.tsx)
- [`src/app/services.tsx`](./src/app/services.tsx)
- [`src/app/service-details.tsx`](./src/app/service-details.tsx)
- [`src/app/search.tsx`](./src/app/search.tsx)
- [`src/app/checkout.tsx`](./src/app/checkout.tsx)
- [`src/app/order-details.tsx`](./src/app/order-details.tsx)
- [`src/app/addresses.tsx`](./src/app/addresses.tsx)
- [`src/app/address-map.tsx`](./src/app/address-map.tsx)

### Role routes

- Admin: [`src/app/admin-login.tsx`](./src/app/admin-login.tsx), [`src/app/admin.tsx`](./src/app/admin.tsx), [`src/app/admin-bookings.tsx`](./src/app/admin-bookings.tsx), plus local preview management routes such as analytics, categories, customers, drivers, coupons, reports, and invoices.
- Vendor: [`src/app/vendor-login.tsx`](./src/app/vendor-login.tsx), [`src/app/vendor-register.tsx`](./src/app/vendor-register.tsx), [`src/app/vendor-forgot-password.tsx`](./src/app/vendor-forgot-password.tsx), [`src/app/vendor.tsx`](./src/app/vendor.tsx), [`src/app/vendor-bookings.tsx`](./src/app/vendor-bookings.tsx), and vendor services/schedule/areas/POS pages.
- Driver: [`src/app/driver-login.tsx`](./src/app/driver-login.tsx), [`src/app/driver.tsx`](./src/app/driver.tsx), [`src/app/driver-orders.tsx`](./src/app/driver-orders.tsx).

Many management pages delegate to [`src/components/LocalFeaturePage.tsx`](./src/components/LocalFeaturePage.tsx) or the vendor-specific local workspace component and are explicitly device-local previews rather than live records.

## Existing client API calls

All calls below flow through [`src/lib/mobile-api.ts`](./src/lib/mobile-api.ts), using the configured `EXPO_PUBLIC_API_URL` and a Bearer token when available.

| Area | Method/path implemented in app | Consumer | Current status |
|---|---|---|---|
| Auth | `POST /api/mobile/auth/login` | [`src/lib/auth.ts`](./src/lib/auth.ts), login/role screens | Implemented; response contract and role authorization need live verification |
| Auth | `POST /api/mobile/auth/register` | [`src/lib/auth.ts`](./src/lib/auth.ts), [`src/app/register.tsx`](./src/app/register.tsx) | Implemented for customer registration |
| Auth | `GET /api/mobile/auth/me` | session restore/profile | Implemented |
| Auth | `PATCH /api/mobile/auth/profile` | customer profile | Implemented |
| Auth | `POST /api/mobile/auth/logout` | customer profile/logout | Implemented with local cleanup even when server logout fails |
| Auth | `POST /api/mobile/auth/password/forgot` | forgot-password | Implemented; reset completion/token flow is not present |
| Catalogue | `GET /api/mobile/services?page=&search=` | services, search, service details, stores | Implemented; pagination and field contract are validated client-side |
| Booking | `POST /api/mobile/bookings` | [`src/app/checkout.tsx`](./src/app/checkout.tsx) | Implemented for authenticated customer booking |
| Orders | `GET /api/mobile/orders?page=` | orders/customer dashboard | Implemented with paginator iteration |
| Orders | `GET /api/mobile/orders/{booking}` | order details | Implemented |
| Orders | `GET /api/mobile/orders/{booking}/history` | order details | Implemented |
| Orders | `POST /api/mobile/orders/{booking}/cancel` | orders/order details | Implemented |
| Addresses | `GET/POST /api/mobile/addresses` | address flow | Active address-book service uses remote APIs when authenticated; guest drafts remain local |
| Addresses | `PUT/DELETE /api/mobile/addresses/{address}` | address flow | Active address-book service uses remote APIs when authenticated; guest drafts remain local |
| Addresses | `PATCH /api/mobile/addresses/{address}/default` | address flow | Active address-book service uses remote API when authenticated; guest drafts remain local |
| Availability | `GET /api/mobile/serviceability?city=&state=&pincode=` | checkout/pickup abstraction | Implemented fallback |
| Availability | `GET /api/mobile/vendors/{vendor}/availability?from_date=&to_date=&type=pickup` | checkout/pickup abstraction | Implemented fallback |
| Vendor | `GET /api/mobile/vendor/orders?page=` | vendor dashboard/bookings | Paginated Laravel response is now consumed page-by-page; live response/role protection not verified |
| Vendor | `GET /api/mobile/vendor/drivers` | vendor bookings | Implemented |
| Vendor | `PATCH /api/mobile/vendor/orders/{booking}/assign-driver` | vendor bookings | Implemented |
| Driver | `GET /api/mobile/driver/tasks` | driver orders | Implemented |
| Driver | `POST /api/mobile/driver/orders/{booking}/{role}/{action}` | driver orders | Implemented |
| Driver | `POST /api/mobile/driver/status/toggle` | driver dashboard | Implemented |
| Admin | `GET /api/mobile/admin/dashboard` | admin dashboard | Implemented |
| Admin | `GET /api/mobile/admin/orders` | admin dashboard | Implemented |
| Admin | `PATCH /api/mobile/admin/orders/{booking}/status` | admin dashboard | Implemented |

## Feature status

| Feature | Functional today | Backend gap/risk |
|---|---|---|
| Login | Network-backed through shared auth client; role selector supports customer/admin/vendor/driver | Need confirmed credentials payload, role rules, inactive-account behavior, token lifetime, and live environment test |
| Registration | Customer registration is network-backed | Vendor registration currently saves an application locally; no mobile vendor registration endpoint is called |
| Logout | Server request plus local token/profile cleanup | Must confirm server token revocation semantics and behavior after expired/invalid token |
| Services/details | Live catalogue paths exist and are consumed by services/search/details/stores | Need confirmed pagination schema, variant semantics, currency/tax rules, vendor metadata, and empty/error behavior |
| Booking/pickup | Checkout submits live booking payload after auth, address, same-vendor, date, and minimum-total checks | Payment is not submitted; slot response/provider is optional/unverified; checkout has local cart/profile/address state |
| Profile | Profile read/update and sign-out paths exist | Screen keeps local profile fields and address data; account deletion, email/phone verification, avatar, and password change are absent |
| Orders/history | Live list, detail, history, cancel paths exist | Reorder cannot be safely implemented from current order payload because service item/variant IDs are absent; live tracking/push updates absent |
| Addresses | Backend CRUD functions exist | Signed-in address book uses remote CRUD; guest drafts remain local |
| Payments | UI/provider abstraction exists | No provider is configured; no payment intent/order/verification/refund API is present in the app client; checkout explicitly does not collect payment |
| OTP | Screen clearly reports unavailable | No OTP delivery, verify, resend, expiry, or phone-auth endpoints are implemented |
| Vendor operations | Vendor order/driver API calls exist | Vendor service/schedule/area/POS pages are local preview records; no mobile CRUD API client for these entities |
| Admin/driver | Core order/task calls exist | Privileged authorization and mutation contracts require live server verification; many secondary routes remain local preview pages |

## Mock, local, and hardcoded data requiring replacement or confirmation

- [`src/lib/demo-store.ts`](./src/lib/demo-store.ts) contains five hardcoded services and local `DEMO-*` bookings.
- [`src/app/booking.tsx`](./src/app/booking.tsx) now consumes the live catalogue; [`src/lib/demo-store.ts`](./src/lib/demo-store.ts) remains a separate local preview store and is not evidence of live bookings.
- [`src/app/(tabs)/index.tsx`](./src/app/(tabs)/index.tsx) uses `DEMO_SERVICES` for some home presentation while also loading live orders/catalogue data.
- [`src/lib/address-book.ts`](./src/lib/address-book.ts) persists addresses locally; [`src/app/addresses.tsx`](./src/app/addresses.tsx) uses that local store.
- Cart state is local under the `lumina_cart` AsyncStorage key. Checkout reads local cart/profile/address state before posting the booking.
- Vendor service, schedule, area, and POS management pages use local AsyncStorage records through the local feature components.
- Many admin/customer support/invoice/report/analytics/notification/subscription screens use local preview storage or static copy; they do not establish backend synchronization.
- [`src/lib/payments.ts`](./src/lib/payments.ts) has no configured provider and therefore returns an unavailable result.
- [`src/app/verify-otp.tsx`](./src/app/verify-otp.tsx) is an unavailable/development preview, not real verification.
- Static status timelines and demo actions remain in orders/aftercare UI where the backend does not expose the needed event/action contract.

## Laravel contract comparison

Two backend source trees were inspected:

- [`luminalaundry.com/routes/api.php`](./luminalaundry.com/routes/api.php) contains the broader mobile contract: auth/profile/password reset, customer orders/bookings, addresses, serviceability/availability, vendor operations, driver operations, and admin operations.
- [`lumina (2)/lumina/routes/api.php`](./lumina%20(2)/lumina/routes/api.php) is an older/narrower contract containing services, auth login/register/me/logout, orders/bookings/history/details/cancel, but not the address, availability, vendor, driver, admin, profile-update, or password-reset paths used by the current client.

The fuller `luminalaundry.com` tree is the selected local source contract for this app. Verify that staging actually runs this route set before changing environment values or claiming live compatibility.

## Backend information required before implementation

1. Authoritative Laravel repository/deployment and the exact base URL for development, staging, and production.
2. Confirmation that the `luminalaundry.com/routes/api.php` route set is deployed, including all middleware and route prefixes.
3. Exact request/response JSON examples for every implemented call, including validation errors, pagination, nullable fields, status enums, currency, date/timezone, and rate limits.
4. Authentication contract: accepted `identity` values, role enforcement, token type/lifetime/revocation, inactive-account behavior, password reset completion, and whether vendor/driver/admin use the same auth endpoint.
5. Customer registration/profile contract, including email/phone verification and account deletion requirements.
6. Service catalogue contract: variants, units, vendor identity, taxes/fees, service availability, and whether prices are authoritative at booking time.
7. Booking contract: minimum total, same-vendor rule, address ownership, pickup/delivery slots, timezone, cancellation/reschedule rules, and server-side idempotency for retries.
8. Address contract and migration policy: whether app-local addresses should be uploaded, how defaults are represented, and how existing local IDs map to server IDs.
9. Payment provider contract: provider, create/intent endpoint, callback/webhook verification, payment status transitions, COD rules, refund endpoint, and PCI/security requirements.
10. Orders/aftercare contract: reorder IDs, tracking/ETA, notifications/deep links, rescheduling, cancellation windows, and history/event schema.
11. Vendor/admin/driver authorization matrix and the mobile endpoints for vendor service catalogue, schedules, areas, POS, settlements, and profile/company documents.
12. CORS, TLS, certificate, Android/iOS network policy, staging accounts, seed data, and a test plan for customer/vendor/driver/admin roles.

## Recommended implementation order after contract confirmation

1. Select the authoritative Laravel route source and run an authenticated staging smoke test.
2. Complete auth/session/profile/error handling and remove role assumptions from local session metadata.
3. Migrate addresses and availability to remote state, preserving local drafts only as an explicit offline/draft feature.
4. Validate catalogue and booking payloads against staging, then add idempotent retry behavior.
5. Integrate payment only after provider verification and server-side payment status handling are available.
6. Replace demo booking/order branches with a deliberate migration or remove them from production navigation.
7. Integrate vendor/admin/driver management only after server authorization and endpoint coverage are confirmed.
8. Add automated contract tests and role-based staging checks before release.

## Audit conclusion

The mobile app has a useful API foundation, but it is a hybrid of Laravel-backed features and clearly labeled local previews. It is not safe to declare full backend integration until the authoritative Laravel source, deployment route set, payment contract, address migration, role authorization, and response schemas are confirmed. The initial audit made no app code changes; the follow-up change is documented below.

## Execution follow-up — 2026-11-04

This section records the follow-up integration work and verification performed after the initial audit.

### Phase 1 — current configuration and backend source evidence

- The active `.env` contains `EXPO_PUBLIC_API_URL` pointing to an HTTP private-LAN host. The host value is intentionally omitted from this report. The value in [`.env.example`](./.env.example) is HTTPS and points to the public Lumina website host. Neither value was changed.
- [`luminalaundry.com/routes/api.php`](./luminalaundry.com/routes/api.php) is the fuller local Laravel source tree: it registers the mobile auth/profile/password reset, catalogue, booking/orders, addresses, availability, vendor/driver operations, and admin route groups. Its relevant controllers were inspected, including `MobileAuthController`, `MobileShopController`, `MobileAddressController`, `MobileAvailabilityController`, `MobileOperationsController`, and `MobileAdminController`.
- [`lumina (2)/lumina/routes/api.php`](./lumina%20(2)/lumina/routes/api.php) is a narrower/older local source copy; it does not register the address, availability, vendor, driver, or admin operations, profile update, or password-reset route set used by the current app.
- Therefore `luminalaundry.com` is the strongest candidate for the intended/current backend source in this workspace, but no repository/deployment link or deploy fingerprint proves that it is the authoritative source for the configured server. Deployment remains unverified.
- Source inspection confirms customer ownership checks for address mutations; role checks for vendor, driver, and admin mobile operations; active-account checks at login; customer profile update; and the local controller implementations for catalogue, booking, order details/history/cancellation, serviceability, and pickup availability.

Backend selection for code-level integration: use `luminalaundry.com` as the authoritative local Laravel source tree for this workspace. The mobile client's `/api/mobile/...` paths correspond to Laravel's API route prefix plus its `mobile` route group. Its controller payloads match the client models and inputs for the prioritized customer flows. This is a source selection, not a claim that this copy is deployed at the configured private-LAN host; both the configured host and `.env.example` host returned no HTTP response during this run.

The smaller `lumina (2)/lumina` controller copy does implement the overlapping catalogue/auth/order actions, but it lacks route/controller implementations for the current client’s profile PATCH, password reset, addresses, serviceability/availability, and role operations. It is not a complete source for this app's current client surface.

### Endpoint coverage by source inspection (not live verification)

| App feature | Route/controller in selected local source | Current client integration | Runtime verified |
|---|---|---|---|
| Services/details | `GET /api/mobile/services` (`MobileShopController::services`, paginated; accepts `search`) | Existing `fetchServices`; Home cards now use this live-data helper | No — host returned no response |
| Login/register | `POST /api/mobile/auth/login`, `POST /api/mobile/auth/register` | Existing `signIn` / `registerCustomer`; role and customer flows | No — no staging credentials/host |
| Session/profile/logout | `GET /api/mobile/auth/me`, `PATCH /api/mobile/auth/profile`, `POST /api/mobile/auth/logout` | Existing restore/update/logout helpers | No — no staging credentials/host |
| Booking/orders | `POST /api/mobile/bookings`, `GET /api/mobile/orders`, `GET /api/mobile/orders/{booking}`, `GET /api/mobile/orders/{booking}/history`, `POST /api/mobile/orders/{booking}/cancel` | Existing checkout/order helpers | No — no staging credentials/host; no write requests made |
| Address book | `GET/POST /api/mobile/addresses`, `PUT/DELETE /api/mobile/addresses/{address}`, `PATCH /api/mobile/addresses/{address}/default` | Existing `address-book.ts` uses remote CRUD when a token exists; unauthenticated drafts stay local | No — no staging credentials/host |
| Pickup availability | `GET /api/mobile/serviceability`, `GET /api/mobile/vendors/{vendor}/availability` | Existing availability abstraction/client functions | No — no staging credentials/host |

Missing mobile contracts in the selected local source for the requested integration scope: editable customer email/address as profile fields (profile PATCH accepts only name and phone; address has its own CRUD); vendor registration/application submission; payment initiation/verification/refunds; OTP; and vendor catalogue/schedule/areas/POS CRUD. These were not implemented or guessed.

### Phase 2 — safe API probe and client behavior

- One read-only `GET /api/mobile/services` was attempted against the currently configured private-LAN host. It produced no HTTP response, so there is no HTTP status code or response summary to report. No response body or credential data was logged.
- No protected endpoint was called: no staging account was explicitly configured/provided. No mutating endpoint was called. Nothing was sent to the public production URL.
- Client code inspection confirms Bearer token attachment, `Accept: application/json`, JSON body content type, BOM-tolerant JSON parsing, JSON validation-error extraction, and local auth clearing on HTTP 401 in [`src/lib/mobile-api.ts`](./src/lib/mobile-api.ts). These are source findings, not live server verification.

### Phase 3 — scoped integration change

- [`src/app/(tabs)/index.tsx`](./src/app/(tabs)/index.tsx) no longer displays hardcoded `DEMO_SERVICES` on the Home service cards. It loads cards from the existing `fetchServices()` API call, preserves the existing card layout and navigation, and treats catalogue failure independently so it does not block Home bookings/address loading.
- Address CRUD was found already wired in [`src/lib/address-book.ts`](./src/lib/address-book.ts): authenticated address book operations use the existing remote `fetch/create/update/delete/default` API functions; unauthenticated use retains local-device address drafts. This behavior was retained.
- Service catalogue/detail, auth, booking submission, orders/details/history/cancel, customer profile update, and logout already have client-side integrations. They were not rewritten without a reachable backend and staging account to confirm runtime behavior.

### Phase 4 — remaining unverified or missing contracts

- The configured backend host is unreachable from this audit environment. Deployed route availability and response schemas remain unverified.
- Payments: no provider is configured; no payment initiation/verification/refund call is verified.
- OTP: no delivery/verification/resend contract exists in the inspected mobile API surface.
- Vendor management: live order list and driver assignment calls exist, but mobile CRUD for vendor catalogue, schedule, areas, and POS is absent; those screens retain local preview behavior.
- Admin and driver route/controller code exists in the fuller local Laravel tree and checks roles/assignment ownership in controllers, but this is not deployment or live authorization verification. Confirm middleware coverage and negative-role tests against staging before release.
- Address CRUD has client/server source-level matching, but remote create/edit/default/delete have not been exercised against staging. The local-to-remote address behavior remains conditional on the presence of an auth token.
- Pickup availability has a source-level route/controller and client helper, but the configured host could not be reached; real slot availability is unverified.

### Phase 5 — checks

- `npx.cmd tsc --noEmit`: passed.
- `npx.cmd expo lint`: passed with no diagnostics.
- No test script or project test/spec files were found, so no automated test suite was available to run.

### Files changed in this follow-up

- [`src/app/(tabs)/index.tsx`](./src/app/(tabs)/index.tsx): Home catalogue now consumes the existing live catalogue API.
- [`src/app/vendor.tsx`](./src/app/vendor.tsx) and [`src/components/VendorFeaturePage.tsx`](./src/components/VendorFeaturePage.tsx): narrow lint-compatible effect/unused-code cleanup in the existing vendor workspace changes; no visual/UI changes.
- [`API_INTEGRATION_AUDIT.md`](./API_INTEGRATION_AUDIT.md): this execution follow-up.

### Manual verification required

Provide a reachable development/staging `EXPO_PUBLIC_API_URL` and explicitly designated test accounts for customer, vendor, driver, and admin roles. Then verify the public catalogue and authenticated flows (sign in/register/session restore/logout, address CRUD/default, serviceability/slots, booking, order list/detail/history/cancel, profile update) against that environment. Do not use production accounts for booking/cancellation tests. Confirm that the deployed route list matches the fuller Laravel source tree before calling the integration complete.

## Additional API wiring — 2026-11-04

The follow-up request was to connect every integration supported by the existing backend. A route-to-screen review found that most supported endpoint families were already called by the existing screens; their runtime behavior remains unverified because the configured host did not respond and no staging accounts were available. I made these additional source-backed fixes without changing the screen layout:

- [`src/app/booking.tsx`](./src/app/booking.tsx) now loads its service picker using `fetchServices()` instead of `DEMO_SERVICES`. It stores the real service-item and vendor IDs, and uses the first returned variant when present, matching the existing catalogue add-to-cart behavior. This makes the More → Book a Pickup entry flow capable of handing a valid catalogue selection to checkout; it does not claim that booking submission or pickup availability succeeded at runtime.
- [`src/app/customer-dashboard.tsx`](./src/app/customer-dashboard.tsx) now obtains the address count via `loadAddresses()` rather than reading the legacy `lumina_addresses` storage key directly. Signed-in address counts therefore use the existing remote-backed address-book path; guest drafts retain the existing local behavior.
- [`src/app/(tabs)/profile.tsx`](./src/app/(tabs)/profile.tsx) now prevents a signed-in user from treating an email edit as a successful backend profile update. The verified local profile PATCH contract supports name and phone only; address remains managed through address CRUD. No email endpoint was invented.

Validation after these changes: `npx.cmd tsc --noEmit` passed, and `npx.cmd expo lint` passed with no diagnostics. No automated project test suite is configured. These are static/code checks only; they do not change the prior runtime status (no HTTP response from the configured host, no authenticated calls, and no write operations attempted).

Other supported routes remain integrated through the existing shared API helpers/screens: customer login/register/session/logout; catalogue/search/details; booking submission; customer order list/details/history/cancellation; address CRUD/default; serviceability and pickup-slot lookup; vendor order/driver lookup and assignment; driver tasks/actions/status; and admin dashboard/order status. Payments, OTP, vendor registration submission, and vendor catalogue/schedule/areas/POS management remain unavailable because no matching mobile API contracts were found in the selected local Laravel source. Admin/driver/vendor privilege enforcement is present in local controller code but still needs negative-role verification against staging.

## Release-readiness preflight — 2026-11-04

- Initial [`npx.cmd expo-doctor`](./package.json) reported 8 SDK 58 package version mismatches. Updated those packages through `npx.cmd expo install --fix`; afterward Doctor passed **20/20** checks, and `npx.cmd tsc --noEmit` plus `npx.cmd expo lint` passed.
- npm reported **18 moderate advisories** after dependency installation. A production-dependency audit (`npm audit --omit=dev`) reports 5 moderate findings in Expo CLI/fingerprint dependency paths (`glob` / `minimatch`). npm's suggested `--force` remediation would downgrade Expo to SDK 51, so it was not applied. Review/fix this upstream without an unsafe major downgrade before release.
- [`eas.json`](./eas.json) sets both `preview` and `production` build profiles to the public website API base URL. That is production, not a staging target. No EAS build or submission was started, and no API URL was changed. A separate confirmed staging base URL is still required for safe end-to-end testing.
- A public release remains blocked by the missing staging server/accounts, unverified deployed route set and role authorization, unsupported backend contracts listed above, and device/store signing/review requirements. Workspace checks alone do not establish a release-ready live service.

## Role-based launch and access flow — 2026-11-04

This section supersedes earlier descriptions of automatic session restoration at app launch. The requested behavior is now a fresh sign-in screen on every cold app start.

- [`src/app/index.tsx`](./src/app/index.tsx) routes the launch entry to role selection/sign-in. [`src/providers/role-access-provider.tsx`](./src/providers/role-access-provider.tsx) starts with no active role on a new app process; a previously stored token alone does not open a portal.
- After API login or customer registration, the role returned by the backend activates the in-memory role. Login rejects a response whose account role differs from the selected role. Customer, vendor, driver, and admin dashboard routes are distinct.
- [`src/lib/route-access.ts`](./src/lib/route-access.ts) applies a default-deny screen map at the root navigation boundary. Unauthenticated users are redirected to role login; an authenticated role visiting a route outside its allow-list is redirected to its own dashboard. This is a client navigation safeguard only: Laravel middleware/controller authorization remains the security boundary for data and operations.
- Customer, vendor, admin, and driver logout clear the in-memory role and local token; customer uses the profile action, vendor uses its workspace action, and admin/driver dashboards expose a compact sign-out action. All return to role login.

### Account creation differs by role

The selected Laravel mobile API exposes `POST /api/mobile/auth/register` for **customers only**. On successful response, the app activates the server-returned customer role and opens the customer portal. The mobile signup form's address is not submitted to this endpoint; the existing address-book flow remains separate.

The website source has a server-rendered vendor registration form at `GET/POST /vendor/register`, while the mobile vendor registration screen currently saves an explicitly labeled on-device draft and does not submit it. These web routes use Laravel session/redirect behavior; no corresponding mobile JSON contract is declared in the inspected `routes/api.php`, so they are not silently called as APIs. The website source also has admin-created driver management; admin/driver accounts are not customer self-signup choices. The app must not let a user create a privileged account by choosing a role—the backend must authenticate an already provisioned account and return its role.

### Additional verified source mismatch and fix

`MobileOperationsController::vendorOrders` returns a Laravel paginator, while the mobile client previously treated its `data` field as the entire list. [`src/lib/laundry-api.ts`](./src/lib/laundry-api.ts) now consumes paginator pages and validates the envelope. This is a source-level contract correction; no live vendor API call was possible.

### Latest static checks

- `npx.cmd tsc --noEmit`: passed after role-flow changes (exit code 0).
- `npx.cmd expo lint`: passed after role-flow changes (exit code 0, no diagnostics).
- `npx.cmd expo-doctor`: approved registry-access run passed **20/20** checks (exit code 0). A final repeat after only role-logout UI changes produced no output while waiting on npm/network and was stopped; no Expo/package configuration changed after the successful 20/20 run.

### Current blockers and release sequence

1. Backend team: provide a reachable staging HTTPS base URL for `EXPO_PUBLIC_API_URL` (host only; client adds `/api/...`) and confirm the deployed API routes match the selected Laravel source. Keep production profiles and data unchanged.
2. Backend team: provision test accounts for customer, vendor, driver, and admin through the approved secure channel; do not send passwords/tokens in chat. Also confirm account approval/status requirements and role-specific permissions.
3. Backend team: define mobile JSON contracts for vendor application submission/management, payment initiation/verification/refund, and OTP if those features are required. Do not treat the website's session-based forms as mobile APIs.
4. App/backend QA: verify cold launch, wrong-role deep links, login/register, session expiry, logout, and negative authorization for every role on staging; then exercise catalogue, address CRUD, availability, booking, order history/details/cancellation, and role operations using disposable test data.
5. Release: verify target iOS/Android builds and signing identifiers, fix dependency advisories only with SDK-compatible versions, and complete store review. No build, publish, deployment, or production write was performed here.

### Files changed for role routing and this follow-up

- [`src/app/index.tsx`](./src/app/index.tsx), [`src/app/_layout.tsx`](./src/app/_layout.tsx), [`src/lib/route-access.ts`](./src/lib/route-access.ts), and [`src/providers/role-access-provider.tsx`](./src/providers/role-access-provider.tsx): cold-launch sign-in and role allow-list navigation guard.
- [`src/app/role-login.tsx`](./src/app/role-login.tsx), [`src/app/login.tsx`](./src/app/login.tsx), and [`src/app/register.tsx`](./src/app/register.tsx): activate the backend-returned role after successful login/customer signup.
- [`src/lib/auth.ts`](./src/lib/auth.ts): reject login response role mismatch.
- [`src/lib/laundry-api.ts`](./src/lib/laundry-api.ts): consume vendor-order paginator envelope.
- [`src/app/(tabs)/profile.tsx`](./src/app/(tabs)/profile.tsx), [`src/app/vendor.tsx`](./src/app/vendor.tsx), and [`src/components/role-logout-button.tsx`](./src/components/role-logout-button.tsx): clear local role during supported logout actions.

## Comprehensive workflow and contract audit — 2026-11-04

This section is the current audit snapshot and supersedes earlier statements in this file that mobile vendor registration was unavailable or that no automated tests existed. Evidence is the active Expo source plus `luminalaundry.com` Laravel source; the older `lumina (2)/lumina` Laravel copy has a narrower, different mobile route set and is not selected as the local contract. Nothing here proves that the selected source is what a remote server currently runs.

### Classification key

- **A — Implemented and code-verified:** app and local Laravel source provide matching behavior/contracts; this is not live verification.
- **B — Implemented, requires live testing:** request paths exist on both sides, but staging/runtime, role, persistence, or platform behavior is unverified.
- **C — Partially implemented:** some steps are live/API-backed and others remain local or incomplete.
- **D — UI/demo only:** visible workflow persists locally or shows preview behavior, not server state.
- **E — Missing backend contract:** no matching API/verification contract was found; do not simulate it.
- **F — Blocked:** live verification cannot proceed without a reachable staging API and role test accounts.

### Customer workflow

| Step | Status | Source-verified behavior and limitation |
|---|---|---|
| Onboarding and entry | C | Welcome/preferences are device-local. On cold launch, a stored SecureStore token is now verified through `/api/mobile/auth/me` before role routing. Network/configuration failures preserve the token and offer retry or continue-to-sign-in; expired/invalid sessions do not grant a role. |
| Register/sign in | B | Customer registration and role login use the mobile auth API. Customer registration sends name/email/phone/password and receives `{token,user}`; the entered pickup address is retained only in local profile storage, not created as a server address. Password reset requests a reset link, but the client has no reset-token completion flow. OTP/phone-login is preview-only. |
| Home/catalogue/search/details | B | Home and catalogue call the paginated service endpoint and surface catalogue failures separately. Service-card shortcuts open details when variants exist rather than silently selecting the first variant. Search, service details, and store pages need live field and availability testing. |
| Cart/variants | C | Cart is AsyncStorage-backed with validated service/variant/vendor IDs, quantities and snapshots; invalid legacy/demo entries are surfaced for explicit clearing, and mixed-vendor carts are blocked. Variant-bearing items require an option selection. The local price is a display estimate, not the booking authority. |
| Addresses | C | Authenticated address-book CRUD uses the API; remote forms send only supported label/address/landmark/city/state/PIN/coordinates/default fields, and selected/default/deleted-address state is synchronized locally. Unsupported remote custom labels, phone and instructions are not presented as persisted fields. Unauthenticated drafts remain local; signup address is not migrated automatically. |
| Serviceability/pickup time | B | Checkout asks serviceability and vendor pickup-slot endpoints. The abstraction may use fallback behavior when no remote provider is configured; real slot availability has not been exercised. |
| Booking/payment | C | Booking request contains item/variant IDs, quantities, address and pickup/delivery fields, not client prices. Laravel resolves current active catalogue records and their server prices, rejects mixed/unapproved vendors and totals below ₹200, then creates a pending, unpaid, COD booking in a DB transaction. Checkout validates real calendar dates, blocks submission until saved checkout data loads, prevents concurrent taps, reports the server-returned status, and does not claim a slot reservation or payment. No configured payment provider, initiation, signature/webhook verification or refund flow exists. |
| History/details/cancel | B | Paginated order list, detail, history and cancellation APIs are present. Server cancellation only accepts pending bookings. Reorder is unavailable without stable item/variant identifiers in the order response. |
| Profile/logout | C | Profile PATCH supports name and phone only; authenticated email is read-only and address has its own CRUD. Logout attempts token revocation and clears local session/token even if the request fails. Push updates/tracking are not established. |

### Vendor workflow

| Step | Status | Source-verified behavior and limitation |
|---|---|---|
| Authentication | B | Vendor uses the shared role login API. Backend returns 403 until vendor status is approved; pending applications receive a specific waiting-for-approval message. |
| Registration/application | A/B | Mobile `POST /api/mobile/auth/vendor-register` validates required shop/owner/contact/address/password fields and creates a `pending` vendor with no login token. Admin web UI exposes pending applications with approve/reject actions. The vendor form reports submission state and directs the applicant to sign in only after approval. Runtime email delivery/approval/login still needs staging verification. |
| Dashboard/bookings/driver assignment | B | Vendor order list (paginator), vendor drivers, and assignment to an approved driver belonging to the vendor are API-backed in source. The mobile UI can display/assign these records; test tenant ownership and response behavior on staging. |
| Catalogue/schedule/areas/POS | D/E | Screens use local vendor preview storage; matching mobile CRUD endpoints were not found in the selected Laravel API. Do not claim these operations persist to the server. |
| Password recovery | D/E | Vendor forgot-password screen is local-only; no vendor-specific mobile password-reset JSON route was found. |
| Subscription entitlement | C | Web vendor routes apply `vendor.subscribed`; mobile vendor operations check approved role/ownership but do not apply that middleware. Confirm whether subscription restrictions must also apply to mobile operations before release. |

### Driver workflow

| Step | Status | Source-verified behavior and limitation |
|---|---|---|
| Authentication | B | Shared role login accepts driver phone identity; login and token middleware require an approved driver. Driver account creation is an admin operation, not public signup. |
| Dashboard/availability | B | Dashboard loads `/auth/me`; availability toggle is a mobile API call. Server rejects taking a busy driver offline. |
| Assigned tasks/actions | B | Task list is scoped to the authenticated driver; accept/decline/complete actions require the booking to be assigned to that driver. Driver actions update booking state, but source inspection indicates they do not add booking status-history records. |
| Other driver administration | D/E | Admin driver screens are local previews except the limited mobile task/status API. No additional unobserved API is assumed. |

### Admin workflow

| Step | Status | Source-verified behavior and limitation |
|---|---|---|
| Authentication/access | B | Admin uses the shared role login and must be an active admin. Client route allow-lists only control navigation; server mobile middleware/controller role checks are the data/security boundary. |
| Dashboard/orders/status | B | Mobile dashboard and paginated order list are API-backed. Status PATCH accepts a status and optional remarks; backend prevents changes to delivered/cancelled orders but allows any declared status from other nonterminal states, rather than enforcing a complete transition graph. Verify business rules on staging. |
| Partner approval | A/B | Admin web route is protected by `is.admin`; pending vendors can be approved/rejected. Approval sets `approved_at`; only then can vendor mobile login succeed. Route/UI/test source exists, but this audit could not rerun PHP because sandbox execution was denied. |
| Other management/reporting | D/E | Analytics, bookings management, categories, commissions, coupons, customers, drivers, invoices, notifications, reports, service items and related secondary screens mostly use `LocalFeaturePage`/device-local preview storage. No matching mobile APIs were found for those screens in `routes/api.php`. |

### Mobile API endpoint map

All paths below are relative to `/api/mobile`; Laravel `routes/api.php` supplies the API prefix. `mobile.auth` means Bearer-token authentication plus active account verification; role checks occur in the corresponding controller.

| Method/path | Access | Contract/source behavior |
|---|---|---|
| `GET /services` | Public | Paginated `{data,current_page,last_page}`; active services/items for approved vendors. |
| `POST /auth/login` | Public, throttled | `{role,identity,password}`; driver identity is phone, other roles email; returns `{token,user}` or inactive/invalid status. |
| `POST /auth/register` | Public, throttled | Customer-only name/email/phone/password confirmation; returns 201 `{token,user}`. |
| `POST /auth/vendor-register` | Public, throttled | Vendor application fields; returns 201 `{message,application:{id,status:"pending"}}`, no token. |
| `POST /auth/password/forgot` | Public, throttled | Email; generic `{message}` response. |
| `GET /auth/me`, `PATCH /auth/profile`, `POST /auth/logout` | Authenticated | `/me` returns `{user}`; profile is customer-only name/phone; logout deletes current mobile token. |
| `GET /orders`, `POST /bookings`, `GET /orders/{booking}`, `GET /orders/{booking}/history`, `POST /orders/{booking}/cancel` | Customer | Paged order list; booking response `{data:order}`; details/history/cancel are customer-owned; cancellation only while pending. |
| `GET/POST /addresses`, `PUT/DELETE /addresses/{address}`, `PATCH /addresses/{address}/default` | Customer | Address owner is enforced; reads/writes generally return `{data:...}`, delete returns message. |
| `GET /serviceability`, `GET /vendors/{vendor}/availability` | Customer | Zone city/pincode lookup and bounded date-range slot lookup. |
| `GET /vendor/orders`, `GET /vendor/drivers`, `PATCH /vendor/orders/{booking}/assign-driver` | Vendor | Vendor-owned paginated orders, own approved drivers, assignment validates booking/driver ownership and pickup/delivery role. |
| `GET /driver/tasks`, `POST /driver/orders/{booking}/{role}/{action}`, `POST /driver/status/toggle` | Approved driver | Assigned tasks/actions only; pickup/delivery actions accept/decline/complete; availability endpoint enforces busy state. |
| `GET /admin/dashboard`, `GET /admin/orders`, `PATCH /admin/orders/{booking}/status` | Admin | Dashboard stats, paginated orders, validated status/remarks update. |

Client also has configurable geocoding through `EXPO_PUBLIC_GEOCODING_URL`; this is not a Laravel API endpoint. No payment, OTP, vendor service/schedule/area/POS CRUD, or mobile reporting endpoint was found.

### Auth, persistence, validation, and security findings

- Native token storage uses Expo SecureStore; server stores token hashes, expires tokens after 30 days, checks active account status on authenticated requests, and deletes the current token on logout. The app persists profile/session metadata separately and verifies an existing token with `/auth/me` at cold launch before restoring the backend-returned role.
- Root role route guards are defense-in-depth only. Mobile Laravel operations enforce customer/vendor/driver/admin roles and ownership in source; remote deployment and negative-role responses are unverified.
- Server booking validation derives prices from active server-side catalogue items/variants rather than trusting cart prices. This supports code-level price integrity; no payment integrity can be claimed without provider verification.
- No request idempotency key is present. Checkout now takes a synchronous in-flight lock before asynchronous validation, and address save prevents concurrent taps. Backend source does not establish duplicate suppression, so ambiguous network timeouts followed by user retries can still create duplicate bookings.
- Driver status changes do not append status history; admin status updates can jump between declared nonterminal states. These are workflow/auditability gaps to confirm with product rules.
- Backend mobile vendor operations do not share the web `vendor.subscribed` gate. This is a potential entitlement inconsistency; subscription policy must be decided, not assumed.
- API client attaches Bearer token and JSON headers, rejects network/HTTP/invalid JSON errors, surfaces Laravel validation messages, and clears stored auth on 401. Screen-level loading/error UX is inconsistent: some dashboards retry; checkout uses alerts and has no explicit initial load state; admin error reporting is generic.
- Local profile/cart/address/preview state is not server persistence. Do not infer success from AsyncStorage writes or demo screens.

### Database dependencies

The mobile API requires the Laravel schema/models for admins, customers, vendors, drivers, mobile access tokens, service catalogues/items/variants/categories, area zones and vendor time slots, addresses, bookings/items/status history, commissions, and driver assignment fields. The booking path uses a transaction for booking/address/items/history; commission and bill-job work also depends on the configured database/queue/mail/storage environment. Driver approval and vendor approval/status fields must exist before login/task operations work.

Relevant source files include `database/migrations/*create_*_table.php`, `database/migrations/2026_11_03_000000_create_mobile_access_tokens_table.php`, `app/Models/{Booking,Customer,Vendor,Driver,Address,MobileAccessToken}.php`, and `app/Http/Middleware/AuthenticateMobileToken.php`. A full production migration run was not performed.

### Consolidated feature status

| Feature | Class | Reason |
|---|---:|---|
| Customer auth/session, API wrappers and role guard | A/B | Source contracts match; live host, token lifecycle and cold-launch UX need staging validation. |
| Customer catalogue and service selection | B | Live-request code and backend route exist; live data/variants/error states untested. |
| Cart and price display | C | Local cart and client price snapshot; server computes booking prices by IDs. |
| Customer address CRUD and checkout address | C | Authenticated remote CRUD plus local guest/signup profile data; signup address is not migrated. |
| Availability and booking creation | B | Endpoints and server-side validation exist; actual serviceability/time slots not live-tested. |
| Payment verification/refund and OTP | E | No provider/verification or OTP contract; UI preview only. |
| Orders/detail/history/cancel | B | Matching client/server flows; staging state transitions not exercised. |
| Vendor application and admin approval | A/B | Source contract and approval path present; live mail, staging approval and resulting login unverified. |
| Vendor order/driver assignment | B | Matching API source and client calls; no staging ownership/tenant tests. |
| Vendor catalogue/schedule/areas/POS | D/E | Local preview screens; no mobile API routes. |
| Driver tasks/availability/actions | B | Matching route/controller/client source; transition/history behavior needs live QA. |
| Admin dashboard/order status | B | Matching mobile API source; secondary admin UI mostly local preview. |
| Live API connectivity for any role | F | Previously attempted read-only catalogue request received no HTTP response; this audit has no reachable staging host or test credentials. |

### Prioritized plan and staging test checklist

**P0 — environment and release gate**

1. Provide a reachable non-production staging HTTPS base URL and confirm it is deployed from the selected Laravel route/controller version. Do not change production or EAS configuration as part of this audit.
2. Provide designated disposable customer/vendor/driver/admin accounts through a secure channel; no credentials belong in this report.
3. Confirm migrations, queue/mail/commission/bill configuration and seed data in staging. Run migration status and route list there before end-to-end testing.

**P1 — correctness, permissions and duplicate safety**

1. Add server-backed idempotency or a documented duplicate policy for booking retries; test checkout/address in-flight guards and protect other address mutations from repeated taps as needed.
2. Test every mobile endpoint as the intended role and as at least one wrong role; verify customer address/order ownership and vendor booking/driver ownership.
3. Confirm subscription entitlement for vendor mobile endpoints; align with web middleware if product policy requires it.
4. Confirm booking status transition graph and add status-history entries for driver actions if required.
5. Test server-side catalogue price changes between cart and checkout; verify order totals are DB-derived and no successful/paid state is displayed without provider confirmation.

**P2 — missing product contracts**

1. Specify payment initiation, provider callbacks/webhook verification, COD rules and refunds before exposing payment completion.
2. Specify OTP only if phone authentication is required; complete password-reset token flow for customer/vendor if required.
3. Define vendor CRUD APIs and authorization for catalogue, schedule, service areas, POS, profile and subscriptions before replacing preview storage.
4. Define APIs for secondary admin screens, customer support/favorites/notifications/loyalty/subscriptions only if those screens must be live.
5. Decide how customer signup address becomes a validated remote address and how existing local addresses migrate.

**Staging execution checklist**

- [ ] public services returns expected paginator and fields; search, empty/error, and inactive service cases behave correctly.
- [ ] customer/vendor/driver/admin login, inactive account, wrong role, token expiry, `/me`, logout/revocation, and cold launch.
- [ ] vendor registration creates pending account without token; pending login is denied; admin approve/reject; approved vendor can then log in.
- [ ] address create/list/edit/default/delete, required fields, uniqueness/default behavior and cross-customer access denial.
- [ ] serviceability supported/unsupported locations and pickup slot ranges/timezones.
- [ ] booking validation for stale/invalid item/variant, mixed vendor, quantity bounds, server price, minimum total, address, slot, and rapid retry; verify one booking/order and expected DB rows.
- [ ] payment/COD state remains unpaid until any configured provider verification; do not run payment tests before a real staging provider exists.
- [ ] customer order list/detail/history/pending cancellation and non-pending cancellation rejection.
- [ ] vendor only sees own orders/drivers; assignment validates driver/vendor/booking/role.
- [ ] driver only sees assigned work; accept/decline/pickup/delivery and busy/offline state; verify history.
- [ ] admin dashboard/order status valid transitions and terminal-order restrictions; each wrong-role request is denied.
- [ ] Android/iOS device network permissions, TLS, staging API hostname reachability, and screen loading/error recovery.

### Validation results for this audit

| Check | Result |
|---|---|
| TypeScript `tsc --noEmit` | Passed (exit code 0). |
| Lint | Full active-source `eslint src` passed (exit code 0). Configured `expo lint` could not complete because Expo CLI attempted to write `C:\Users\nirdo\.expo\state.json` and the sandbox returned `EPERM`; no workaround was used. |
| Expo Doctor | `npx.cmd expo-doctor` was attempted; it exited 1 because its `expo config --json --full` subprocess exited 7. The underlying Expo CLI state-file write was sandbox-blocked. The earlier report records a prior 20/20 Doctor run; that is not represented as a successful run in this audit. |
| Laravel tests/Pint | Rerun attempted, but sandbox returned “Access is denied” invoking the PHP executable. An earlier targeted vendor test run in this workspace passed 3 tests / 17 assertions; it does not replace a successful rerun or full migration suite. |
| Live API/staging | Not verified. A previous read-only catalogue probe returned no HTTP response. No authenticated or mutating staging requests were made. |

### Safe implementation outcome

No API-dependent behavior was invented in this audit. The current source already includes vendor application submission and admin approval/rejection. Added a synchronous in-flight ref guard to the existing checkout submit button so repeated taps cannot dispatch overlapping booking requests while the first request is pending. It preserves the current UI, request payload and backend contract. Broader persistence, payment, entitlement and status-policy changes are deferred until staging/product requirements are confirmed.

## Customer-flow implementation follow-up — 2026-11-04

This follow-up supersedes the earlier customer classifications and runtime-check statements where they conflict. It is based on the active app code plus the selected Laravel source. No staging access or credentials became available, so all API behavior remains source-verified rather than live-tested.

### Implemented customer-flow corrections

- Cold launch now validates a stored SecureStore token using the existing `/api/mobile/auth/me` contract before restoring the server-returned role. Expired/invalid sessions are cleared by the existing 401/session handling; network/configuration failures preserve the token and offer retry or a deliberate signed-out path.
- Home and the customer dashboard distinguish empty results from API failures and expose retry/error states. The catalogue response is validated against the Laravel service/variant payload before it reaches the screens.
- Both service-list entry points route variant-bearing services to their live details/options screen rather than silently adding the first variant. The legacy booking screen now renders the catalogue's returned options and uses the selected variant.
- New [`src/lib/cart-storage.ts`](./src/lib/cart-storage.ts) centralizes cart schema validation and live-catalogue additions. Cart/checkout reject stale/demo-shaped records without silently converting them to an empty cart; the cart offers explicit recovery. Client prices remain estimates, and checkout submits only IDs/quantities for server pricing.
- Authenticated address forms now use the Laravel's supported `Home`/`Work`/`Other` labels and supported address fields. Remote-only-incompatible custom labels, phone and pickup instructions are not presented as synchronized fields. Existing remote addresses can be edited as full addresses; setting a default updates the selected address, and deleting the selected address selects the server default/remaining address or clears it.
- Checkout waits for cart/address/payment configuration to load, has explicit retry/error UI, validates actual calendar dates and past dates before submission, and keeps its synchronous duplicate-tap lock. The contact display comes from the signed-in customer profile instead of asking for name/phone that the booking endpoint does not accept. The success state appears only after a valid server booking response and labels the booking with the server status; it does not claim a slot reservation or payment.
- Order filters/cancellation eligibility now use Laravel's raw `status` values rather than status labels. Authenticated profile email is read-only because the profile PATCH contract only supports name and phone; profile API failures display the returned error.
- Session-restore retries now reset loading/error state from the user action rather than synchronously inside the effect, avoiding a React effect lint violation without changing the restore contract.

### Files touched in this follow-up

[`API_INTEGRATION_AUDIT.md`](./API_INTEGRATION_AUDIT.md), [`src/app/_layout.tsx`](./src/app/_layout.tsx), [`src/app/index.tsx`](./src/app/index.tsx), [`src/app/(tabs)/index.tsx`](./src/app/(tabs)/index.tsx), [`src/app/(tabs)/orders.tsx`](./src/app/(tabs)/orders.tsx), [`src/app/(tabs)/profile.tsx`](./src/app/(tabs)/profile.tsx), [`src/app/(tabs)/services.tsx`](./src/app/(tabs)/services.tsx), [`src/app/addresses.tsx`](./src/app/addresses.tsx), [`src/app/booking.tsx`](./src/app/booking.tsx), [`src/app/cart.tsx`](./src/app/cart.tsx), [`src/app/checkout.tsx`](./src/app/checkout.tsx), [`src/app/customer-dashboard.tsx`](./src/app/customer-dashboard.tsx), [`src/app/favorites.tsx`](./src/app/favorites.tsx), [`src/app/service-details.tsx`](./src/app/service-details.tsx), [`src/app/services.tsx`](./src/app/services.tsx), [`src/lib/address-book.ts`](./src/lib/address-book.ts), [`src/lib/auth.ts`](./src/lib/auth.ts), [`src/lib/cart-storage.ts`](./src/lib/cart-storage.ts), [`src/lib/laundry-api.ts`](./src/lib/laundry-api.ts), and [`src/providers/role-access-provider.tsx`](./src/providers/role-access-provider.tsx).

### Customer-flow validation and remaining blockers

| Check | Result |
|---|---|
| `npx.cmd tsc --noEmit` | Passed after the customer-flow changes and again during the latest continuation (exit code 0). |
| `npx.cmd eslint src` | Passed after the latest continuation fixes (exit code 0). |
| `npx.cmd expo lint` | Attempted; Expo CLI exited 7 after `EPERM` writing `C:\Users\nirdo\.expo\state.json...`. This is a sandbox restriction outside the workspace; no retry/workaround was used. |
| `npx.cmd expo-doctor` | Not rerun after the same Expo CLI state-file permission denial. The previous recorded attempt exited 1 when its Expo config subprocess exited 7; no Doctor success is claimed. |
| Automated app tests | No app test runner or test script is configured in `package.json`; no new test framework/dependency was added. |
| Live customer flow | Not verified: the configured API host remains unreachable and no staging account was provided. Login/session restore, address CRUD/default/delete, serviceability/slot data, booking persistence/status/pricing, cancellation, and profile synchronization still require staging execution. |
| Payment | Still unavailable by source contract; no payment was initiated or simulated. |

No production configuration, backend source, deployment, or live data was changed in this follow-up.

## Vendor mobile password recovery follow-up — 2026-11-04

The supplied Laravel controller archive confirmed a vendor web password-reset flow, while the existing mobile forgot-password API called only the customer broker. The API route was already public and throttled; the vendor broker, dedicated token table, vendor reset notification, and vendor reset form route are present in the repository source.

- Extended the existing mobile reset request with an optional, validated `role` (`customer` or `vendor`). Omitting the role still uses the customer broker. Both roles receive the same generic response to avoid confirming whether an email is registered.
- Connected the vendor recovery screen to the existing mobile API route, disabled duplicate submissions while waiting, surfaced request errors, and removed the inaccurate “API not connected” text. The reset email uses Laravel's existing vendor notification and reset form.
- Updated the customer recovery copy to match the existing generic API response.
- Added Laravel feature coverage for vendor broker selection, default customer broker compatibility, and rejection of unsupported roles.

Validation: `npx.cmd tsc --noEmit` and `npx.cmd eslint src` passed. PHP syntax and Laravel feature tests could not be run because PHP is not installed/available in this environment. No live mail delivery or staging reset was tested.

## Additional backend archive review — Ready-Laundry-Admin-Web.zip — 2026-11-04

The supplied [`Ready-Laundry-Admin-Web.zip`](</C:/Users/nirdo/Downloads/Ready-Laundry-Admin-Web.zip>) was inspected in place without extracting or changing the archive. It contains a separate Laravel application with split API route files (`routes/api/admin.php`, `customer.php`, `driver.php`, `seller.php`). Its `RouteServiceProvider` mounts these route files under `/api` (seller routes under `/api/store`). No deployment metadata was found tying this archive to the configured app API host or the existing `luminalaundry.com` source tree.

### Compatibility finding

This archive is **not contract-compatible with the mobile app's current `/api/mobile/...` client as inspected**. Its admin API uses different paths, authentication middleware, response names, and order mutation semantics:

| Capability | Mobile client + selected `luminalaundry.com` source | Ready-Laundry-Admin-Web archive | Result |
|---|---|---|---|
| Admin login | `POST /api/mobile/auth/login` with `{role,identity,password}`; app consumes `{token,user}` and stores the mobile token | `POST /api/admin/login` with email/password; controller returns `access` plus `user` in the archive's JSON envelope | Incompatible path and auth contract |
| Admin auth middleware | Custom mobile token middleware followed by admin role checks | `auth:api` plus `role:admin` | Token guard compatibility not established |
| Dashboard | `GET /api/mobile/admin/dashboard`, response expected as `{data: ...}` with `total_orders`, `pending`, etc. | `GET /api/admin/dashboard`, controller reports `customers`, `services`, `products`, `income`, `todayOrders` | Incompatible path and response schema |
| Admin order list | `GET /api/mobile/admin/orders?page=...`, paginator fields consumed by client | `GET /api/admin/orders`, response key is `orders` wrapping `OrderResource` collection; default filter is paid orders | Incompatible path, schema, and default filtering |
| Order status update | `PATCH /api/mobile/admin/orders/{id}/status` with JSON `{status,remarks?}` | `GET /api/admin/orders/{order}/update-status` and status is read from the request; controller updates status and triggers notification/email side effects | Incompatible method/path/body. GET is being used for a state-changing operation and should be replaced with a non-GET method before clients rely on it. |

The archive's customer API also uses a different, non-role-prefixed route family (`/api/login`, `/api/services`, `/api/orders`, `/api/addresses`, etc.) with `auth:api` and `role:customer`; those are not the mobile paths or request/response types used by the app. It includes a payments API route, but the existence of that route alone does not establish a provider verification, webhook, or refund contract compatible with this app.

### Audit impact and recommendation

- Treat this archive as an **additional candidate backend**, not as evidence of what staging or production currently runs. It is not safe to point the Expo app at it or selectively substitute its endpoints without a migration plan and end-to-end contract tests.
- Preserve the previous source selection (`luminalaundry.com`) only as the best matching local source for the current `/api/mobile/...` client. The actual deployed backend remains unknown until its repository/deployment fingerprint and staging route list are confirmed.
- If this archive is the intended future backend, first define an adapter/migration covering role login/token format, all customer/vendor/driver/admin paths, response envelopes/pagination, booking/order status semantics, and payment verification. Do not mix endpoints across the two Laravel applications based only on similar feature names.
- No archive files were extracted, edited, or executed. This review is static inspection only; archive build/runtime, database migrations, API authorization behavior, and live deployment were not tested.

## Deployment/API connectivity follow-up — 2026-11-04

The configured public API host was checked with unauthenticated, read-only catalogue requests. Both `GET /api/mobile/services` (the mobile client's route family) and `GET /api/services` (the alternate admin-web archive's route family) returned **HTTP 404 with an HTML response**. This confirms neither tested route was served at that origin during this check; it does not identify whether the cause is a missing deployment, routing/proxy configuration, or a different intended API host. No authenticated or mutating request was made.

The Expo EAS preview and production profiles point at this host. Therefore, the configured API origin is **not verified to serve either inspected catalogue contract**, and an EAS deployment using it cannot be claimed API-ready. No production API configuration was changed and no build or deployment was started. Do not switch to the archive's different API contract based on route similarity.

### Validation snapshot

| Check | Result |
|---|---|
| `npx.cmd tsc --noEmit` | Passed (exit code 0). |
| `npx.cmd eslint src` | Passed (exit code 0). |
| `npx.cmd expo lint` | Blocked before linting: Expo CLI could not write `C:\Users\nirdo\.expo\state.json...` (`EPERM`, exit code 7). The path is outside the workspace and sandbox-restricted; no workaround was attempted. |
| `npx.cmd expo-doctor` | Blocked because its Expo config subprocess failed with the same `EPERM` writing the per-user Expo state file. No Doctor success is claimed. |
| Laravel syntax/tests | Not run: PHP is not installed or available in this environment. |
| Live API | Both public catalogue paths returned HTTP 404. No authenticated workflow, database persistence, booking, payment, or role authorization was tested. |

### Blockers before an API-connected release

1. Confirm which Laravel project is authoritative for the target deployment and provide a reachable **non-production staging origin** whose `/api/mobile/...` route list and response contracts can be checked. The current public origin's two tested catalogue paths return 404.
2. Provide disposable role-specific staging accounts through an approved secure channel (do not send passwords, bearer tokens, or `.env` contents in chat).
3. Confirm intended release platforms and build destination. The current Expo configuration has an Android package but no iOS bundle identifier; do not invent a production identifier.
4. Run the required Expo checks in an environment allowed to write its Expo state file, and run Laravel tests where PHP/Composer and the intended backend dependencies are available.

Until these blockers are resolved, the client can be described as source-integrated only for the endpoint contracts documented above; it is not verified end-to-end against the deployed API and must not be described as ready for production API traffic.

## Follow-up: app-visible API failure diagnosis — 2026-11-04

Additional read-only checks confirmed the website root responds with HTTP 200 while the mobile catalogue route responds with HTTP 404 HTML. The catalogue route also returned 404 on `www` and after HTTP-to-HTTPS redirection. Representative auth, address, vendor, driver, and admin routes likewise returned 404 to unauthenticated `OPTIONS` probes. These results point to missing/unpublished mobile routes at the configured deployment, not a single customer-screen request bug. `OPTIONS` probes do not verify authenticated behavior or substitute for staging tests.

The supplied [`ServiceItemController.php`](./lumina%20(2)/lumina/app/Http/Controllers/Admin/ServiceItemController.php) is a web-admin controller: its routes are registered in `routes/web.php`, return Blade views/redirects, and use the admin web workflow. It is not a mobile JSON API and must not be called directly from Expo. The other inspected mobile route source (`lumina (2)/lumina/routes/api.php`) exposes only its narrower mobile auth/shop/order route set; it does not provide the addresses, availability, vendor, driver, or admin APIs used by the app. The fuller `luminalaundry.com/routes/api.php` is still the only inspected source matching the broader current client contract, but its deployed routes are not present at the checked public origin.

### Client error handling change

Updated [`src/lib/mobile-api.ts`](./src/lib/mobile-api.ts) so non-JSON HTTP failures retain their HTTP status and an actionable 404 message instead of being reported only as an invalid response. A 401 now clears the stored token and session even when the response body is HTML/non-JSON. This improves diagnosis/session cleanup but does **not** make unavailable server routes available.

Required deployment-side action: publish the matching Laravel mobile API source and ensure the web server forwards `/api/mobile/*` to Laravel. Then verify `GET /api/mobile/services?page=1` returns the documented JSON pagination envelope on staging before testing any authenticated role workflows. No production config or server was changed from this workspace.

Latest validation after the client change: `npx.cmd tsc --noEmit` and `npx.cmd eslint src` passed. `npx.cmd expo lint` again exited 7 and `npx.cmd expo-doctor` exited 1 because Expo CLI could not write `C:\Users\nirdo\.expo\state.json...` (`EPERM`, outside the workspace); no workaround was attempted. PHP remains unavailable, so Laravel tests were not run.
