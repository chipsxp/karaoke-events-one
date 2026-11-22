/**
 * Phase 1 chain-of-command integration test.
 * Runs the REAL server actions against an in-memory MongoDB:
 *   Promoter (venue owner) -> approves KJ -> KJ creates event at venue
 *   -> KS gets ticket -> registration lands in KJ queue -> KJ approves KS.
 * Run: npm run test:chain   (from repo root)
 */
import { MongoMemoryServer } from "mongodb-memory-server";

let failures = 0;
const assert = (cond: any, msg: string) => {
  if (cond) console.log("  PASS:", msg);
  else { failures++; console.error("  FAIL:", msg); }
};
const expectThrow = async (fn: () => Promise<any>, match: string | RegExp, msg: string) => {
  try {
    await fn();
    failures++; console.error("  FAIL (no throw):", msg);
  } catch (e: any) {
    const ok = typeof match === "string" ? String(e?.message).includes(match) : match.test(String(e?.message));
    if (ok) console.log("  PASS:", msg);
    else { failures++; console.error(`  FAIL (wrong error "${e?.message}"):`, msg); }
  }
};
// Actions call revalidatePath which can throw outside a Next request; the DB
// write already happened, so swallow and let assertions check state.
const lenient = async (fn: () => Promise<any>) => { try { return await fn(); } catch { return undefined; } };

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
  console.log("In-memory MongoDB at", process.env.MONGODB_URI);

  const { default: User } = await import("../lib/database/models/user.model");
  const { default: Event } = await import("../lib/database/models/event.model");
  const { default: Venue } = await import("../lib/database/models/venue.model");
  const { default: Category } = await import("../lib/database/models/category.model");
  const { default: EventRegistration } = await import("../lib/database/models/eventRegistration.model");
  const { Notification } = await import("../lib/database/models/notification.model");
  const userActions = await import("../lib/actions/user.actions");
  const venueActions = await import("../lib/actions/venue.actions");
  const eventActions = await import("../lib/actions/event.actions");
  const regActions = await import("../lib/actions/eventRegistration.actions");
  const dashActions = await import("../lib/actions/dashboard.actions");

  console.log("\n== 1. Role selection / user creation ==");
  const promoter = await userActions.createUser({ clerkId: "clerk_promo", email: "p@x.com", username: "promo", firstName: "Pam", lastName: "Owner", photo: "", role: "Promoter" } as any);
  const kj = await userActions.createUser({ clerkId: "clerk_kj", email: "k@x.com", username: "kj1", firstName: "Kyle", lastName: "Jockey", photo: "", role: "KJ" } as any);
  const ks = await userActions.createUser({ clerkId: "clerk_ks", email: "s@x.com", username: "ks1", firstName: "Sam", lastName: "Singer", photo: "", role: "KS" } as any);
  const webhookUser = await userActions.createUser({ clerkId: "clerk_hook", email: "h@x.com", username: "hook", firstName: "Web", lastName: "Hook", photo: "" } as any);
  assert(promoter.roleSelected === true && promoter.promoterVerificationStatus === "verified", "Promoter: roleSelected + auto-verified (top of chain)");
  assert(kj.roleSelected === true && kj.kjVerificationStatus === "pending" && kj.pendingVerification === true, "KJ: starts pending Promoter approval");
  assert(ks.roleSelected === true && ks.pendingVerification === false, "KS: no account-level approval needed");
  assert(webhookUser.roleSelected === false && webhookUser.role === "KS", "Webhook-created user: roleSelected=false (must pick role)");

  console.log("\n== 2. Promoter approves KJ ==");
  await expectThrow(() => userActions.approveKJVerification("clerk_kj", "clerk_ks"), "Only verified Promoters", "KS cannot approve a KJ");
  await lenient(() => userActions.approveKJVerification("clerk_kj", "clerk_promo"));
  const kjAfter = await User.findOne({ clerkId: "clerk_kj" });
  assert(kjAfter.kjVerificationStatus === "verified", "KJ verified after Promoter approval");
  assert(String(kjAfter.verifiedBy) === String(promoter._id), "verifiedBy records the approving Promoter");
  assert(kjAfter.pendingVerification === false, "pendingVerification cleared");
  const kjNotif = await Notification.findOne({ userId: "clerk_kj", type: "approval" });
  assert(!!kjNotif, "KJ received an approval notification");

  console.log("\n== 3. Promoter creates a venue ==");
  await expectThrow(() => venueActions.createVenue({ promoterId: "clerk_ks", venue: { name: "Hack", address: "x" } }), "Only Promoters", "Non-promoter cannot create venues");
  const venue = await venueActions.createVenue({ promoterId: "clerk_promo", venue: { name: "The Melody Lounge", address: "123 Song St", city: "Austin", state: "TX", capacity: 80 } });
  assert(venue && venue.name === "The Melody Lounge" && String(venue.ownedBy) === String(promoter._id), "Venue created and owned by the Promoter");
  console.log("\n== 4. Event creation gating ==");
  const kj2 = await userActions.createUser({ clerkId: "clerk_kj2", email: "k2@x.com", username: "kj2", firstName: "Unverified", lastName: "KJ", photo: "", role: "KJ" } as any);
  const cat = await Category.create({ name: "Karaoke Night" });
  const baseEvent = { title: "Friday Karaoke", description: "Sing night", location: "", imageUrl: "", startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), endDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000), categoryId: String(cat._id), price: "10", isFree: false, url: "https://x.com", capacity: 50, autoApprove: false };
  await expectThrow(() => eventActions.createEvent({ userId: "clerk_kj2", event: baseEvent as any, path: "/" }), "pending Promoter approval", "Unverified KJ cannot create events");
  await expectThrow(() => eventActions.createEvent({ userId: "clerk_ks", event: baseEvent as any, path: "/" }), "Only KJs", "KS cannot create events");
  await lenient(() => eventActions.createEvent({ userId: "clerk_kj", event: { ...baseEvent, venueId: String(venue._id) } as any, path: "/" }));
  const created = await Event.findOne({ title: "Friday Karaoke" }).populate("kj promoter venue category");
  assert(!!created, "Verified KJ created the event");
  assert(String((created as any).kj._id) === String(kj._id), "event.kj is the creating KJ");
  assert(String((created as any).promoter._id) === String(promoter._id), "event.promoter auto-set to venue owner");
  assert((created as any).venue.name === "The Melody Lounge", "event.venue linked");
  assert(created.status === "published", "event published on creation");
  assert(created.location.includes("The Melody Lounge"), "location auto-filled from venue");

  console.log("\n== 5. Ticket -> KJ approval queue -> KS approved ==");
  const reg = await regActions.registerAttendeeFromTicket(String(created._id), String(ks._id));
  assert(reg && reg.status === "pending", "Ticket holder lands in queue as pending");
  const kjQueueNotif = await Notification.findOne({ userId: "clerk_kj", type: "registration" });
  assert(!!kjQueueNotif, "KJ notified about the awaiting singer");
  const queue = await dashActions.getKJRegistrationQueue("clerk_kj");
  assert(Array.isArray(queue) && queue.length === 1 && queue[0].userId.firstName === "Sam", "Registration queue shows the singer");
  await expectThrow(() => regActions.approveRegistration({ registrationId: String(reg._id), approvedBy: "clerk_ks" }), "Only KJs can review", "KS cannot approve registrations");
  await expectThrow(() => regActions.approveRegistration({ registrationId: String(reg._id), approvedBy: "clerk_kj2" }), "Only the event's KJ", "A different KJ cannot approve");
  await lenient(() => regActions.approveRegistration({ registrationId: String(reg._id), approvedBy: "clerk_kj" }));
  const regAfter = await EventRegistration.findById(reg._id);
  assert(regAfter.status === "approved" && String(regAfter.approvedBy) === String(kj._id), "Event's KJ approved the singer (approvedBy recorded)");
  const ksNotif = await Notification.findOne({ userId: "clerk_ks", type: "approval" });
  assert(!!ksNotif, "KS notified about approval");

  console.log("\n== 6. Dashboards return real numbers ==");
  const kjDash = await dashActions.getKJDashboardData("clerk_kj");
  assert(kjDash?.totalEvents === 1 && kjDash?.pendingRegistrations === 0 && kjDash?.upcomingEvents === 1, "KJ dashboard stats correct");
  const ksDash = await dashActions.getKSDashboardData("clerk_ks");
  assert(ksDash?.registeredEvents === 1 && ksDash?.upcomingRegistrations.length === 1, "KS dashboard stats correct");
  const promoDash = await dashActions.getPromoterDashboardData("clerk_promo");
  assert(promoDash?.totalVenues === 1 && promoDash?.totalEventsAtVenues === 1 && promoDash?.upcomingEventsAtVenues === 1, "Promoter dashboard stats correct");

  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
  await mongod.stop();
  if (failures > 0) { console.error(`\n${failures} assertion(s) FAILED`); process.exit(1); }
  console.log("\nALL CHAIN-OF-COMMAND ASSERTIONS PASSED");
}

main().catch((e) => { console.error(e); process.exit(1); });
