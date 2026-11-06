# AttenDo Project Context

Short orientation for coding agents. Treat source code and SQL migrations as authoritative when details may have changed.

## Product

AttenDo is a Vietnamese attendance web app. Hosts create time-limited sessions with configurable attendee fields and optional GPS geofencing, rotating PIN, or dynamic QR. Attendees check in through a session link; hosts monitor attendance live and export CSV.

## Stack and Commands

- Bun 1.3.12; Next.js 16 App Router; React 19; strict TypeScript; Tailwind CSS 4.
- Supabase Auth, Postgres, and Realtime via `@supabase/ssr` and `@supabase/supabase-js`.
- Zustand 5 stores client-side application/UI state. Lucide icons, `qrcode.react`, Leaflet, and `html5-qrcode` are installed.
- Run from this directory: `bun run dev`, `bun run lint`, `bun run build`. No test script is defined.
- `@/*` maps to `src/*`.

## Main Routes

- `/`: landing page; `/contact`: contact information.
- `/auth`: sign-in.
- `/host/gps/setup`, `/host/dynamic-qr/setup`, `/host/qr-pin/setup`: host session setup, shared through `HostSetupPage`.
- `/host/live/[eventId]`: live QR/PIN, session status, realtime attendees, CSV export.
- `/host/manage`: list owned sessions and view attendees.
- `/check-in/[eventId]`: attendee form, optional GPS/PIN/dynamic QR validation.
- `/test-qr`, `/test-location`: diagnostic pages.

## Code Map and Data Flow

- `src/app/`: routes/layouts; `src/components/`: UI; `src/hooks/`: client workflows; `src/stores/`: Zustand stores.
- `src/actions/`: server actions for auth, events, PIN, QR token, and check-in. Keep privileged mutations and authorization here.
- `src/lib/supabase/client.ts` is the browser client; `src/lib/supabase/server.ts` is the cookie-aware server client and exposes `verifyAuth`.
- `src/proxy.ts` refreshes/checks Supabase auth and protects `/host/*`; login uses `useActionState` and redirects to a validated `/host/` path.
- Check-in validation is enforced by the Postgres `check_in_to_event` RPC, not only by client UI: active/expiry, required fields, GPS radius, PIN, QR token, and duplicate device checks.
- New host-generated check-in links carry the event display configuration needed to render the form and geofence, so opening the attendee route does not query the database. Treat URL configuration as display-only; the `check_in_to_event` RPC remains authoritative and is called on submission to validate current event settings and record attendance. GPS permission is checked before requesting a location; denied permission and unavailable device location show device/browser-specific recovery guidance, with bounded retries.
- Core tables: `events`, `event_pins`, `event_qr_tokens`, `attendance_records`. Base schema is `supabase/schema.sql`; apply timestamped `supabase/migrations/` in order.

## Zustand Stores

- `host-setup-store.ts`: session setup form, custom fields, location and drag/drop state.
- `check-in-store.ts`: event, attendee form, GPS and check-in result; scoped/reset by event ID.
- `host-live-store.ts`: live session, timers, QR/PIN, attendees/realtime, and related UI state; scoped/reset by event ID.
- `host-management-store.ts`: session list, selection, search, loading and errors.
- `tools-store.ts`: QR/GPS diagnostic and location-help UI state.

Use selectors for individual fields. Do not put server-only or framework-managed values (for example `useActionState`, `useTransition`, refs, or derived values) in Zustand. Avoid persisting sensitive attendee data in browser storage; current duplicate-check protection stores only a device ID and per-event completion marker/name in localStorage.

## Important Constraints and Things to Verify

- Camera/GPS permissions can fail in iOS/Safari and in-app browsers such as Zalo; preserve Vietnamese user-facing recovery guidance.
- Review `supabase/schema.sql` and all migrations before changing database access. The base schema currently includes a public `SELECT` policy on `attendance_records`; confirm intended privacy/access before relying on or modifying it.
- Supabase clients currently call `createBrowserClient`/`createServerClient` without a generated `Database` generic; `src/types/database.ts` contains hand-maintained app types.
- `README.md` is still mostly the create-next-app template; use package scripts and SQL instructions above rather than assuming template guidance is project-specific.
- A prior Bun build compiled and passed TypeScript but failed during Next.js page-data collection with a Bun CommonJS-wrapper runtime error. Re-test build in the target deployment/runtime before attributing a build failure to app code.

## Useful Starting Points

- Session setup: `src/components/host/HostSetupPage.tsx`, `src/actions/events.ts`.
- Check-in: `src/app/check-in/[eventId]/page.tsx`, `src/hooks/check-in/`, `src/actions/check-in.ts`.
- Live host view: `src/app/host/live/[eventId]/page.tsx`, `src/hooks/host-live/`.
- Authentication: `src/actions/auth.ts`, `src/proxy.ts`, `src/lib/supabase/server.ts`.
- Database rules: `supabase/schema.sql`, `supabase/migrations/`.
