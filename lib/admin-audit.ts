import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type AuditInput = {
  actorId: string;
  action: string;
  targetId?: string | null;
  targetType?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAdminAudit(input: AuditInput) {
  await db.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetId: input.targetId ?? null,
      targetType: input.targetType ?? null,
      metadata: input.metadata ?? undefined
    }
  });
}
