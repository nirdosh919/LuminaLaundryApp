Continue work in the existing Lumina Laundry Expo Router project.

First inspect git status, route tree, app.config.js, package.json,
the existing Home and Services UI, shared components and current feature tracker.
Do not reset git, discard changes, restore backups over current files,
delete existing routes, or replace the app with a starter template.

PRESERVE THE EXISTING UI THEME:
Use current Home and Services screens as the visual source of truth.
Reuse current colors, typography, spacing, buttons, cards, headers,
icons, assets, borders, shadows and bottom navigation.
Every new page must match the existing design. Do not introduce a new theme.

Implement and verify the largest coherent batch of missing features:
1. Customer home, discovery, services and service details.
2. Booking, cart, address, pickup/delivery scheduling and checkout UI.
3. Orders, status timeline, profile, authentication and support.
4. Admin dashboard and management modules.
5. Vendor dashboard, services and order workflow.
6. Delivery dashboard, assignments and pickup/delivery workflow.
7. Advanced feature screens: loyalty, referrals, subscriptions,
complaints, invoices, notifications, preferences and accessibility.

Audit before coding. Reuse existing routes and components.
Make local interactions work where possible, including navigation,
filters, quantity controls and form validation.
Provide loading, empty, error and success states.
Clearly label demo-only functionality. Never fake real payment success,
server-side bookings, OTP verification, refunds or live GPS tracking.
Do not invent API endpoints or modify the Laravel backend, production website,
production database, credentials or environment secrets.

Update MASTER_FEATURE_TRACKER.md and PROJECT_STATUS.md truthfully.
Run lint, TypeScript and Android bundle export after changes.
Fix issues introduced by this work and report existing issues separately.
Do not claim APK/device/backend testing unless actually performed.
If the whole scope is too large, finish a coherent working batch,
report what remains, and do not leave broken imports or routes.
