// Runtime test for the Phase 1 migration script.
// Spins up an in-memory MongoDB, seeds LEGACY-shaped data (host/organizer on
// events, pre-roleSelected users), runs scripts/migrate-phase1.mjs against it,
// and asserts the migrated shape.
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId } from "mongodb";
import { execFileSync } from "node:child_process";

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();
console.log("In-memory MongoDB at", uri);

const client = new MongoClient(uri);
await client.connect();
const db = client.db("karaoke-events");

const promoterId = new ObjectId();
const kjId = new ObjectId();
const ksId = new ObjectId();
const catId = new ObjectId();
const evId = new ObjectId();

// Legacy users (no roleSelected/verifiedBy/pendingVerification fields)
await db.collection("users").insertMany([
  { clerkId: "clerk_promoter", role: "Promoter", isPromoter: true, promoterVerificationStatus: "pending", firstName: "Pam", lastName: "Promoter", emailId: "p@x.com", userName: "pam", photoAvatar: "d.png" },
  { clerkId: "clerk_kj", role: "KJ", isHost: true, kjVerificationStatus: "pending", firstName: "Kyle", lastName: "KJ", emailId: "k@x.com", userName: "kyle", photoAvatar: "d.png" },
  { clerkId: "clerk_ks", role: "KS", firstName: "Sam", lastName: "Singer", emailId: "s@x.com", userName: "sam", photoAvatar: "d.png" },
]);

// Legacy event: host == organizer == creator (kjId), no status
await db.collection("events").insertOne({
  _id: evId,
  title: "Legacy Karaoke Night",
  description: "desc",
  location: "Old Bar",
  category: catId,
  host: kjId,
  organizer: kjId,
  capacity: 50,
  price: 10,
  isFree: false,
  startDateTime: new Date(),
  endDateTime: new Date(),
  createdAt: new Date(),
});

await db.collection("eventregistrations").insertOne({
  eventId: evId,
  userId: ksId,
  registrationType: "registered",
  status: "pending",
});

// Run the migration script against the in-memory db
const out = execFileSync("node", ["scripts/migrate-phase1.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, MONGODB_URI: uri },
  encoding: "utf8",
});
console.log(out);

// ===== Assertions =====
let failures = 0;
const assert = (cond, msg) => {
  if (cond) console.log("  PASS:", msg);
  else { failures++; console.error("  FAIL:", msg); }
};

const ev = await db.collection("events").findOne({ _id: evId });
assert(ev.kj && ev.kj.equals(kjId), "event.host renamed to event.kj");
assert(ev.host === undefined, "event.host removed");
assert(ev.promoter === null, "legacy promoter==kj nulled out");
assert(ev.organizer === undefined, "event.organizer removed");
assert(ev.status === "published", "legacy event published");

const promoter = await db.collection("users").findOne({ clerkId: "clerk_promoter" });
assert(promoter.roleSelected === true, "promoter roleSelected=true");
assert(promoter.promoterVerificationStatus === "verified", "promoter auto-verified (top of chain)");
assert(promoter.pendingVerification === false, "promoter pendingVerification=false");

const kj = await db.collection("users").findOne({ clerkId: "clerk_kj" });
assert(kj.roleSelected === true, "kj roleSelected=true");
assert(kj.pendingVerification === true, "kj pendingVerification mirrors 'pending' status");

const ks = await db.collection("users").findOne({ clerkId: "clerk_ks" });
assert(ks.roleSelected === true, "ks roleSelected=true");
assert(ks.pendingVerification === false, "ks pendingVerification=false");

// Idempotency: run migration again, ensure no errors and stable results
const out2 = execFileSync("node", ["scripts/migrate-phase1.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, MONGODB_URI: uri },
  encoding: "utf8",
});
const ev2 = await db.collection("events").findOne({ _id: evId });
assert(out2.includes("Phase 1 migration complete.") && ev2.kj.equals(kjId) && ev2.status === "published", "migration is idempotent on re-run");

await client.close();
await mongod.stop();

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nALL MIGRATION ASSERTIONS PASSED");
