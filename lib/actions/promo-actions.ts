"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";

const createSchema = z.object({
  code: z.string().min(2).max(30).transform((v) => v.trim().toUpperCase()),
  discountType: z.enum(["PERCENT", "FIXED_CENTS"]),
  discountValue: z.coerce.number().positive(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  courseId: z.string().optional().nullable()
});

export async function createPromoCode(formData: FormData) {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    code: formData.get("code"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    maxUses: formData.get("maxUses") || null,
    expiresAt: formData.get("expiresAt") || null,
    courseId: formData.get("courseId") || null
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid promo code data." };
  }

  const { code, discountType, maxUses, expiresAt, courseId } = parsed.data;
  let { discountValue } = parsed.data;

  if (discountType === "PERCENT") {
    discountValue = Math.round(discountValue);
    if (discountValue < 1 || discountValue > 100) {
      return { ok: false, error: "Percentage discount must be between 1 and 100." };
    }
  } else {
    // convert dollars → cents
    discountValue = Math.round(discountValue * 100);
    if (discountValue < 1) {
      return { ok: false, error: "Fixed discount must be at least $0.01." };
    }
  }

  const existing = await db.promoCode.findUnique({ where: { code } });
  if (existing) {
    return { ok: false, error: `Code "${code}" already exists.` };
  }

  await db.promoCode.create({
    data: {
      code,
      discountType,
      discountValue,
      maxUses: maxUses ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      courseId: courseId || null
    }
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function togglePromoCode(id: string, isActive: boolean) {
  await requireAdmin();
  await db.promoCode.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin");
  return { ok: true };
}

export async function deletePromoCode(id: string) {
  await requireAdmin();
  await db.promoCode.delete({ where: { id } });
  revalidatePath("/admin");
  return { ok: true };
}
