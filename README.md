# LuminaLaundry mobile app

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the Expo development server

   ```bash
   npm start
   ```

The configured start script serves the app over LAN on port 8082 and requests
Expo Go. Routes use Expo Router and are located in `src/app/`. Do not run
`npm run reset-project` on this project: it is the create-expo-app starter
reset script and is not a project cleanup command.

### Other setup steps

- Typecheck with `npx.cmd tsc --noEmit` and lint with `npx.cmd expo lint` in
  Windows PowerShell.
- Expo Doctor can be run with `npx.cmd expo-doctor`; a sandbox restriction may
  prevent Expo CLI from writing its per-user state file.
- See the [Expo Router documentation](https://docs.expo.dev/router/introduction)
  for routing concepts. Check this project's Expo SDK version and matching
  versioned documentation before changing Expo APIs or dependencies.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Project map and integration status

This repository contains the Expo mobile app plus multiple separate Laravel
source trees and historical backups. Start with
[`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) for the directory map and
safe organization guidance, and
[`API_INTEGRATION_AUDIT.md`](./API_INTEGRATION_AUDIT.md) for the detailed
source-level API/role audit.

The mobile app uses Expo Router routes in `src/app/`, shared API and domain
helpers in `src/lib/`, and theme/role providers in `src/providers/`. The
customer, vendor, driver, and admin experiences have a mix of API-backed
source implementations and local preview screens. A visible screen does not
by itself mean its data is persisted by Laravel.

The app's API client uses `EXPO_PUBLIC_API_URL` when configured. The local
Laravel source that most closely matches its `/api/mobile/...` calls is
`luminalaundry.com/`, but its deployment at any configured server has not been
confirmed. Other Laravel source trees and the supplied admin-web archive use
different routes and response/authentication contracts. Do not switch API
hosts or combine endpoints until the intended backend is confirmed and tested
against staging. Do not place API secrets in the mobile bundle.

## Appearance and address setup

The default app appearance uses the forest-green, cream, mint, and gold brand
palette. Appearance preferences (system/light/dark mode, accent, text size, and
reduced motion) are saved on-device and can be changed from Profile → Appearance.
The map/address book also supports manual address entry when location or map
services are unavailable. Location permission is requested only after the user
chooses the current-location action and sees its purpose.

Native map and geocoding setup is optional:

- Android maps require a restricted Google Maps Android API key. Provide it to
  the Expo config as `GOOGLE_MAPS_ANDROID_API_KEY`; do not commit it to source
  control. For EAS builds, set it as a build environment variable. A development
  build is required to use native maps.
- iOS uses Apple Maps. The native map view is not available in Expo Go.
- Address search requires an application-owned geocoding endpoint configured
  with `EXPO_PUBLIC_GEOCODING_URL`. It receives a `q` query parameter and must
  return an array, or `{ "results": [...] }`, of objects with numeric
  `latitude`, numeric `longitude`, and a human-readable `label`. Do not put
  geocoding-provider secrets in the mobile app.

No map key or geocoding endpoint is configured by default. A selected map pin
does not validate an address or prove service coverage.

## Pickup availability and payments

The app has remote serviceability and vendor pickup-slot helpers that match the
selected local Laravel source; live availability and slot reservation are not
verified. A slot lookup does not reserve a slot. The `PaymentProvider`
interface supports provider-reported methods, but no provider is configured
and no payment is collected or verified by the current flow.

Rescheduling eligibility is unavailable unless an explicit provider is
configured. The app must not infer eligibility or cutoff times from local
orders or demo data.

## API environment

Only configure the app against a confirmed non-production staging origin
whose routes and response schemas match the mobile client. Set
`EXPO_PUBLIC_API_URL` to the origin without a trailing slash or `/api` suffix:

```dotenv
EXPO_PUBLIC_API_URL=https://staging.example.com
```

Do not use `localhost` on a physical phone. Keep API secrets out of the mobile
app and use a publicly reachable HTTPS origin for any eventual release build.
Live end-to-end behavior remains unverified until staging and test accounts are
available. See the audit before changing an API host.

## Prepare a store build

EAS build profiles are in `eas.json`. Before creating store builds:

1. Confirm the intended deployed API. The current EAS profiles set an API
   origin that has not been verified to match the mobile `/api/mobile/...`
   contract; do not build for release until this is resolved.
2. Set unique Android `android.package` and iOS `ios.bundleIdentifier` values
   in `app.json`.
3. Sign in to an Expo account and link this app to an EAS project with
   `npx eas-cli@latest login` and `npx eas-cli@latest init`.
4. Build with `npx eas-cli@latest build --platform all --profile production`.
5. To publish, provide Google Play Console and Apple App Store Connect access,
   complete their store listings, and submit with EAS Submit.
