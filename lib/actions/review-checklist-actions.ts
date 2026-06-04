"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";

const checklistSchema = z.object({
  courseId: z.string().min(1),
  label: z.string().trim().min(1).max(160),
  passed: z.boolean(),
  note: z.string().trim().max(1000).optional()
});

export async function saveReviewChecklistItem(input: z.infer<typeof checklistSchema>) {
  await requireAdmin();
  const values = checklistSchema.parse(input);

  const existing = await db.courseReviewChecklistItem.findFirst({
    where: { courseId: values.courseId, label: values.label },
    select: { id: true }
  });

  if (existing) {
    await db.courseReviewChecklistItem.update({
      where: { id: existing.id },
      data: { passed: values.passed, note: values.note || null }
    });
  } else {
    await db.courseReviewChecklistItem.create({
      data: {
        courseId: values.courseId,
        label: values.label,
        passed: values.passed,
        note: values.note || null
      }
    });
  }

  revalidatePath("/admin");
}
