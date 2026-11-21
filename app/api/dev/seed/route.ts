import { NextResponse } from "next/server";
import { seedDemoData, clearDemoData } from "@/lib/seed-demo";

// Dev/ops endpoint to seed (or clear) the demo dataset over HTTPS — used for
// Railway deployment testing where direct DB access isn't available.
// DISABLED unless the SEED_SECRET env var is set; requires the secret via
// `x-seed-secret` header or `?secret=` query param. Remove SEED_SECRET from
// the environment when done and this route becomes a hard 404.

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const secret = process.env.SEED_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  const provided =
    req.headers.get("x-seed-secret") || url.searchParams.get("secret") || "";
  return provided === secret;
}

export async function POST(req: Request) {
  if (!process.env.SEED_SECRET) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const mode = new URL(req.url).searchParams.get("mode") || "seed";
  try {
    if (mode === "clear") {
      const result = await clearDemoData();
      return NextResponse.json({ ok: true, mode, result });
    }
    const summary = await seedDemoData();
    return NextResponse.json({ ok: true, mode, summary });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
