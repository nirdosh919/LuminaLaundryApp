# Lumina Laundry Functional Audit

Audit date: 2026-10-29
Scope: React Native/Expo app source and the Laravel source present under `lumina (2)/lumina`. No live API requests, device flows, production writes, migrations, or database operations were performed. Local `.env` values were not read or recorded.

## Findings and flow status

| Flow | Status | Findings |
|---|---|---|
| Login, registration, OTP and session | API wired; OTP backend unavailable | Customer login/register use the verified API request/response shape, tokens use SecureStore, startup restores through `/me`, and logout calls the server before clearing local state. OTP has no server endpoint and the app blocks the preview action. Live authentication was not attempted. |
| Services catalogue | fixed; live integration unverified | Laravel `/api/mobile/services` returns a paginator with `data`, `current_page`, and `last_page`. `fetchServices()` previously read only the first page. It now follows all advertised pages and rejects malformed page responses. Service IDs, vendor IDs, variant IDs and selling prices originate in `MobileShopController::servicePayload`; the client uses `vendor_id` and variant IDs when adding catalogue items to cart. No live API response was checked. |
| Shops and shop details | blocked / partially available | No dedicated mobile shop-directory API route is present. `stores.tsx` and `store-details.tsx` derive the directory from the services catalogue, so shops without listed services cannot appear. Verified shop address, hours, distance, rating and coverage are not supplied by the mobile catalogue contract. `shops.tsx` is a placeholder management screen, not the customer directory. The regular Laravel website has separate `/stores` and `/services` routes, but those are web views, not mobile JSON contracts. |
| Cart and totals | partially verified; local cart behavior | Cart quantity updates are capped at 50 and duplicate service/variant entries merge in the catalogue add handlers. Totals are client-side `price * quantity` estimates. The cart persists locally and carries IDs and price snapshots; server-side booking independently recalculates prices from active service/variant records. No automated test runner or tests are configured in this project. |
| Checkout and payment | booking API wired; payments backend blocked | Checkout posts live catalogue items to the customer-authenticated booking endpoint, applies same-vendor and selected-date checks, and shows confirmation only after server success. Laravel recalculates price and enforces the ₹200 minimum. No payment endpoint/provider exists, so payment is unavailable. |
| Booking submission and order retrieval | API wired; live verification pending | Checkout calls `POST /api/mobile/bookings` using customer auth, live service/variant IDs, backend address/date fields and nullable slots. Laravel enforces active item/vendor rules, one vendor, valid dates and a ₹200 minimum; confirmation is shown only after an HTTP success response. Orders calls authenticated `GET /api/mobile/orders` and follows `current_page`/`last_page`. No booking or payment was submitted. |

## Confirmed mobile API contracts

- `GET /api/mobile/services?search=...&page=...`: public; Laravel paginator response includes `data`, `current_page`, and `last_page`. Each service includes `id`, `name`, `description`, `price`, `category`, `vendor_id`, `vendor_name`, and `variants[{id,name,price}]`.
- `POST /api/mobile/auth/login`: `{role, identity, password}`; returns `{token,user}`. Driver identity is phone; other account roles use email.
- `POST /api/mobile/auth/register`: `{name,email,phone,password,password_confirmation}`; returns `{token,user}` (201). The app's `address` is stored locally and is not accepted by this controller.
- `GET /api/mobile/auth/me`: bearer-authenticated; returns `{user}`. `POST /api/mobile/auth/logout`: bearer-authenticated; deletes the current mobile token.
- `POST /api/mobile/bookings`: bearer-authenticated customer role; request item fields are `{service_item_id,variant_id,quantity}` plus address and pickup/delivery fields. The server recalculates amount and returns `{data: bookingPayload}` (201).
- `GET /api/mobile/orders`: bearer-authenticated customer role; returns `{data:[bookingPayload],current_page,last_page}`. `fetchOrders()` currently reads only `data` (first page).
- No mobile OTP route, payment route/provider, dedicated shop JSON route, or id-based order-details route was found in the available Laravel API routes.

## Files inspected

- App services: `src/lib/mobile-api.ts`, `src/lib/laundry-api.ts`, `src/lib/auth.ts`, `src/lib/payments.ts`, `src/lib/token-storage.ts`, `src/lib/demo-store.ts`, `src/lib/address-book.ts`, `src/lib/pickup-availability.ts`.
- App screens: `src/app/login.tsx`, `register.tsx`, `phone-login.tsx`, `verify-otp.tsx`, `services.tsx` (not present; the route is implemented at `src/app/(tabs)/services.tsx`), `(tabs)/services.tsx`, `shops.tsx`, `stores.tsx`, `store-details.tsx`, `service-details.tsx`, `cart.tsx`, `checkout.tsx`, `booking.tsx`, `(tabs)/orders.tsx`, and `order-details.tsx`.
- Backend: `lumina (2)/lumina/routes/api.php`, `routes/web.php`, `app/Http/Controllers/Api/MobileAuthController.php`, `MobileShopController.php`, `app/Http/Middleware/AuthenticateMobileToken.php`, `app/Http/Controllers/Customer/CustomerOrderController.php`, `app/Http/Controllers/Vendor/VendorBookingController.php`, `app/Http/Controllers/Shop/ServiceBrowseController.php`, and `StoreDirectoryController.php`.
- Project setup: `package.json` and root `AGENTS.md` instructions supplied in the task.

## Files changed and backups

- `src/lib/laundry-api.ts`: follow every catalogue page and validate page metadata/response shape.
- `src/app/checkout.tsx`: prevent live catalogue cart items from entering local demo booking and producing an incorrect demo confirmation.
- Before each edit, a unique timestamped copy was created beside the source file. Existing backups were not overwritten.

## Checks and actual results

- `npx tsc --noEmit`: **passed** (exit 0; invoked as `npx.cmd tsc --noEmit` because PowerShell blocks `npx.ps1`).
- `npx expo lint`: **passed with warnings** (exit 0; invoked as `npx.cmd expo lint`): 0 errors and 15 existing warnings, primarily BOM warnings and unused imports/variables in unrelated screens.
- `npx expo-doctor`: **blocked** (invoked as `npx.cmd expo-doctor`); npm registry fetch failed with `EACCES`, so the doctor package could not be fetched or run.
- Tests: no test files or test runner/script are configured; no tests were available to run.
- Expo SDK version read from `package.json`: 58. Expo SDK 58 versioned docs and the Expo `llms.txt` index were consulted before review.

## Remaining manual and backend steps

1. Provide a reachable staging API base URL and a non-production customer account, then verify login, token persistence across app restart, `/me`, logout, and protected-request behavior on an installed device.
2. Connect an SMS/OTP provider and define its actual server endpoints, payloads, expiry and resend behavior before replacing the preview OTP flow.
3. Add a mobile JSON shops contract (including desired verified shop details) if the app needs a full shop directory independent of listed services.
4. Wire checkout to `createBooking()` only after the UX collects a real saved-address label, pickup/delivery dates, and a valid date/slot selection; use server-returned booking data for confirmation. Handle HTTP 201 and validation/auth/network errors explicitly.
5. Add order pagination and a server-backed order detail path if full order history/details are required; the current mobile API exposes only a paginated list route.
6. Configure a real payment provider and server payment contract before presenting payment methods.
7. Retry `npx expo-doctor` in an environment with npm registry access, then perform staging/device checks. No live API, OTP, payment, device, or production verification was performed in this audit.
