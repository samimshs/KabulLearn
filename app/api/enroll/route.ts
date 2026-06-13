import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { CourseStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const enrollSchema = z.object({
  courseId: z.string().min(1)
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in to enroll." },
      { status: 401 }
    );
  }

  if (session.user.role !== UserRole.STUDENT && session.user.role !== UserRole.EDUCATOR) {
    return NextResponse.json(
      { ok: false, error: "Only student and educator accounts can enroll in courses." },
      { status: 403 }
    );
  }

  let courseId = "";

  try {
    const body = await request.json();
    courseId = enrollSchema.parse(body).courseId;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid enrollment request." },
      { status: 400 }
    );
  }

  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { status: true, publishedAt: true, isPaid: true }
    });

    if (!course || (course.status !== CourseStatus.PUBLISHED && !course.publishedAt)) {
      return NextResponse.json(
        { ok: false, error: "Course not found or not available." },
        { status: 404 }
      );
    }

    if (course.isPaid) {
      return NextResponse.json(
        { ok: false, error: "This is a paid course. Complete checkout to enroll." },
        { status: 402 }
      );
    }

    const enrollment = await db.enrollment.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      update: {},
      create: { userId: session.user.id, courseId }
    });

    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/dashboard");

    return NextResponse.json({
      ok: true,
      data: { enrollmentId: enrollment.id }
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { ok: false, error: "Could not enroll right now. Please try again." },
      { status: 500 }
    );
  }
}
