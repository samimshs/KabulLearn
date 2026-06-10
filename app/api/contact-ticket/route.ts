import { NextResponse } from "next/server";
import { sendTicketConfirmationEmail } from "@/lib/email-verification";

const MAX_FILE_BYTES = 3 * 1024 * 1024;

function generateTicketNumber(): string {
  return `KL-${String(Math.floor(100000 + Math.random() * 900000))}`;
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

  // Timing — less than 5 seconds between page load and submit = bot
  const loadedAt = Number(body.get("_t") ?? 0);
  if (!loadedAt || Date.now() - loadedAt < 5000) {
    return NextResponse.json(
      { ok: false, error: "Please take a moment to review your message before submitting." },
      { status: 429 }
    );
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  let screenshotBase64: string | null = null;
  let screenshotName: string | null   = null;
  let screenshotMime: string | null   = null;

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ ok: false, error: "Screenshot must be under 3 MB." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Screenshot must be an image file." }, { status: 400 });
    }
    screenshotBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    screenshotName   = file.name;
    screenshotMime   = file.type;
  }

  const ticketNumber = generateTicketNumber();
  const scriptUrl    = process.env.GOOGLE_APPS_SCRIPT_URL;
  const scriptSecret = process.env.APPS_SCRIPT_SECRET;

  console.log("[ticket] screenshot included:", !!screenshotBase64, screenshotName, screenshotMime);

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
          console.log("[ticket] Apps Script status:", r.status, "body:", text);
          return text;
        })
      : Promise.resolve(),
    sendTicketConfirmationEmail({ email, name, ticketNumber, issueType, subject }),
  ]);
  console.log("[ticket] script:", scriptResult.status);
  console.log("[ticket] email:", emailResult.status, emailResult.status === "rejected" ? emailResult.reason : "");

  return NextResponse.json({ ok: true, ticketNumber });
}
