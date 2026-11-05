# Lumina Laundry feature tracker

Audit date: 2026-10-29. Statuses describe source evidence and checks completed in this repository. `VERIFIED` is reserved for behavior exercised with evidence; code presence alone does not qualify. No production, backend, payment, OTP, GPS, or device behavior was presumed.

| Feature group | Status | Evidence and blockers |
|---|---|---|
| Splash and launch | INCOMPLETE | Expo splash configuration exists in `app.json`; launch behavior has not been tested on a device. |
| Onboarding and language selection | INCOMPLETE | `/welcome` now offers English, Hindi, Tamil and Telugu choices and saves the preference locally. Screen translations/localization are not implemented; selection and first-run behavior are not device-tested. |
| Home and customer navigation | INCOMPLETE | Themed Home and four tabs exist. Home links to service search, catalogue shops, latest orders, addresses and support; banners, nearby recommendations, reviews, repeat order and seasonal content remain absent or incomplete. |
| Global search | INCOMPLETE | New `/search` route searches the configured service catalogue, with debounce, loading/error/empty states and detail navigation. No independent global search exists for stores/orders; API availability is unverified. |
| Notifications and deep links | INCOMPLETE | Notifications route exists. Push delivery and notification-to-order deep links are not verified. |
| Service discovery and detail | INCOMPLETE | `/services` now loads the Laravel mobile service catalogue, supports local search/category filters and favourites, and links to existing variant-aware details. `/stores` groups catalogue services by vendor and links to `/store-details`; hours, distance, map, ratings and live availability remain unavailable/unverified. |
| Cart and booking | API WIRED; LIVE VERIFICATION PENDING | Checkout submits authenticated live catalogue items to Laravel booking and only confirms after HTTP success. Cart remains local; server enforces same-vendor, valid dates/items and ₹200 minimum. Slot availability remains unavailable; cancellation, rescheduling and payment are unsupported. |
| Orders and aftercare | API WIRED; LIVE VERIFICATION PENDING | `/orders` loads all pages from authenticated Laravel orders API. The API has no order detail, cancellation or reorder IDs; live tracking and aftercare remain unavailable. |
| Registration, login and account | API WIRED; LIVE VERIFICATION PENDING | Customer login/register call actual contracts, token persists in SecureStore, `/me` restores session and logout calls backend. No OTP route exists; OTP is labeled unavailable. Profile/preferences/deletion remain partial. |
| Payments and refunds | BACKEND_BLOCKED | Payment helper/UI exists, but no provider transaction or server verification was exercised. Refund execution/status is not established. Never infer a successful payment from local UI. |
| Help and support | INCOMPLETE | `/support` validates and saves complaint requests to device storage with confirmation that no ticket was delivered. Backend ticket delivery and provider contact actions are unverified. |
| Admin | BACKEND_BLOCKED | Dashboard and management routes exist. Admin dashboard reads/writes device storage; `LocalFeaturePage` CRUD is explicitly a local preview. No live role-protected operational API was verified. |
| Vendor | BACKEND_BLOCKED | Vendor login, registration, schedule, service, booking and dashboard routes exist. Several pages are local preview records; approval, documents, order actions and settlements are not live-verified. |
| Delivery partner | BACKEND_BLOCKED | Driver login, tasks and dashboard routes exist. Assignments, GPS, contact, proof, OTP, earnings and task status are not backed by verified APIs. |
| Loyalty, membership and referrals | INCOMPLETE | Loyalty and subscription screens exist. Points, eligibility, referrals and recurring pickup execution are unavailable without verified account/order services. |
| Tracking, reminders and advanced service | BACKEND_BLOCKED | No live ETA/GPS, push reminder, QR, claim, voucher, corporate workflow or multi-city service was verified. |
| Theme and accessibility | INCOMPLETE | Theme provider supports light/dark, accent, font scale and reduced motion. Contrast, screen reader and device accessibility checks remain. |
| API, privacy and release readiness | BACKEND_BLOCKED | API helpers and secure token storage exist; endpoint contracts, server authorization, privacy/deletion, logging, rate limits, automated tests and device builds remain unverified. |
| Automated checks | INCOMPLETE | Run status for this audit batch is recorded in `PROJECT_STATUS.md`; no test suite/device test was added or inferred. |

## Batch changes

- Added the missing active `/services` route (the project previously only had `services.tsx.backup`, so existing Home navigation led to a missing route). It consumes the inspected `GET /api/mobile/services` paginated contract, provides loading/error/empty states, local search/category filters and favourites, links to the existing service detail screen, and adds items to the local bag. Booking remains gated by the existing authenticated backend flow; the screen does not claim a booking or payment occurred.
- Added the `/search` customer route and a Home header entry. Search uses the configured catalogue endpoint, debounces requests, presents loading/error/empty states and opens the existing service detail route. It does not save a booking or claim that the catalogue API is live.
- Existing role dashboards and management screens were left intact. They must remain clearly distinguished from backend operations until server authorization and API responses are verified.
- Added a local language preference selector to onboarding; language selection is saved but app content remains English.
- Replaced the generic customer-facing stores placeholder with catalogue-derived vendor grouping and added `/store-details`; no hours, distance or availability are inferred.
- Added `/order-details` and routed checkout confirmation/orders into it. It presents stored local booking details, a static explicitly labeled timeline, local-only cancellation and a locally saved reschedule preference.
- Replaced the generic support placeholder with a validated complaint form. Submission saves locally and explicitly reports that support has not received it.
- Backed up all modified existing files before editing in `.codex-backup-20261029-114116/`.

## Next work

Prioritize staging validation of auth, catalogue, booking, payment verification and order endpoints; then complete customer order detail/aftercare and address/scheduling flows. Admin, vendor and delivery operations require server-side role checks before exposing mutations. See `AUDIT_REPORT.md` for the route inventory and evidence.
