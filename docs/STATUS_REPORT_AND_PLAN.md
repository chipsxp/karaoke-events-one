# Karaoke Events Platform — Status Report & Forward Plan

**Date:** 2026-11-19
**Branch audited:** `ui-work` @ `29dcf04` (clean working tree, up to date with origin)
**Verified by:** fresh `npm install`, `tsc --noEmit`, and `next build` in a clean environment

---

## 1. What This Project Is

**Evently** — a karaoke events platform connecting three roles:

| Role | Intended meaning (owner's definition) |
|---|---|
| **Promoter** | The **location/venue** — owns or runs the business/building. Hosts the event and **approves KJs**. |
| **KJ** (Karaoke Jockey) | The **event host/director** — runs the karaoke event itself. Approved by the Promoter. **Approves KSs** (ticket/registration requests). |
| **KS** (Karaoke Singer) | The **customer** — finds events by searching for tickets (free or paid), joins by being approved **by the KJ** (not the Promoter). |

**Stack:** Next.js 16.4.6 (App Router, Turbopack) · React 19.2 · TypeScript 5.9 ·
Tailwind CSS 4.1 · MongoDB + Mongoose 8.20 · Clerk 6 (auth) · Stripe 19 (payments) ·
react-dropzone image uploads (base64 → MongoDB) · shadcn/Radix UI · React Hook Form + Zod.

The big Next 14 → 16 / Tailwind 3 → 4 upgrade (commit `9695d71`) is **done and stable**.

---

## 2. Objective Current State (verified this session)

- ✅ `npx tsc --noEmit` — **zero type errors**
- ✅ `npm run build` — **passes** (exit 0), all 16 routes compile
- ⚠️ Branch `ui-work` is **5 commits ahead of main**, and 3 of them are
  **PREVIEW MODE hacks** (Clerk auth disabled, Stripe checkout stubbed with an
  `alert()`, auth removed from `/events/create`). They are explicitly labeled
  *"DO NOT MERGE TO MAIN"* and **must be reverted before merging**.
  Affected files: `app/layout.tsx`, `proxy.ts`, `components/toptemp/Header.tsx`,
  `Card.tsx`, `Checkout.tsx`, `CheckoutButton.tsx`, `NavItems.tsx`,
  `app/(root)/events/create/page.tsx`.
- 📋 GitHub issues: **10 filed, 2 closed (#1, #5), 7 open** — see §4.
- 📸 Labeled screenshots for issues live in `docs/issue-screenshots/`.
- 📖 README now has honest local-setup instructions and a security warning.

---

## 3. Roles: Intent vs. Reality (why it feels "screwed up")

The plumbing for your intended model is **half-built and mislabeled**:

1. **Naming collision.** `User.isHost` is commented *"This is the KJ role"*,
   and `Event.host` (required ref) is actually the **KJ**, while
   `Event.organizer` (optional ref) is loosely the Promoter. Meanwhile
   `RoleSelection.tsx` titles the KJ **"Karaoke Host (KJ)"** and describes the
   Promoter as someone who *"helps connect KJs with venues"* — the inverse of
   your definition (Promoter **IS** the venue). This is the root of the
   KJ-vs-host confusion.
2. **Chain of command is planned, not implemented.**
   `journal-history/ADMIN_HIERARCHY_IMPLEMENTATION_JOURNAL.md` lays out exactly
   your model (Promoter verifies KJ → KJ verifies KS), including
   `verifiedBy`, `pendingVerification`, `requestVerification()`,
   `approveVerification()`. **Every checklist item is unchecked** and none of
   those fields exist in `user.model.ts`. Only inert
   `kjVerificationStatus` / `promoterVerificationStatus` strings exist — nothing
   sets or enforces them. `KJDashboard` even **hardcodes** "Verification
   Status: Pending".
3. **Permissions don't match intent.** `ROLE_PERMISSIONS` (`lib/utils.ts`) gives
   the Promoter no approve-KJ capability and no event authority; there is no
   venue↔promoter linkage beyond a `venues: [String]` array of names (no
   addresses, no geo).
4. **Broken role plumbing.** `RoleBasedNav.tsx` fetches `/api/user/role` —
   **that route does not exist** (`app/api/` only has `webhook/` and
   `dev/seed/`), so it silently renders nothing. `NavItems.tsx` fetches the role
   client-side, causing the empty-nav flash (issue #8).
5. **Dashboards are uneven.** `KSDashboard` (425 lines) is real, with
   stats/events/tickets and 30-second polling. `KJDashboard` (79 lines) and
   `PromoterDashboard` (121 lines) are **static stubs** — yet the server
   actions they need already exist and are unwired:
   `getKJDashboardData()`, `approveRegistration()`, `rejectRegistration()`,
   `markAttended()`, registration stats (`dashboard.actions.ts`,
   `eventRegistration.actions.ts`).
6. **KS registration flow works on paper.** `eventRegistration.model.ts` has
   the right lifecycle (`interested → pending → approved/rejected → attended`)
   with `approvedBy` tracking — this matches "KS approved by KJ". The gap is UI
   wiring and enforcement, plus the stubbed checkout.
7. **Silent role fallback.** `dashboard/page.tsx` auto-creates missing users
   with `role: 'KS'` — anyone landing on /dashboard without a DB record becomes
   a singer without choosing.

---

## 4. UI / Health — Open GitHub Issues

| # | Severity | Summary |
|---|---|---|
| **#10** | 🔴 **Security** | `checkoutOrder` server action has **no auth check** and trusts client-supplied `price` / `isFree` / `buyerId` → ticket price tampering. Blocks any real payments. |
| #2 | High | Header hard-crashes the whole site if Clerk auth is unavailable (this is what forced PREVIEW MODE). |
| #6 | Med | `/assets/icons/*.svg` referenced but don't exist (`public/` only has `images/`) → 404s on event details/edit/delete. |
| #7 | Med | 23 usages of dead Tailwind classes (`bg-grey-*`, `text-grey-*`, `filter-grey`, `bg-dark-3`) — theme only defines `gray-*` → unstyled elements. |
| #8 | Med | Header nav flashes empty while role loads; desktop overflow risk. |
| #9 | Med | Event-card Edit/Delete are hover-only `opacity-0` → unreachable on touch devices. |
| #3 | Low | ~~4 high npm-audit vulns in the `uploadthing`/`effect` chain.~~ **Resolved** — UploadThing removed entirely; uploads now use react-dropzone + a server action storing base64 images in MongoDB. |

---

## 5. Location / Map Status

- `Event.location` is a **plain free-text string** — no lat/lng, no geocoding,
  no venue entity, no map component, no distance calculation anywhere.
- Discovery is text search ("name, location, or genre") + category filter only.
- There is currently **zero geographic confidence** for a KS deciding whether to
  meet a KJ at a place they found online.

---

## 6. Forward Plan

### Phase 0 — Stabilize & Secure (do first)
1. **Fix #10**: `checkoutOrder` must call `auth()`, look the event up in MongoDB,
   and compute price server-side (never read price/isFree/buyerId from client).
2. **Revert PREVIEW MODE** stubs on `ui-work` (restore `ClerkProvider`,
   `clerkMiddleware`, real checkout, `/events/create` auth guard), then merge
   the docs/screenshots into `main`.
3. Quick UI fixes: #7 (rename dead classes), #6 (restore icons or swap to
   lucide-react), #8 (resolve nav links **server-side** from the DB user role —
   delete the client fetch and the nonexistent `/api/user/role` pattern),
   #2 (error boundary + graceful header fallback), #9 (always-visible controls
   on touch), #3 (resolved — uploadthing removed).

### Phase 1 — Role & Chain-of-Command Correction (the core fix)
1. **Canonical vocabulary** everywhere (code + UI): Promoter = Venue
   owner/host · KJ = Event host/director · KS = Singer. Rename
   `Event.host → Event.kj` and `Event.organizer → Event.promoter` (with a
   migration script), and change UI copy that calls the KJ "Karaoke Host".
2. **Venue entity**: new `Venue` schema (name, address, geo point, capacity,
   photos, ownedBy → Promoter). Events reference a Venue instead of a
   free-text location. Promoter's `venues: [String]` becomes real refs.
3. **Implement the Admin Hierarchy journal** (it's already written):
   - `pendingVerification`, `verifiedBy` on User; `requestVerification()`,
     `approveVerification()`, `getPendingVerifications()` actions.
   - **Promoter dashboard**: pending-KJ approval queue (real admin console).
   - **KJ dashboard**: wire the existing `getKJDashboardData` +
     `approveRegistration`/`rejectRegistration`/`markAttended` into the
     registration queue UI.
   - Gate unverified KJs from publishing; gate unverified KS registrations as
     `pending` until KJ approval (auto-approve flag already exists on events).
4. Update `ROLE_PERMISSIONS`: Promoter gets approve-KJ + venue management;
   KJ keeps event creation **at verified venues**; KS keeps register/attend.
5. Remove the silent `role: 'KS'` fallback — route unknown users to
   `/role-selection` instead.

### Phase 2 — Discovery & Ticketing Usefulness
- Event search filters: date range, free/paid, category, **distance/radius**.
- KS ticket lifecycle visibility: pending → approved states surfaced in
  KSDashboard + notifications (the `notification` model already exists).
- Replace 30-second polling with on-demand revalidation (later: SSE/WebSockets).
- Ratings (model + `RatingSystem.tsx` exist) surfaced on event cards — a KS
  should see KJ and venue ratings before buying.

### Phase 3 — Location Confidence: Mini-Map & Trust Indicators
1. **Schema**: add a GeoJSON `Point` field (`location.geo`) with a `2dsphere`
   index on Event and Venue.
2. **Geocoding**: on event/venue create+update, geocode the address via
   OpenStreetMap Nominatim (free, no key) or Google Geocoding (if a key is
   added); fallback = manual pin-drop picker in the EventForm.
3. **MiniMap component**: Leaflet + OpenStreetMap tiles (free, no API key;
   `leaflet` + `react-leaflet`, dynamically imported with `ssr: false` in
   Next.js) or MapLibre GL for a more polished look.
   - **Event cards**: static mini-map preview so the KS sees the neighborhood
     at a glance.
   - **Event details**: interactive map, venue marker, "Get Directions"
     deep-link (Google/Apple Maps), venue photos and verified badge.
4. **KS confidence features**:
   - "X mi from you" via opt-in browser geolocation + `$geoNear` aggregation.
   - **Verified Venue** badge (Promoter-verified) and **Verified KJ** badge
     (Promoter-approved) on every listing — trust comes from the chain of
     command being visible.
   - Show the Promoter/venue as the event's physical host and the KJ as the
     event director, each with profile, rating, and history.

### Phase 4 — Quality & Ops
- CI: `tsc --noEmit` + `lint` + `build` on every PR (GitHub Actions).
- Seed script with demo Promoter/KJ/KS users + venues + events for local dev.
- Tests for server actions (vitest), especially checkout and approvals.
- Scheduled `npm audit` review.

---

## 7. Recommended Order of Attack

1. 🔴 **#10 checkout security** (blocks payments, small fix).
2. Revert PREVIEW MODE → merge `ui-work` value into `main`.
3. #6/#7/#8 UI hygiene sweep (all quick, high visible impact).
4. Role renaming + Venue schema + verification chain (Phase 1 — the big one).
5. Wire KJ/Promoter dashboards to existing server actions.
6. Geo fields + MiniMap + distance (Phase 3).
7. CI + seed + tests.

---

## Appendix: Repo Map (key files)

- `app/(root)/dashboard/page.tsx` — role switch → KJ/KS/Promoter dashboards
- `app/(auth)/role-selection/page.tsx` + `components/toptemp/RoleSelection.tsx` — role picker
- `components/dashboard/{KJDashboard,KSDashboard,PromoterDashboard}.tsx`
- `lib/database/models/{user,event,eventRegistration,order,rating,notification,category}.model.ts`
- `lib/actions/{user,event,eventRegistration,dashboard,order,rating,notification}.actions.ts`
- `lib/utils.ts` — `ROLE_PERMISSIONS`
- `components/toptemp/` — Header, NavItems, RoleBasedNav (broken), Checkout (stubbed), EventForm, Card
- `journal-history/` — all dev journals, incl. the unimplemented
  `ADMIN_HIERARCHY_IMPLEMENTATION_JOURNAL.md`
- `docs/issue-screenshots/` — labeled screenshots for issues #1/#2/#6/#7/#8


