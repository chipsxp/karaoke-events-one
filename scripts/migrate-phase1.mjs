#!/usr/bin/env node
/**
 * Phase 1 migration — role vocabulary + chain of command.
 *
 * What it does (idempotent, safe to re-run):
 *  1. events: rename `host`      -> `kj`       (KJ = event host/director)
 *  2. events: rename `organizer` -> `promoter` (Promoter = venue owner/location host)
 *  3. events: null out `promoter` when it equals `kj` (legacy: creator was both)
 *  4. events: publish legacy events (missing/draft status -> "published",
 *     since they were publicly listed before)
 *  5. users:  mark all existing users as roleSelected (they predate the flag)
 *  6. users:  Promoters -> promoterVerificationStatus "verified" (top of chain)
 *  7. users:  sync pendingVerification for KJs, clear for KS/Promoter
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node scripts/migrate-phase1.mjs
 * or just `npm run migrate:phase1` with MONGODB_URI in .env.local / env.
 */
import { readFileSync, existsSync } from "node:fs";
import { MongoClient } from "mongodb";

function resolveMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) {
      const line = readFileSync(file, "utf8")
        .split("\n")
        .find((l) => l.trim().startsWith("MONGODB_URI="));
      if (line) return line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
  throw new Error("MONGODB_URI not set (env var or .env.local)");
}

const uri = resolveMongoUri();
const client = new MongoClient(uri);

async function main() {
  await client.connect();
  const db = client.db("karaoke-events");
  const events = db.collection("events");
  const users = db.collection("users");
  console.log(`Connected. Migrating db "karaoke-events"...`);

  // 1. events.host -> events.kj
  const r1 = await events.updateMany(
    { host: { $exists: true }, kj: { $exists: false } },
    [{ $set: { kj: "$host" } }, { $unset: "host" }]
  );
  console.log(`events host->kj:            ${r1.modifiedCount}`);

  // 2. events.organizer -> events.promoter
  const r2 = await events.updateMany(
    { organizer: { $exists: true }, promoter: { $exists: false } },
    [{ $set: { promoter: "$organizer" } }, { $unset: "organizer" }]
  );
  console.log(`events organizer->promoter: ${r2.modifiedCount}`);

  // 3. promoter == kj (legacy creator was both) -> promoter: null
  const r3 = await events.updateMany(
    { $expr: { $eq: ["$promoter", "$kj"] } },
    { $set: { promoter: null } }
  );
  console.log(`events promoter==kj nulled: ${r3.modifiedCount}`);

  // 4. publish legacy events
  const r4 = await events.updateMany(
    { $or: [{ status: { $exists: false } }, { status: "draft" }] },
    { $set: { status: "published" } }
  );
  console.log(`events published:           ${r4.modifiedCount}`);

  // 5. users: roleSelected for everyone that already exists
  const r5 = await users.updateMany(
    { roleSelected: { $exists: false } },
    { $set: { roleSelected: true } }
  );
  console.log(`users roleSelected=true:    ${r5.modifiedCount}`);

  // 6. Promoters are the top of the chain of command
  const r6 = await users.updateMany(
    { role: "Promoter" },
    { $set: { promoterVerificationStatus: "verified", pendingVerification: false, isPromoter: true } }
  );
  console.log(`users Promoter verified:    ${r6.modifiedCount}`);

  // 7a. KJs: pendingVerification mirrors kjVerificationStatus
  const r7 = await users.updateMany(
    { role: "KJ" },
    [
      {
        $set: {
          isHost: true,
          pendingVerification: { $eq: [{ $ifNull: ["$kjVerificationStatus", "pending"] }, "pending"] },
        },
      },
    ]
  );
  console.log(`users KJ synced:            ${r7.modifiedCount}`);

  // 7b. KS: no account-level verification
  const r8 = await users.updateMany(
    { role: "KS" },
    { $set: { pendingVerification: false } }
  );
  console.log(`users KS synced:            ${r8.modifiedCount}`);

  console.log("Phase 1 migration complete.");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
