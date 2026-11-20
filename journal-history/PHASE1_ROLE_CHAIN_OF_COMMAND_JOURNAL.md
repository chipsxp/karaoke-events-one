# Phase 1: Role & Chain-of-Command Implementation Journal

**Date:** 2026-11-20
**Branch:** `ui-work`
**Scope:** Phase 1 of `docs/STATUS_REPORT_AND_PLAN.md` — canonical role
vocabulary, Venue entity, Promoter→KJ→KS chain of command, real dashboards.
This implements the design from `ADMIN_HIERARCHY_IMPLEMENTATION_JOURNAL.md`
(checklist now actually done) with one deliberate interpretation change
documented below.

---

## 1. Canonical Role Vocabulary (the core confusion fix)

| Role | Meaning | Approved by |
|---|---|---|
| **Promoter** | Venue owner / location host — the business where events happen. Top of the chain of command. | Nobody (auto-verified admin) |
| **KJ** (Karaoke Jockey) | Event host/director — runs the karaoke night, approves singers. | A verified **Promoter** |
| **KS** (Karaoke Singer) | Customer — gets a ticket (free or paid) and is accepted into an event. | The event's **KJ** (per-event) |

**Interpretation decision:** the old admin-hierarchy journal proposed global
KS account verification by KJs. Per the product owner's definition, KSs are
approved **per event** by the KJ when they get a ticket — that is what was
implemented (the `EventRegistration` approval flow). KS accounts need no
account-level approval; they can browse and buy immediately.

**Schema renames (with migration):**
- `Event.host` → `Event.kj` (required) — the KJ is the event host/director.
- `Event.organizer` → `Event.promoter` (nullable) — the venue owner; set
  automatically when the event references a Venue. Legacy events where
  organizer == host (creator was both) migrate to `promoter: null`.
- `User.isHost` kept as a legacy mirror flag of `role === 'KJ'`.
- UI copy: RoleSelection, profile, event card/details now say
  "Karaoke Jockey (KJ) · Event Host", "Promoter · Venue Host", etc. The KJ is
  never called "Karaoke Host" anymore.

## 2. Venue Entity (new)

- `lib/database/models/venue.model.ts`: name, address, city/state/zip,
  description, capacity, photos, `ownedBy → User (Promoter)`, `isActive`.
- `lib/actions/venue.actions.ts`: `createVenue` (Promoter-only, enforced),
  `getVenuesByPromoter`, `getAllActiveVenues` (KJ event-form dropdown),
  `getVenueById`, `deactivateVenue` (owner-only soft delete).
- `Event.venue` (optional ref). When a KJ picks a venue in EventForm:
  location auto-fills, `event.promoter` is set to the venue owner, and the
  event card/detail pages show the venue name + address.
- Geo coordinates are deliberately NOT added yet — that's Phase 3 (mini-map).

## 3. Chain of Command (verification)

**User model additions:** `roleSelected`, `verifiedBy → User`,
`pendingVerification`. `promoterVerificationStatus` default flipped to
`verified` (Promoters are top of chain).

**Flow:**
1. Clerk webhook creates users with default role KS and `roleSelected=false`.
2. `/role-selection` is now reachable by them (previously the default role
   short-circuited it back to /dashboard — a real bug). Choosing a role sets
   `roleSelected=true`; choosing KJ enters the Promoter approval queue
   (`kjVerificationStatus='pending'`, `pendingVerification=true`).
3. KJ submits experience/equipment/genres from the **KJ Dashboard**
   (`submitKJVerification`) while pending.
4. Any verified Promoter sees the pending-KJ queue on the **Promoter
   Dashboard** and approves/rejects (`approveKJVerification` /
   `rejectKJVerification` — both now **verify the approver is a verified
   Promoter server-side** and record `verifiedBy`). The KJ gets a
   notification either way.
5. Unverified KJs are **gated from creating events** in three layers:
   `/events/create` page redirect, `createEvent` server-action check, and the
   KJ dashboard showing the verification flow instead of event tools.
6. KS gets a ticket → `registerAttendeeFromTicket` (new) creates/updates an
   `EventRegistration` as `pending` (or `approved` when the event has
   `autoApprove`) and notifies the KJ. Wired into BOTH purchase paths:
   free checkout (in `checkoutOrder`) and paid checkout (Stripe webhook).
7. Only the **event's own KJ** can approve/reject/mark-attended its
   registrations (`assertIsEventKJ` guard) — previously any signed-in user
   could call these server actions with arbitrary ids. Approval also enforces
   event capacity. The singer is notified of the decision.

## 4. Error Propagation Fix (`handleErrorThrow`)

Discovery during integration testing: `handleError()` only logs and RETURNS
the error — every action silently swallowed failures (auth rejections
included) and returned `undefined`. Read-only queries rely on that for
graceful degradation (issue #5), so instead of changing it globally, added
`handleErrorThrow()` in `lib/utils.ts` and switched all **mutation/authorization**
catch blocks to it (18 sites across user/venue/event/eventRegistration
actions). UI now receives real error messages; safe-default reads unchanged.

## 5. Real Dashboards (no more mock data)

All three dashboards previously rendered hardcoded demo data — KSDashboard's
"12 events, 83% attendance" was literally useState defaults. Also, every
dashboard server action queried Mongo ObjectId fields with the **Clerk id**,
so even wired up they would have returned zeros.

- `dashboard.actions.ts` rewritten: every action resolves Clerk id → Mongo
  user internally; renamed queries to `kj`; added `getPromoterDashboardData`
  (venues, pending KJs, events at venues).
- **KJDashboard**: verification states (submit form / pending banner /
  rejected re-submit), stats cards, **Singer Approval Queue** with
  Approve/Reject, events list with per-event registration stats.
- **PromoterDashboard**: stats, **KJ approval queue** (experience, equipment,
  genres + Approve/Reject with reason), **venue management** (create form +
  list + deactivate).
- **KSDashboard**: stats and recent events now loaded from
  `getKSDashboardData` (zeros instead of fake numbers until real data exists).
- **NotificationBell** (existed but was rendered nowhere) is now mounted in
  the Header for signed-in users.

## 6. Other Fixes Along the Way

- `dashboard/page.tsx`: removed the silent "auto-create missing user as KS"
  fallback; users without an active role choice go to `/role-selection`.
- `getAllEvents` discovery now excludes `draft`/`cancelled` events;
  `createEvent` publishes (`status: 'published'`) since the creator is a
  verified KJ.
- `getEventRegistrationStats` aggregation matched `eventId` as a string
  against stored ObjectIds — always returned zeros. Fixed with
  `new ObjectId(eventId)` + validity check.
- `getEventsByHost` renamed `getEventsByKJ` (Clerk-id aware);
  `getUserRegistrationsWithEvents` + KS dashboard populates now use `kj`/`venue`.
- `submitPromoterVerification` no longer sets Promoters to 'pending'
  (nothing sits above them in the chain); it records venue/experience info
  and keeps them verified.
- EventForm: added venue dropdown (active venues, auto-fills location);
  `venueId` added to zod schema, `CreateEventParams`/`UpdateEventParams`,
  `eventDefaultValues` (dropped unused `organizerId`/`hostId`).

## 7. Migration

`scripts/migrate-phase1.mjs` (`npm run migrate:phase1`) — idempotent, tested:
1. `events.host → events.kj`
2. `events.organizer → events.promoter`
3. `promoter == kj` (legacy creator-both) → `promoter: null`
4. legacy events (no status / draft) → `published` (they were publicly listed)
5. all existing users → `roleSelected: true`
6. Promoters → `promoterVerificationStatus: 'verified'`
7. KJ `pendingVerification` synced to their `kjVerificationStatus`; KS cleared

**Run it once against your real database before using the new code:**
`MONGODB_URI="..." npm run migrate:phase1` (reads `.env.local` automatically).

## 8. Verification (all green)

- `npx tsc --noEmit` → 0 errors; `npm run build` → exit 0, all 16 routes.
- **New test suite** (first in repo history):
  - `npm run test:migration` — spins an in-memory MongoDB
    (mongodb-memory-server), seeds legacy-shaped data, runs the migration
    script, asserts 13 properties incl. idempotency.
  - `npm run test:chain` — runs the REAL server actions end-to-end against an
    in-memory MongoDB: 29 assertions covering role creation, webhook-user
    role gating, Promoter→KJ approval (+ verifiedBy + notification +
    authorization denials), venue ownership, event-creation gating
    (unverified KJ / KS blocked), venue→promoter auto-linking, ticket →
    pending registration → KJ-only approval → notifications, and all three
    dashboards returning correct counts.
  - `npm run test:phase1` runs both. (Note: `revalidatePath` "Invariant" logs
    in test output are expected outside a Next request scope; the DB writes
    complete before them.)

## 9. Known Gaps / Next (Phases 2–3)

- KS→"interested" direct signup UI on event pages (ticket flows are wired;
  the interested-button UI is Phase 2).
- Ratings surfaced on cards; search filters (date/free/distance) — Phase 2.
- Venue geo + mini-map + distance — Phase 3.
- `npm run lint` still broken on Next 16 — issue #11.
- Multi-Promoter approval model: ANY verified Promoter can approve a KJ
  (platform-level trust). Per-venue KJ assignments could come later if needed.

