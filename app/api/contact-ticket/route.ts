import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { sendTicketConfirmationEmail } from "@/lib/email-verification";
import { assertRateLimit } from "@/lib/security";

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIN_FORM_AGE_MS = 1500;

function generateTicketNumber(): string {
  return `KL-${String(randomInt(100000, 1000000))}`;
}

function detectMimeFromBytes(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

export async function POST(request: Request) {
  let body: FormData;
  try {
    body = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — bots fill this, humans leave it empty
  const honeypot = body.get("_hp") as string | null;
  if (honeypot) {
    // Silently accept so bots don't know they were caught
    return NextResponse.json({ ok: true, ticketNumber: "KL-000000" });
  }
  const loadedAt = Number(body.get("_t") || 0);
  if (!Number.isFinite(loadedAt) || Date.now() - loadedAt < MIN_FORM_AGE_MS) {
    return NextResponse.json({ ok: true, ticketNumber: "KL-000000" });
  }

  const name        = (body.get("name")        as string | null)?.trim() ?? "";
  const email       = (body.get("email")       as string | null)?.trim() ?? "";
  const issueType   = (body.get("issueType")   as string | null)?.trim() ?? "";
  const subject     = (body.get("subject")     as string | null)?.trim() ?? "";
  const description = (body.get("description") as string | null)?.trim() ?? "";
  const file        = body.get("screenshot")   as File | null;

  if (!name || !email || !issueType || !subject || !description) {
    return NextResponse.json({ ok: false, error: "Please fill in all required fields." }, { status: 400 });
  }
  if (name.length > 120 || issueType.length > 80 || subject.length > 180 || description.length > 3000) {
    return NextResponse.json({ ok: false, error: "Please shorten your message and try again." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  try {
    await Promise.all([
      assertRateLimit(`contact-ticket:${email.toLowerCase()}`, 3),
      assertRateLimit(`contact-ticket-ip:${ip}`, 10)
    ]);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let screenshotBase64: string | null = null;
  let screenshotName: string | null   = null;
  let screenshotMime: string | null   = null;

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ ok: false, error: "Screenshot must be under 3 MB." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectMimeFromBytes(new Uint8Array(buffer));
    if (!detectedMime || !ALLOWED_IMAGE_MIME.has(detectedMime)) {
      return NextResponse.json({ ok: false, error: "Screenshot must be a JPG, PNG, or WebP image." }, { status: 400 });
    }
    screenshotBase64 = buffer.toString("base64");
    screenshotName   = file.name;
    screenshotMime   = detectedMime;
  }

  const ticketNumber = generateTicketNumber();
  const scriptUrl    = process.env.GOOGLE_APPS_SCRIPT_URL;
  const scriptSecret = process.env.APPS_SCRIPT_SECRET;

  if (scriptUrl && !scriptSecret) {
    return NextResponse.json({ ok: false, error: "Support ticket integration is not configured." }, { status: 503 });
  }

  // Sheet write and email run in parallel — neither blocks the other
  const [scriptResult, emailResult] = await Promise.allSettled([
    scriptUrl
      ? fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: scriptSecret,
            ticketNumber,
            name,
            email,
            issueType,
            subject,
            description,
            screenshot:     screenshotBase64,
            screenshotName,
            screenshotMime,
          }),
          redirect: "follow",
        }).then(async (r) => {
          const text = await r.text();
          if (!r.ok) console.error("[ticket] Apps Script failed:", r.status);
          return text.slice(0, 120);
        })
      : Promise.resolve(),
    sendTicketConfirmationEmail({ email, name, ticketNumber, issueType, subject }),
  ]);
  if (scriptResult.status === "rejected") console.error("[ticket] script failed");
  if (emailResult.status === "rejected") console.error("[ticket] email failed");

  return NextResponse.json({ ok: true, ticketNumber });
}
