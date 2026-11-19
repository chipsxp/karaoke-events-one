# Phase 0: Stabilization & Security Journal

**Date:** 2026-11-19
**Branch:** `ui-work`
**Scope:** Phase 0 of `docs/STATUS_REPORT_AND_PLAN.md` — revert PREVIEW MODE, fix
security issue #10, and close out UI/health issues #2, #3, #6, #7, #8, #9.

---

## 1. PREVIEW MODE Revert

The `ui-work` branch carried commits (`6c03c6c`, `adb6516`) that disabled Clerk
and stubbed Stripe checkout so the UI could be viewed locally without
credentials. They were labeled *DO NOT MERGE TO MAIN*.

**Action:** restored from `origin/main`: `app/layout.tsx` (ClerkProvider),
`proxy.ts` (clerkMiddleware), `app/(root)/events/create/page.tsx` (auth + KJ
role guard), `Header.tsx`, `NavItems.tsx`, `Checkout.tsx`, `CheckoutButton.tsx`,
`Card.tsx` — then applied the fixes below on top.

## 2. Issue #10 (SECURITY): checkoutOrder hardening

**Before:** `checkoutOrder(order: CheckoutOrderParams)` was a `"use server"`
action with no auth check that trusted client-supplied `price`, `isFree`,
`eventTitle`, and `buyerId` — anyone could forge a $0.01 ticket or buy on
another user's behalf.

**After:** signature is `checkoutOrder(eventId: string)`:
- Authenticates via Clerk `auth()`; redirects to `/sign-in` when anonymous.
- Loads the buyer (`User.findOne({ clerkId })`) and event
  (`Event.findById`) from MongoDB; rejects missing buyers/events and
  `cancelled` events.
- **Price, title, and free/paid status come exclusively from the database.**
- Free tickets: creates the `Order` directly (`stripeId: free-<event>-<buyer>-<ts>`)
  and redirects to `/profile` — no zero-amount Stripe session.
- Paid tickets: Stripe Checkout session with `unit_amount` from the DB event and
  metadata (`eventId`, `buyerId` as Mongo ObjectIds) built server-side, which
  the existing `checkout.session.completed` webhook consumes unchanged.
- Invalid ObjectId / non-finite / non-positive prices are rejected.

`Checkout.tsx` now passes only `event._id`; `CheckoutButton.tsx` no longer reads
`user.publicMetadata.userId`. `CheckoutOrderParams` in `types/index.ts` reduced
to `{ eventId: string }`. The unused `loadStripe` preload was dropped (the flow
is a server-side redirect, not Stripe.js Elements).

Note: events are still created with schema-default `status: 'draft'` (no
publish workflow exists yet — Phase 1), so checkout intentionally does **not**
require `published`; it only rejects `cancelled`.

## 3. Issue #2: graceful degradation when Clerk is unavailable

- `Header.tsx` (now an async server component) wraps `auth()` in try/catch and
  falls back to signed-out navigation. Next.js control-flow exceptions
  (anything with a `digest`, e.g. `DYNAMIC_SERVER_USAGE` during prerender) are
  **re-thrown** — swallowing them corrupts the build. This was caught by the
  first build attempt and fixed.
- `Card.tsx` wraps its `auth()` call the same way (cards render without
  creator controls instead of crashing listing pages).
- Added `app/(root)/error.tsx` (route-group boundary with retry/home) and
  `app/global-error.tsx` (root-layout boundary, e.g. a provider that cannot
  initialize) so failures render friendly UI instead of raw stack traces.

## 4. Issue #8: server-side role nav (no empty-nav flash)

- `Header` resolves the viewer's role once, server-side, via `getUserById`,
  and passes `role` + `isSignedIn` as props to `NavItems` (and `MobileNav`,
  which forwards them).
- `NavItems` is now purely presentational: synchronous link derivation, no
  client fetch, no loading state → the nav can never render empty. Signed-out
  users see Home; signed-in users with an unresolved role see Home + My Profile.
- Desktop `<nav>` container: `max-w-xs` → `w-full max-w-none flex-1
  justify-center` (no clipping of the KJ's 4 links); the list wraps at `md`.
- Deleted `components/toptemp/RoleBasedNav.tsx` — unused, and it fetched
  `/api/user/role`, a route that does not exist.

## 5. Issue #6: missing `/assets/icons/*.svg` → lucide-react

`public/` has no `assets/` directory; all four references 404'd. Replaced with
icons from `lucide-react` (already the project's icon set):
- `events/[id]/page.tsx`: `Calendar`, `MapPin` (were calendar.svg/location.svg)
- `EditEventButton.tsx`: `Pencil` (was edit.svg), plus `aria-label`
- `DeleteConfirmation.tsx`: `Trash2` (was delete.svg), trigger styled to match
  the edit button

## 6. Issue #7: dead `grey`/`dark` Tailwind classes

Renamed to the tokens actually defined in the Tailwind v4 CSS-first theme
(`--color-gray-*`, `.filter-gray`): `bg-grey-*`→`bg-gray-*`,
`text-grey-*`→`text-gray-*`, `filter-grey`→`filter-gray` across `EventForm`,
`FileUploader`, `events/[id]/page`, `orders/page`, `DeleteConfirmation`.
Removed the undefined `bg-dark-3` from `FileUploader` (it was overridden by
`bg-gray-50` anyway). Verified: `grep -rn 'grey|bg-dark-3'` → 0 hits.

## 7. Issue #9: touch-reachable card controls

`Card.tsx` creator actions (Edit/Delete): `opacity-0 group-hover:opacity-100`
→ `opacity-100 md:opacity-0 md:group-hover:opacity-100
md:group-focus-within:opacity-100` — always visible on touch/small screens,
hover/focus on desktop. Moved from `top-2 right-2` to `bottom-2 right-2`
(row layout) so they no longer overlap the category badge.

## 8. Issue #3: npm audit → 0 vulnerabilities

`uploadthing@7.7.4` pins exact vulnerable deps (`effect@3.17.7`,
`@effect/platform@0.90.3`) and no patched uploadthing release exists; the
`npm audit fix --force` suggestion (downgrade to uploadthing 6) would break the
v7 APIs used in `app/api/uploadthing/*` and `FileUploader`. Instead, added
`package.json` **overrides** forcing patched same-major versions:
`effect@3.22.5`, `@effect/platform@0.97.4`. Verified `npm audit` → **0
vulnerabilities** and that `uploadthing/next`, `uploadthing/server`, and
`@uploadthing/react` import cleanly under the overrides. The full upload flow
should be re-tested once real UploadThing credentials are configured.

## 9. Bonus stabilization: Next 16 async `params`

`events/[id]/page.tsx` and `events/[id]/update/page.tsx` destructured `params`
synchronously — under Next 16 `params` is a Promise, so `id` was `undefined` at
runtime (broken event detail/edit pages). Both now `await params`; the inner
`searchParams` result was renamed `search` to avoid shadowing.
`SearchParamProps` in `types/index.ts` updated to `params: Promise<{ id: string }>`.

## 10. Verification

- `npx tsc --noEmit` → 0 errors
- `npm run build` (Next 16.4.6, Turbopack) → exit 0, all 16 routes
- `npm audit` → 0 vulnerabilities
- Production smoke test (`next start`, no Mongo, format-valid fake Clerk keys):
  `/` → 200 with header nav rendered (Home link present immediately, no crash;
  DB failure degraded to empty state per issue #5), unknown route → 404 page,
  static assets → 200.

## 11. Known remaining gaps (not Phase 0)

- `npm run lint` is broken independently of this work: Next 16 removed
  `next lint`, and `eslint-config-next` is not in devDependencies. Tracked as
  issue #11.
- Runtime sign-in/checkout/uploads still require real Clerk/Stripe/UploadThing
  credentials (see README "Viewing the app locally").
- `Event.status` publish workflow, role chain-of-command, Venue schema,
  dashboards wiring, and geo/mini-map are Phases 1–3 in
  `docs/STATUS_REPORT_AND_PLAN.md`.

