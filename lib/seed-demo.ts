import { connectToDatabase } from "@/lib/database";
import User from "@/lib/database/models/user.model";
import Venue from "@/lib/database/models/venue.model";
import Event from "@/lib/database/models/event.model";
import Category from "@/lib/database/models/category.model";
import EventRegistration from "@/lib/database/models/eventRegistration.model";
import Order from "@/lib/database/models/order.model";
import { Notification } from "@/lib/database/models/notification.model";

/**
 * Demo seed for the Phase 1 chain of command (idempotent — safe to re-run).
 * Creates a clearly-marked demo dataset:
 *   Promoter (venue owner) -> Venue -> verified KJ -> published events
 *   -> KS with a free-ticket order, a pending registration (KJ queue),
 *      an auto-approved registration, and an "interested" marker.
 * Used by `npm run seed:demo` (CLI) and the SEED_SECRET-gated
 * /api/dev/seed route (so it can be triggered over HTTPS after deploy).
 */
export async function seedDemoData() {
  await connectToDatabase();

  const summary: Record<string, string> = {};

  // ---- Category ----
  let category = await Category.findOne({ name: "Karaoke Night" });
  if (!category) category = await Category.create({ name: "Karaoke Night" });
  summary.category = category.name;

  // ---- Users (demo clerk ids; cannot sign in, purely data) ----
  const upsertUser = async (data: any) =>
    User.findOneAndUpdate(
      { clerkId: data.clerkId },
      { $set: { ...data, updatedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

  const promoter = await upsertUser({
    clerkId: "demo_promoter",
    emailId: "demo-promoter@karaoke.demo",
    userName: "demo-promoter",
    firstName: "Demo",
    lastName: "Promoter",
    photoAvatar: "default.png",
    role: "Promoter",
    roleSelected: true,
    isHost: false,
    isPromoter: true,
    promoterVerificationStatus: "verified",
    pendingVerification: false,
  });

  const kj = await upsertUser({
    clerkId: "demo_kj",
    emailId: "demo-kj@karaoke.demo",
    userName: "demo-kj",
    firstName: "Demo",
    lastName: "KJ Kyle",
    photoAvatar: "default.png",
    role: "KJ",
    roleSelected: true,
    isHost: true,
    isPromoter: false,
    kjVerificationStatus: "verified",
    pendingVerification: false,
    verifiedBy: promoter._id,
    experience: "8 years running weekly karaoke nights across Austin venues.",
    equipment: ["Mixer", "Wireless mics x4", "4K projector", "20k song catalog"],
    genres: ["Pop", "Rock", "Country", "R&B"],
  });

  const ks = await upsertUser({
    clerkId: "demo_ks",
    emailId: "demo-ks@karaoke.demo",
    userName: "demo-ks",
    firstName: "Demo",
    lastName: "Singer Sam",
    photoAvatar: "default.png",
    role: "KS",
    roleSelected: true,
    isHost: false,
    isPromoter: false,
    pendingVerification: false,
    vocalRange: "Tenor",
    preferredGenres: ["Rock", "Pop"],
  });
  summary.users = "demo_promoter (Promoter, verified) · demo_kj (KJ, verified) · demo_ks (KS)";

  // ---- Venue ----
  let venue = await Venue.findOne({ name: "The Melody Lounge", ownedBy: promoter._id });
  if (!venue) {
    venue = await Venue.create({
      name: "The Melody Lounge",
      address: "123 Song St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      description: "Cozy lounge with a stage, private rooms, and full bar. Free parking after 6pm.",
      capacity: 80,
      ownedBy: promoter._id,
      isActive: true,
    });
  }
  summary.venue = `${venue.name} — ${venue.address}, ${venue.city}`;
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // ---- Events (upsert by title) ----
  const upsertEvent = async (data: any) =>
    Event.findOneAndUpdate(
      { title: data.title },
      { $set: { ...data, updatedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

  const common = {
    description: "Demo event seeded for Railway deployment testing. Sign up, grab a ticket, and the KJ will see you in the approval queue!",
    imageUrl: "",
    category: category._id,
    kj: kj._id,
    promoter: promoter._id,
    venue: venue._id,
    location: `${venue.name} — ${venue.address}, ${venue.city}, ${venue.state}`,
    status: "published",
    equipment: ["Mixer", "Wireless mics"],
    songList: ["Bohemian Rhapsody", "Sweet Caroline", "Mr. Brightside"],
    registrationSettings: {
      allowGroupRegistration: true,
      maxGroupSize: 5,
      requireSongRequests: false,
      allowSongRequests: true,
    },
  };

  const freeEvent = await upsertEvent({
    ...common,
    title: "Friday Night Karaoke (Demo · Free)",
    startDateTime: new Date(now + 2 * day),
    endDateTime: new Date(now + 2 * day + 4 * 60 * 60 * 1000),
    price: 0,
    isFree: true,
    capacity: 40,
    autoApprove: false, // singers land in the KJ queue
    eventUrl: "https://example.com/friday-karaoke",
  });

  const paidEvent = await upsertEvent({
    ...common,
    title: "Saturday Showdown (Demo · $10 ticket)",
    startDateTime: new Date(now + 3 * day),
    endDateTime: new Date(now + 3 * day + 5 * 60 * 60 * 1000),
    price: 10,
    isFree: false,
    capacity: 30,
    autoApprove: false,
    eventUrl: "https://example.com/saturday-showdown",
  });

  const autoEvent = await upsertEvent({
    ...common,
    title: "Weekend Warm-up (Demo · Auto-approve)",
    startDateTime: new Date(now + 1 * day),
    endDateTime: new Date(now + 1 * day + 3 * 60 * 60 * 1000),
    price: 0,
    isFree: true,
    capacity: 20,
    autoApprove: true, // ticket holders approved instantly
    eventUrl: "https://example.com/weekend-warmup",
  });
  summary.events = "3 published events at The Melody Lounge (free + paid + auto-approve)";
  // ---- KS ticket/registration flow ----
  const upsertRegistration = async (data: any) =>
    EventRegistration.findOneAndUpdate(
      { eventId: data.eventId, userId: data.userId },
      { $setOnInsert: { ...data, createdAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  const upsertFreeOrder = async (eventId: any, buyerId: any) =>
    Order.findOneAndUpdate(
      { stripeId: `free-demo-${eventId}-${buyerId}` },
      {
        $setOnInsert: {
          stripeId: `free-demo-${eventId}-${buyerId}`,
          event: eventId,
          buyer: buyerId,
          totalAmount: "0",
          createdAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

  // 1) Free ticket for the Friday event -> pending in the KJ queue (+ order)
  await upsertFreeOrder(freeEvent._id, ks._id);
  await upsertRegistration({
    eventId: freeEvent._id,
    userId: ks._id,
    registrationType: "registered",
    status: "pending",
    songRequests: ["Bohemian Rhapsody"],
    groupSize: 2,
    registeredAt: new Date(),
  });

  // 2) Auto-approve event -> ticket holder approved instantly
  await upsertFreeOrder(autoEvent._id, ks._id);
  await upsertRegistration({
    eventId: autoEvent._id,
    userId: ks._id,
    registrationType: "registered",
    status: "approved",
    songRequests: ["Sweet Caroline"],
    groupSize: 1,
    registeredAt: new Date(),
    approvedAt: new Date(),
  });

  // 3) Interested in the paid event (no ticket yet)
  await upsertRegistration({
    eventId: paidEvent._id,
    userId: ks._id,
    registrationType: "interested",
    status: "interested",
    songRequests: [],
    groupSize: 1,
    registeredAt: new Date(),
  });
  summary.registrations = "KS: 1 pending (KJ queue) · 1 auto-approved · 1 interested";

  // ---- Notification for the KJ (bell demo) ----
  const existingNotif = await Notification.findOne({
    userId: "demo_kj",
    type: "registration",
    "data.eventId": freeEvent._id.toString(),
  });
  if (!existingNotif) {
    await Notification.create({
      userId: "demo_kj",
      type: "registration",
      title: "New singer awaiting approval",
      message: `Demo Singer Sam got a ticket for "${freeEvent.title}". Review their registration in your KJ dashboard.`,
      data: { eventId: freeEvent._id.toString() },
    });
  }
  summary.notification = "1 pending-approval notification for demo_kj";

  return summary;
}

/** Removes everything the demo seed created (matches demo clerk ids). */
export async function clearDemoData() {
  await connectToDatabase();

  const demoUsers = await User.find({
    clerkId: { $in: ["demo_promoter", "demo_kj", "demo_ks"] },
  });
  const userIds = demoUsers.map((u) => u._id);

  const events = await Event.find({ kj: { $in: userIds } });
  const eventIds = events.map((e) => e._id);

  await EventRegistration.deleteMany({
    $or: [{ eventId: { $in: eventIds } }, { userId: { $in: userIds } }],
  });
  await Order.deleteMany({ buyer: { $in: userIds } });
  await Notification.deleteMany({
    userId: { $in: ["demo_promoter", "demo_kj", "demo_ks"] },
  });
  await Event.deleteMany({ _id: { $in: eventIds } });
  await Venue.deleteMany({ ownedBy: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });

  return { removedUsers: demoUsers.length, removedEvents: events.length };
}
