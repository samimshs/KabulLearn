import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SUBJECT = "Come back and keep your streak alive 🔥";
const COOL_OFF_DAYS = 5; // don't re-email the same user within 5 days

async function sendReEngagementEmail(to: string, name: string, streak: number): Promise<boolean> {
  const apiKey    = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) return false;

  const firstName = name.split(" ")[0] || "there";
  const streakLine = streak > 1
    ? `<p style="color:#0057FF;font-size:15px;font-weight:700;margin:0 0 12px">You had a <strong>${streak}-day streak</strong> going. Don't let it slip away!</p>`
    : `<p style="color:#555;font-size:15px;margin:0 0 12px">Your next lesson is waiting. Pick up where you left off.</p>`;

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f5f7fa;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0057FF,#0E7490);padding:28px 28px 22px;color:#fff">
      <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;opacity:0.7">KabulLearn</p>
      <h1 style="margin:0;font-size:24px;font-weight:800;line-height:1.25">Hey ${firstName}, we miss you!</h1>
    </div>
    <div style="padding:24px 28px">
      ${streakLine}
      <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 20px">Learning just a few minutes a day is enough to make real progress. Your courses are right where you left them.</p>
      <a href="https://kabullearn.com/dashboard" style="display:inline-block;background:#0057FF;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700">Continue Learning →</a>
      <p style="color:#94a3b8;font-size:12px;margin:20px 0 0;line-height:1.5">You're receiving this because you're enrolled on KabulLearn. <a href="https://kabullearn.com/dashboard/settings" style="color:#94a3b8">Manage preferences</a></p>
    </div>
  </div></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromEmail, to, subject: SUBJECT, html })
  });

  return res.ok;
}

export async function GET(request: Request) {
  // Validate cron secret — Vercel sets Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const twoDaysAgo = new Date();
  twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
  twoDaysAgo.setUTCHours(0, 0, 0, 0);

  const threeDaysAgo = new Date();
  threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
  threeDaysAgo.setUTCHours(0, 0, 0, 0);

  const coolOffCutoff = new Date();
  coolOffCutoff.setUTCDate(coolOffCutoff.getUTCDate() - COOL_OFF_DAYS);

  // Find users who were last active exactly 2 days ago (48–72h window)
  const candidates = await db.userStreak.findMany({
    where: {
      lastActiveDate: { gte: threeDaysAgo, lte: twoDaysAgo }
    },
    include: { user: { select: { id: true, name: true, email: true, status: true } } },
    take: 200
  });

  let sent = 0;
  let skipped = 0;

  for (const row of candidates) {
    const { user, currentStreak } = row;
    if (user.status !== "ACTIVE") { skipped++; continue; }

    // Check cool-off: did we already send a re-engagement email recently?
    const recent = await db.notificationLog.findFirst({
      where: { email: user.email, subject: SUBJECT, createdAt: { gte: coolOffCutoff } }
    });
    if (recent) { skipped++; continue; }

    const ok = await sendReEngagementEmail(user.email, user.name ?? "Learner", currentStreak);

    await db.notificationLog.create({
      data: {
        email: user.email,
        subject: SUBJECT,
        body: `streak=${currentStreak}`,
        status: ok ? "SENT" : "FAILED",
        sentAt: ok ? new Date() : null
      }
    });

    if (ok) sent++; else skipped++;
  }

  return NextResponse.json({ sent, skipped, candidates: candidates.length });
}
