import { describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";

// rbac.ts imports auth which pulls in next-auth server modules — mock them
vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { canManageCourse } from "@/lib/rbac";

describe("RBAC helpers", () => {
  it("allows the course author or an admin to manage a course", () => {
    expect(
      canManageCourse({ requesterId: "author-1", requesterRole: UserRole.STUDENT, authorId: "author-1" })
    ).toBe(true);

    expect(
      canManageCourse({ requesterId: "editor-1", requesterRole: UserRole.ADMIN, authorId: "author-1" })
    ).toBe(true);
  });

  it("prevents a different student from managing the course", () => {
    expect(
      canManageCourse({ requesterId: "student-1", requesterRole: UserRole.STUDENT, authorId: "author-1" })
    ).toBe(false);
  });
});
