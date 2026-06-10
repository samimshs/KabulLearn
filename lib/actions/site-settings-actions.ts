"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const saveSchema = z.object({
  key: z.string().min(1),
  value: z.string().trim().max(500)
});

/** Returns all site video settings as a key→value map. Safe to call from any server component. */
export async function getSiteVideoUrls(): Promise<Record<string, string>> {
  const rows = await db.siteSetting.findMany({
    where: { key: { startsWith: "video:" } }
  }).catch(() => []);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function saveSiteVideoUrl(input: z.infer<typeof saveSchema>): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { key, value } = saveSchema.parse(input);

    if (value) {
      await db.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value }
      });
    } else {
      await db.siteSetting.deleteMany({ where: { key } });
    }

    revalidatePath("/admin");
    revalidatePath("/learner-support");
    revalidatePath("/educator-resources");
    revalidatePath("/certificate-verification");
    revalidatePath("/catalog");
    revalidatePath("/educator-guidelines");

    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
    if (error instanceof Error) return { ok: false, error: error.message };
    return { ok: false, error: "Something went wrong." };
  }
}
