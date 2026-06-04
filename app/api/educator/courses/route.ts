import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { CourseStatus, Prisma, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createCourseDbSchema } from "@/lib/validators/course";
import type { InstructorInput } from "@/lib/validators/course";

async function upsertInstructors(
  creatorId: string,
  courseId: string,
  instructors: InstructorInput[]
): Promise<{ error?: string; firstProfileId?: string }> {
  const profileIds: string[] = [];

  for (const inst of instructors) {
    const existing = await db.creatorProfile.findUnique({
      where: { username: inst.username },
      select: { id: true, createdById: true }
    });

    if (existing && existing.createdById !== creatorId) {
      return { error: `Username "${inst.username}" is already in use. Choose a different username.` };
    }

    const profile = await db.creatorProfile.upsert({
      where: { username: inst.username },
      update: {
        name: inst.name,
        professionalTitle: inst.title || null,
        bio: inst.bio || null,
        avatarUrl: inst.avatarUrl || null,
        linkedinUrl: inst.linkedinUrl || null,
        youtubeUrl: inst.youtubeUrl || null,
      },
      create: {
        username: inst.username,
        name: inst.name,
        professionalTitle: inst.title || null,
        bio: inst.bio || null,
        avatarUrl: inst.avatarUrl || null,
        linkedinUrl: inst.linkedinUrl || null,
        youtubeUrl: inst.youtubeUrl || null,
        createdById: creatorId,
      },
      select: { id: true }
    });

    profileIds.push(profile.id);
  }

  // Replace all instructor links for this course
  await db.courseInstructor.deleteMany({ where: { courseId } });
  await db.courseInstructor.createMany({
    data: profileIds.map((profileId, order) => ({ courseId, profileId, order }))
  });

  return { firstProfileId: profileIds[0] };
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in to create a course." },
      { status: 401 }
    );
  }

  if (session.user.role !== UserRole.EDUCATOR) {
    return NextResponse.json(
      { ok: false, error: "Only educators can create courses." },
      { status: 403 }
    );
  }

  const parsed = createCourseDbSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Check the highlighted fields and try again.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const course = await db.course.create({
      data: {
        ...parsed.data.course,
        authorId: session.user.id,
        status: CourseStatus.DRAFT
      },
      select: { id: true }
    });

    const result = await upsertInstructors(session.user.id, course.id, parsed.data.instructors);
    if (result.error) {
      await db.course.delete({ where: { id: course.id } });
      return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
    }

    // Set primary author for legacy routing
    await db.course.update({
      where: { id: course.id },
      data: { authorProfileId: result.firstProfileId }
    });

    revalidatePath("/educator");

    return NextResponse.json({ ok: true, data: { courseId: course.id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        {
          ok: false,
          error: "Check the highlighted fields and try again.",
          fieldErrors: { slug: ["That slug is already used. Choose a unique slug like basic-computer-skills-2."] }
        },
        { status: 409 }
      );
    }

    console.error("Course creation error:", error);
    return NextResponse.json(
      { ok: false, error: "Could not create the course right now. Please try again." },
      { status: 500 }
    );
  }
}
