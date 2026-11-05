# Lumina Laundry project status

Updated: 2026-10-29  
Project: `C:\Users\nirdo\Projects\LuminaLaundryApp`

## This audit batch

- Restored the missing active `/services` customer route as a new screen after confirming only `services.tsx.backup` existed. The screen uses the actual Laravel `GET /api/mobile/services` pagination contract inspected in `lumina (2)/lumina/routes/api.php` and `MobileShopController`, with catalogue loading/error/empty states, local search/category filters/favourites, service detail navigation and local bag actions. Booking/order mutations remain outside this screen; Laravel's inspected booking/orders routes are behind `mobile.auth` and customer role checks.
- Reviewed the required tracker, status, file inventory, Expo/package configuration, active route tree, layouts, customer screens, theme, reusable management UI, and auth/API helpers. See [AUDIT_REPORT.md](AUDIT_REPORT.md) for route inventory, scope classification, evidence and backlog.
- Added `src/app/search.tsx`: a themed global service search with a 300 ms debounce, configured catalogue lookup, loading/error/empty states, retry and links to existing service details.
- Added a search control to the existing Home header. It preserves the existing colors, typography and button treatment.
- Replaced duplicate/stale feature checklist entries in `MASTER_FEATURE_TRACKER.md` with unique feature-group statuses and evidence. No item is marked `VERIFIED` solely because code exists.
- Created a pre-edit timestamped backup of each modified existing file in `.codex-backup-20261029-112719/`. No environment files, dependencies, generated native projects or existing unrelated edits were changed intentionally.

## Customer flow completion batch (2026-10-29)

- Added language choice to onboarding (English, Hindi, Tamil, Telugu) and save-to-device preference. App screens remain English; this is a preference only, not full localization.
- Replaced the generic `/stores` placeholder with catalogue-derived shop grouping; added `/store-details` for catalogue services and clearly unavailable metadata.
- Added a Home entry point to the catalogue-derived shop directory.
- Added `/order-details` and linked it from checkout's local booking confirmation and the Orders list. Includes stored details, an explicitly static timeline, local demo cancellation and a local-only reschedule preference request.
- Replaced generic `/support` placeholder with a validated complaint form that saves locally and states that it is not delivered to support.
- Existing profile appearance controls already cover theme, accent, text size and reduced motion; existing profile editing/address and support links remain available.
- Backed up each modified existing source/document file before edits in `.codex-backup-20261029-114116/`.
- API, payment, pickup, support-ticket delivery, live timeline, hours and rescheduling remain backend-dependent and unverified. No successful real booking/payment/OTP/refund is claimed.

## Verification

| Check | Result | Scope |
|---|---|---|
| `npx.cmd expo lint` | Passed, 0 errors, 15 warnings | Warnings are pre-existing BOM and unused-variable notices in other screens. |
| `npx.cmd tsc --noEmit` | Passed | No TypeScript diagnostics. |
| `npx.cmd expo export --platform android --no-bytecode` | Passed | Android JavaScript bundle exported to `dist`; this is not an APK, install or device test. |

Expo SDK version is 58.0.21 (React Native 0.88.0). SDK 58 reference docs were checked before implementing the Expo Router screen. The export emitted a warning that bytecode was disabled as requested by the project verification command.

## Existing repository state and limits

- The repository had extensive uncommitted changes and pre-existing additions/deletions before this batch. They were preserved; no reset, broad cleanup or unrelated route rewrite was performed.
- `src/lib/mobile-api.ts`, auth, catalogue, booking, order and payment code exists, but staging API responses and server-side permissions were not tested. No backend-connected feature is claimed from source presence alone.
- `verify-otp.tsx` is a development-only preview that accepts any six digits; it does not verify identity. Admin/vendor/driver pages are mostly local device previews and do not establish live privileged operations.
- No test suite, signed build, production API, real payment, OTP delivery, push notification, GPS tracking, booking, refund or device behavior was exercised.

## Remaining work

Validate auth/role enforcement and endpoint contracts on staging, implement full localization and provider-backed booking/order aftercare, then convert role management previews only after API contracts exist. Complete Android/iOS manual device and accessibility checks before release. Full backlog and feature statuses are in `MASTER_FEATURE_TRACKER.md` and `AUDIT_REPORT.md`.

## Laravel mobile integration batch (2026-10-29)

- Replaced customer login and registration mock session writes with `POST /api/mobile/auth/login` and `/register`, matching the Laravel payloads. Registration sends `password_confirmation`; the address remains device-local because Laravel registration does not accept an address. The returned bearer token is stored with Expo SecureStore.
- Added startup session restoration through authenticated `GET /api/mobile/auth/me`; refreshed account details are saved locally, while invalid sessions are cleared. Profile sign-out calls `POST /api/mobile/auth/logout` and clears local credentials even if the request fails.
- Connected checkout to authenticated `POST /api/mobile/bookings`. It only sends live catalogue items, requires one vendor per booking and an authenticated token, collects backend-required address/pickup/delivery dates, and sends a selected slot only when available, and only displays confirmation after receiving the server response; requested pickup/delivery dates are collected, and time slots are nullable as the backend allows. The API enforces the ₹200 minimum, active service/variant rules and same-vendor constraint; server prices determine the confirmed amount. Payment remains unavailable and no payment is initiated.
- Connected the Orders tab to authenticated `GET /api/mobile/orders`, iterating the backend's `current_page`/`last_page` paginator. The existing API returns no service item/variant IDs, so reorder cannot be implemented safely. The customer API also has no cancellation, order detail, OTP delivery/verification, or payment route; those actions remain explicitly unavailable.
- Replaced the OTP preview action with an unavailable message because `routes/api.php` defines no OTP endpoint. No OTP or payment is claimed as completed.
- Source contract evidence is in `lumina (2)/lumina/routes/api.php`, `MobileAuthController.php`, `AuthenticateMobileToken.php`, and `MobileShopController.php`. No live API request was made; behavior still needs a configured staging host and test customer.

### Checks

| Check | Result |
|---|---|
| `npx.cmd tsc --noEmit` | Passed after adapting existing order-list callers to the paginated API helper. |
| `npx.cmd expo lint` | Passed with 0 errors and 8 warnings (existing BOM and unused-import warnings in unrelated screens). |
| `npx.cmd expo export --platform android --no-bytecode` | Passed; Android JavaScript bundle exported to `dist`. This is not an APK or device test. |

No tests, live staging calls, booking submissions, OTP delivery, payment transactions, production writes, or migrations were run. Existing unrelated workspace changes and backups were preserved.
