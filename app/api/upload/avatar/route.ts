import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertRateLimit } from "@/lib/security";

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function detectMimeFromBytes(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  // WebP: RIFF????WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image upload is not configured on this server. Add BLOB_READ_WRITE_TOKEN to .env.local." },
      { status: 503 }
    );
  }
  try {
    await assertRateLimit(`avatar-upload:${session.user.id}`, 10);
  } catch {
    return NextResponse.json({ error: "Too many uploads. Please wait a moment and try again." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file") as File | null;

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, and WebP images are accepted." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be under 3 MB." }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const detectedMime = detectMimeFromBytes(new Uint8Array(buffer));
  if (!detectedMime || !ALLOWED.has(detectedMime)) {
    return NextResponse.json({ error: "File content does not match an accepted image format." }, { status: 400 });
  }

  const ext = detectedMime.split("/")[1].replace("jpeg", "jpg");
  const filename = `avatars/${session.user.id}-${Date.now()}.${ext}`;

  let blob;
  try {
    blob = await put(filename, buffer, { access: "public", contentType: detectedMime });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed.";
    console.error("Blob upload error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ url: blob.url });
}
