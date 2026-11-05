# LuminaLaundry project map

Inventory date: 2026-11-04. This is a source and workspace inventory, not a
claim that every screen is connected to a deployed backend. For API contracts,
feature classifications, known gaps, and staging checks, see
[`API_INTEGRATION_AUDIT.md`](./API_INTEGRATION_AUDIT.md).

## What is in this workspace

| Path | Purpose | Handling |
|---|---|---|
| `src/` | Active Expo/React Native application source. | Primary app source. Route files are under `src/app/`; shared UI and domain code are in sibling folders. |
| `assets/` | App icons, fonts, and images. | Source assets; avoid moving without checking app config and imports. |
| `luminalaundry.com/` | A nested Git repository containing the fuller Laravel mobile API source that most closely matches current `/api/mobile/...` calls. | Treat as a separate backend repository. Deployment identity is unconfirmed. |
| `lumina (2)/lumina/` | Another nested Git repository with an older/narrower Laravel source copy. | Keep distinct until backend owners confirm whether it is maintained or superseded. |
| `dist/` | Existing generated web/build output. | Do not edit by hand; regenerate only through the documented build process. |
| `node_modules/` | Installed JavaScript dependencies. | Generated dependency directory; do not hand-edit. |
| `.expo/`, `.playwright-mcp/`, `local-server-logs/` | Local Expo, browser-test, and server diagnostic state. | Local/generated diagnostics; inspect only when troubleshooting and avoid publishing logs. |
| `_project_audit/`, root audit/report files, `*_routes.txt`, `*_files.txt` | Prior audits, inventories, route dumps, and implementation notes. | Historical evidence may be stale. Use this map for structure and the current `API_INTEGRATION_AUDIT.md` for contract/status; do not infer runtime behavior from older reports. |
| Timestamped `*-backup*`, `*.bak`, `*.backup`, `predeploy-*`, `.bom-backups/`, `_route_backups/` | Snapshots made during earlier iterations. Some are inside or adjacent to active source. | Preserve until compared with current source, Git history, imports, and route discovery. No cleanup was performed in this audit. |
| `*.zip` source archives | Exported app/backend snapshots and controller bundles. | Treat as separate snapshots, not active source. Inspect entries before extraction; do not merge code based on filenames alone. |
| Root config/manifests | `package.json`, lockfile, `app.json`, `app.config.js`, `eas.json`, `tsconfig.json`, ESLint config, and `.gitignore`. | Source of truth for Expo and tooling configuration; review before changing. |

### Inventory snapshot

The following counts exclude `.git`, `node_modules`, Laravel `vendor`,
`.expo`, and `.playwright-mcp` directories. They are a point-in-time workspace
measurement, not an authoritative Git file list:

| Area | Files | Notes |
|---|---:|---|
| `src/` | 154 | Includes active source and backup files found beneath the tree. |
| `src/app/` | 68 route modules | 63 at the route root plus 5 under `(tabs)`. |
| `src/components/` | 20 | Includes shared UI, route tab components, map platform variants, and local feature pages. |
| `src/lib/` | 12 | API clients, auth/session, local cart/address, demo store, payments, availability, and route access. |
| `src/hooks/` | 4 | Theme/color-scheme hooks. |
| `src/providers/` | 2 | Theme and role/session contexts. |
| `luminalaundry.com/` | 1,074 | Laravel source/assets and repository files, excluding the Laravel `vendor` tree. |
| `lumina (2)/lumina/` | 307 | Older/narrower Laravel copy, excluding its `vendor` tree. |
| `_project_audit/` | 237 | Prior audit material. |
| `dist/` | 144 | Generated output. |

At the initial inventory snapshot, the root repository reported 18
tracked-file changes, one tracked deletion, and 902 untracked paths. The two
nested Laravel repositories
also report extensive worktree changes (76 tracked changes and 800 untracked
paths for `luminalaundry.com`; 66 and 56 respectively for
`lumina (2)/lumina`). These are point-in-time counts, not a clean-baseline
comparison; the root counts include the documentation/config edits made during
this task alongside prior workspace changes. Review each repository's status
and diffs separately before staging or cleanup. Nothing was staged or
committed.

## Mobile app architecture

The app uses Expo SDK 58, React Native, TypeScript, and Expo Router. File-based
routes live directly in `src/app/`; there is one `(tabs)` route group for
Home, Services, Orders, and Profile.

| Layer | Responsibility |
|---|---|
| `src/app/_layout.tsx` | Root Stack, theme/session providers, and role-aware route gating. |
| `src/app/` | Customer, vendor, driver, admin, authentication, and informational screens. A route file is not proof of backend persistence. |
| `src/components/` | Shared themed/premium UI, platform-specific maps/tabs, and reusable local-preview screens. |
| `src/hooks/` | Theme and color-scheme hooks. |
| `src/lib/mobile-api.ts` | Shared HTTP request, token header, JSON/error parsing, and 401 cleanup. |
| `src/lib/laundry-api.ts` | Typed mobile API functions across customer and role operations. |
| `src/lib/auth.ts`, `token-storage*.ts`, `route-access.ts` | Authentication/session, token storage, and client-side route allow-lists. Server authorization remains the actual security boundary. |
| `src/lib/address-book.ts`, `cart-storage.ts` | Address and cart persistence; authenticated address operations use remote APIs, while some guest/local state remains on-device. |
| `src/lib/demo-store.ts`, `payments.ts`, `pickup-availability.ts` | Local demo state and provider abstractions. Provider-backed payment is not configured; availability calls still require live environment verification. |
| `src/providers/` | Theme and role/session state. |
| `src/constants/theme.ts` | Shared palette and appearance tokens. |

Use the existing `@/` import alias. Preserve `.web.tsx` and `.native.tsx`
platform variants; they are not presumed duplicates.

### Feature implementation boundary

- Customer login/session, catalogue, booking, orders, address CRUD, and
  selected availability operations have matching client and local Laravel
  source contracts. They remain unverified against a reachable staging
  service.
- Cart/profile/address draft data and the explicit `LocalFeaturePage` and
  `VendorFeaturePage` screens use local persistence or preview behavior.
- Many secondary admin/vendor/driver management, reporting, and support pages
  are local previews. Do not describe them as live CRUD.
- Payment initiation/verification/refunds and OTP are not established by the
  selected mobile API contract.
- Vendor password-reset request now selects the customer/vendor broker in the
  local mobile API source, but actual email delivery and reset completion have
  not been tested.

See the feature tables and staging checklist in
[`API_INTEGRATION_AUDIT.md`](./API_INTEGRATION_AUDIT.md) before claiming a
feature works end to end.

Several other root-level reports and trackers (including `AUDIT_REPORT.md`,
`FUNCTIONAL_AUDIT_REPORT.md`, `PROJECT_STATUS.md`,
`MASTER_FEATURE_TRACKER.md`, and `PROJECT_FILE_INVENTORY.txt`) carry earlier
dated snapshots. Some describe older routes, API availability, or behavior
that later changed. They are retained as history; verify claims against active
source and the latest dated sections of the API audit.

## Backend source boundaries

This audit compared **three different Laravel/backend candidates**:

1. `luminalaundry.com/` is the strongest local match for the app's current
   `/api/mobile/...` requests.
2. `lumina (2)/lumina/` is a separate, narrower/older API source copy.
3. `C:\Users\nirdo\Downloads\Ready-Laundry-Admin-Web.zip` is an unextracted
   Laravel admin/customer/driver/seller API archive outside the Git workspace.
   Its route families, auth/token contract, response shapes, and admin
   status-update operation differ from the mobile app's current contract.

The workspace also contains `Lumina-Day2-Source.zip` and a nested
`luminalaundry.com/app/Http/Controllers.zip`; these are snapshots, not active
source trees. None of these candidates is proven to be what the configured
staging or production host runs. Do not mix endpoints or point the app at a
candidate backend without a confirmed deployment and contract test plan.

## Safe organization rules and next steps

No file was moved, renamed, or deleted while preparing this map. The root
`.gitignore` was inspected and updated to ignore `.env` and `.env.*` files
while allowing `.env.example` templates. No environment-file contents were
read or copied. Verify template files contain placeholders only before
committing them.

Recommended non-destructive cleanup sequence:

1. Review `git status` separately in the root app and both nested Laravel
   repositories. Preserve unrelated work and do not stage the entire tree.
2. Confirm which Laravel project is deployed and which source copy is
   maintained; retain the others as separate repositories until owners decide.
3. Establish canonical documentation: this project map for structure and
   `API_INTEGRATION_AUDIT.md` for backend/feature status. Mark older reports
   historical rather than deleting them.
4. For backups, first compare content hashes against active files and inspect
   references/Expo route discovery. If cleanup is approved, move candidates
   into a clearly named archive outside `src/` before considering deletion;
   preserve a rollback path.
5. Keep generated output/dependencies (`dist/`, `node_modules/`, `.expo/`)
   separate from source. Change ignore rules only after checking what is
   currently tracked.
6. Re-run TypeScript/lint/Expo Doctor and Laravel tests after code or config
   changes. For release claims, run the role-by-role staging checklist in the
   API audit; static checks do not prove live API behavior.

### Secret-handling status

Environment files were not opened, searched, or printed as part of this
inventory. The updated ignore rules prevent new untracked environment files
from appearing in ordinary Git status, but ignore rules do not remove files
already tracked or staged. The root app repository has no tracked or staged
environment-file paths in this snapshot. Each nested Laravel repository does
have one tracked path named `.env`; its contents were not inspected, printed,
or copied. Treat this as a **potential secret-exposure issue**: before sharing
either repository, have its owner verify the files locally in a secure
environment, rotate any real credentials, and remove sensitive values from
repository history as appropriate. Confirm tracking status without printing
file contents before any commit.
