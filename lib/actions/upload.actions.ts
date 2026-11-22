"use server";

import { auth } from "@clerk/nextjs/server";

// Max image size the server will accept (bytes) — matches the old UploadThing 4MB limit.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type UploadResult = {
  url: string;
  error?: string;
};

// Client-side image upload without an external upload service.
// The browser reads the file as a base64 data URL and posts it here; we
// validate it server-side and return the same data URL to store on the
// event (Mongo handles a few MB of base64 without issue).
export async function uploadImage(dataUrl: string): Promise<UploadResult> {
  const { userId } = await auth();
  if (!userId) return { url: "", error: "Unauthorized" };

  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return { url: "", error: "Invalid image format" };

  const [, mimeType, base64] = match;
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return { url: "", error: `Unsupported image type: ${mimeType}` };
  }

  // Approximate byte size from base64 length
  const byteSize = Math.floor(base64.length * 0.75);
  if (byteSize > MAX_IMAGE_BYTES) {
    return { url: "", error: "Image exceeds 4MB limit" };
  }

  return { url: dataUrl };
}
