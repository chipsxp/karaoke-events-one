/**
 * Seed the demo chain-of-command dataset into the configured MONGODB_URI.
 * Idempotent — safe to run repeatedly.
 *
 * Usage:
 *   npm run seed:demo             (seed demo data)
 *   npm run seed:demo -- --clear  (remove demo data)
 *
 * MONGODB_URI comes from the environment or .env.local
 */
import { readFileSync, existsSync } from "node:fs";

async function main() {
  if (!process.env.MONGODB_URI) {
    for (const file of [".env.local", ".env"]) {
      if (existsSync(file)) {
        const line = readFileSync(file, "utf8")
          .split("\n")
          .find((l) => l.trim().startsWith("MONGODB_URI="));
        if (line) {
          process.env.MONGODB_URI = line
            .split("=")
            .slice(1)
            .join("=")
            .trim()
            .replace(/^["']|["']$/g, "");
        }
      }
    }
  }
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set (env var or .env.local)");
    process.exit(1);
  }

  const { seedDemoData, clearDemoData } = await import("../lib/seed-demo");

  if (process.argv.includes("--clear")) {
    const result = await clearDemoData();
    console.log("Cleared demo data:", result);
  } else {
    const summary = await seedDemoData();
    console.log("Seeded demo data:");
    for (const [key, value] of Object.entries(summary)) {
      console.log(` - ${key}: ${value}`);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
