/**
 * Seed test: runs the REAL seedDemoData/clearDemoData against an in-memory
 * MongoDB. Verifies idempotency, collection creation, chain-of-command shape,
 * and clean removal. Run: npm run test:seed
 */
import { MongoMemoryServer } from "mongodb-memory-server";

let failures = 0;
const assert = (cond: any, msg: string) => {
  if (cond) console.log("  PASS:", msg);
  else { failures++; console.error("  FAIL:", msg); }
};

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const { seedDemoData, clearDemoData } = await import("../lib/seed-demo");
  const { default: User } = await import("../lib/database/models/user.model");
  const { default: Event } = await import("../lib/database/models/event.model");
  const { default: Venue } = await import("../lib/database/models/venue.model");
  const { default: EventRegistration } = await import("../lib/database/models/eventRegistration.model");
  const { default: Order } = await import("../lib/database/models/order.model");
  const { Notification } = await import("../lib/database/models/notification.model");

  console.log("== seed (first run) ==");
  const summary = await seedDemoData();
  assert(summary.events.includes("3 published"), "summary reports 3 events");

  const users = await User.countDocuments();
  const events = await Event.countDocuments({ status: "published" });
  const venues = await Venue.countDocuments();
  const regs = await EventRegistration.countDocuments();
  const orders = await Order.countDocuments();
  const notifs = await Notification.countDocuments();
  assert(users === 3, `3 users created (got ${users})`);
  assert(events === 3, `3 published events created (got ${events})`);
  assert(venues === 1, `1 venue created (got ${venues})`);
  assert(regs === 3, `3 registrations created (got ${regs})`);
  assert(orders === 2, `2 free-ticket orders created (got ${orders})`);
  assert(notifs === 1, `1 KJ notification created (got ${notifs})`);

  console.log("== chain-of-command shape ==");
  const kj = await User.findOne({ clerkId: "demo_kj" });
  const promoter = await User.findOne({ clerkId: "demo_promoter" });
  assert(kj.kjVerificationStatus === "verified" && String(kj.verifiedBy) === String(promoter._id), "KJ verified by the Promoter");
  const ev = await Event.findOne({ title: /Friday Night/ }).populate("kj promoter venue");
  assert(String(ev.kj._id) === String(kj._id) && String(ev.promoter._id) === String(promoter._id) && ev.venue.name === "The Melody Lounge", "event links kj + promoter + venue");
  const pending = await EventRegistration.countDocuments({ status: "pending" });
  const approved = await EventRegistration.countDocuments({ status: "approved" });
  assert(pending === 1 && approved === 1, "1 pending (KJ queue) + 1 auto-approved registration");

  console.log("== seed again (idempotency) ==");
  await seedDemoData();
  const users2 = await User.countDocuments();
  const events2 = await Event.countDocuments();
  const regs2 = await EventRegistration.countDocuments();
  const notifs2 = await Notification.countDocuments();
  assert(users2 === 3 && events2 === 3 && regs2 === 3 && notifs2 === 1, `no duplicates on re-run (u${users2} e${events2} r${regs2} n${notifs2})`);

  console.log("== clear ==");
  const cleared = await clearDemoData();
  const [u3, e3, v3, r3, o3, n3] = await Promise.all([
    User.countDocuments(), Event.countDocuments(), Venue.countDocuments(),
    EventRegistration.countDocuments(), Order.countDocuments(), Notification.countDocuments(),
  ]);
  assert(cleared.removedUsers === 3 && u3 === 0 && e3 === 0 && v3 === 0 && r3 === 0 && o3 === 0 && n3 === 0, "all demo data removed cleanly");

  await mongod.stop();
  if (failures > 0) { console.error(`\n${failures} assertion(s) FAILED`); process.exit(1); }
  console.log("\nALL SEED ASSERTIONS PASSED");
}

main().catch((e) => { console.error(e); process.exit(1); });
