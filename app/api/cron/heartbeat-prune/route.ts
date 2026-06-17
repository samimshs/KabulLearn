import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const RETENTION_DAYS = 90;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);
  cutoff.setUTCHours(0, 0, 0, 0);

  // Aggregate raw heartbeats older than 90 days into daily summaries.
  // ON CONFLICT keeps the highest maxConsumedPct/maxPositionSec seen across runs (idempotent).
  const summarized = await db.$executeRaw`
    INSERT INTO "VideoEngagementSummary"
      (id, "userId", "lessonId", "courseId", "activityDate", "maxConsumedPct", "maxPositionSec", "createdAt", "updatedAt")
    SELECT
      gen_random_uuid(),
      "userId",
      "lessonId",
      "courseId",
      DATE("createdAt")   AS "activityDate",
      MAX("consumedPct")  AS "maxConsumedPct",
      MAX("positionSec")  AS "maxPositionSec",
      NOW(),
      NOW()
    FROM "LessonHeartbeat"
    WHERE "createdAt" < ${cutoff}
    GROUP BY "userId", "lessonId", "courseId", DATE("createdAt")
    ON CONFLICT ("userId", "lessonId", "activityDate") DO UPDATE
      SET
        "maxConsumedPct" = GREATEST(EXCLUDED."maxConsumedPct", "VideoEngagementSummary"."maxConsumedPct"),
        "maxPositionSec" = GREATEST(EXCLUDED."maxPositionSec", "VideoEngagementSummary"."maxPositionSec"),
        "updatedAt"      = NOW()
  `;

  // Delete the raw rows now that they are safely summarized.
  const deleted = await db.$executeRaw`
    DELETE FROM "LessonHeartbeat"
    WHERE "createdAt" < ${cutoff}
  `;

  return NextResponse.json({
    ok: true,
    cutoffDate: cutoff.toISOString(),
    summarizedGroups: summarized,
    deletedRawRows: deleted,
  });
}
