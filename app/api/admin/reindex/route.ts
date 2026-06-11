import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { openai, EMBED_MODEL } from "@/lib/openai";
import { getPublicInfoContent } from "@/lib/info-translations";

// Hardcoded platform guide chunks covering common student + educator questions
const PLATFORM_GUIDES = [
  {
    key: "guide-registration",
    title: "How to create an account on KabulLearn",
    text: `KabulLearn Account Registration Guide

To create a free account on KabulLearn:
1. Go to kabullearn.com and click "Register Free" in the top navigation.
2. Enter your full name, email address, and a password.
3. Click "Create account". You will be registered as a Student by default.
4. After registering, you can browse courses, enroll for free, and track your progress.

You can also sign in with Google if you prefer not to use a password.
If you forget your password, use the "Forgot password" link on the login page.`
  },
  {
    key: "guide-login",
    title: "How to sign in and manage your account",
    text: `Signing in to KabulLearn

To sign in, click "Sign in" in the top navigation and enter your email and password.
If you registered with Google, click "Continue with Google".

Your account menu (top-right avatar) lets you:
- Access your student portal or educator portal
- View your enrolled courses and progress
- Download certificates you have earned
- Update your profile settings
- Change your language preference (English, Pashto, Dari)
- Sign out

If you cannot sign in, check your email address and password. Use "Forgot password" to reset it.`
  },
  {
    key: "guide-enroll",
    title: "How to enroll in a course",
    text: `Enrolling in Courses on KabulLearn

All courses on KabulLearn are free to enroll in.

To enroll:
1. Browse the course catalog at kabullearn.com/courses.
2. Click on a course to view its details.
3. Click "Enroll for free".
4. Once enrolled, you can access all lessons, quizzes, and earn a certificate.

The first lesson of every course is a free preview — you can watch it without enrolling.
After enrolling, your progress is saved automatically as you complete lessons and pass quizzes.`
  },
  {
    key: "guide-certificate",
    title: "How to earn and download a certificate",
    text: `Certificates on KabulLearn

To earn a certificate:
1. Enroll in a course.
2. Complete all lessons (video and reading lessons).
3. Pass the required quiz at the end of each module.
4. Once you pass all module quizzes, a certificate is automatically generated.

To download your certificate:
- Go to your Dashboard > My Courses.
- Click on the completed course and select "Download Certificate".
- Certificates are issued as PDF files with your name, course title, and a unique verification code.

Certificate verification: Anyone can verify a certificate by entering the verification code at kabullearn.com/verify.`
  },
  {
    key: "guide-become-educator",
    title: "How to become an educator and create courses",
    text: `Becoming an Educator on KabulLearn

To become an educator:
1. First create a student account at kabullearn.com/register.
2. Go to your account settings or the homepage and request educator access.
3. An admin will review and approve your request. You will receive a notification.
4. Once approved, your account is upgraded to Educator and you can access the Educator Portal.

Creating a course:
1. In the Educator Portal, click "New course".
2. Fill in the course title, description, and level (Beginner/Intermediate/Advanced).
3. Add modules and lessons inside each module.
4. Lessons can be Video lessons (YouTube URL) or Reading lessons (text/markdown content).
5. Add a Quiz lesson at the end of each module — this is required for student progression and certificates.
6. Submit your course for admin review when ready. Once approved it will be published.

You can add course content in English, Pashto, and Dari.`
  },
  {
    key: "guide-progress",
    title: "How lesson progress and module unlocking works",
    text: `Progress Tracking and Module Unlocking on KabulLearn

KabulLearn tracks your progress automatically:
- Watching a video lesson and clicking "Mark as complete" marks it done.
- Reading a reading lesson and clicking "Mark as complete" marks it done.
- Passing the quiz at the end of a module unlocks the next module.

Module gating: You must pass the quiz of the current module before accessing the next one.
Your progress is saved to your account so you can continue from where you left off on any device.

Quizzes: Each module ends with a required quiz. You need to reach the passing score to proceed.
If you fail a quiz you can retake it.`
  },
  {
    key: "guide-language",
    title: "Language support — English, Pashto, Dari",
    text: `Language Support on KabulLearn

KabulLearn supports three languages: English (EN), Pashto (پښتو), and Dari (دری).

To switch language: use the language toggle in the top navigation bar (EN / پښ / دری).
The interface, course content, and all pages will switch to your chosen language.
Pashto and Dari are displayed right-to-left (RTL) automatically.

Course content is available in the languages the educator has added. If a course has Pashto
or Dari content, it will display in your chosen language automatically.`
  },
  {
    key: "guide-sitemap",
    title: "KabulLearn page links and URLs",
    text: `KabulLearn Page Directory — Links and URLs

Below is a complete list of pages on KabulLearn and their direct links.

PUBLIC PAGES (no login required):
- Homepage: https://kabullearn.com/
- Course catalog (all courses): https://kabullearn.com/courses
- Register (create account): https://kabullearn.com/register
- Sign in (login): https://kabullearn.com/login
- Terms of Service: https://kabullearn.com/terms
- Privacy Policy: https://kabullearn.com/privacy
- Certificate verification: https://kabullearn.com/verify

STUDENT PAGES (login required):
- Student dashboard / My Courses: https://kabullearn.com/dashboard
- A specific course page: https://kabullearn.com/courses/[course-id]
- A specific lesson: https://kabullearn.com/courses/[course-id]/lessons/[lesson-id]

EDUCATOR PAGES (educator account required):
- Educator portal: https://kabullearn.com/educator
- Manage courses: https://kabullearn.com/educator/courses
- Create new course: https://kabullearn.com/educator/courses/new

CONTACT & SUPPORT:
- Email: info@kabulhub.com
- Website: https://kabullearn.com
- Operated by: KabulHub LLC`
  }
];

async function upsertEmbedding(
  source: string,
  sourceKey: string,
  title: string,
  text: string
) {
  const response = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000)
  });
  const vector = response.data[0].embedding;

  await db.contentEmbedding.upsert({
    where: { source_sourceKey: { source, sourceKey } },
    create: { source, sourceKey, title, chunkText: text.slice(0, 4000), embedding: JSON.stringify(vector) },
    update: { title, chunkText: text.slice(0, 4000), embedding: JSON.stringify(vector) }
  });
}

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set in environment variables" }, { status: 500 });
  }

  const counts = { lessons: 0, courses: 0, policy: 0, guides: 0 };

  try {

  // ── 1. Lessons ────────────────────────────────────────────────
  const lessons = await db.lesson.findMany({
    where: { type: { not: "QUIZ" } },
    select: {
      id: true,
      titleEn: true,
      descriptionEn: true,
      readingEn: true,
      module: { select: { titleEn: true, course: { select: { titleEn: true } } } }
    }
  });

  for (const lesson of lessons) {
    const text = [
      `Course: ${lesson.module.course.titleEn}`,
      `Module: ${lesson.module.titleEn}`,
      `Lesson: ${lesson.titleEn}`,
      lesson.descriptionEn ?? "",
      lesson.readingEn ?? ""
    ].filter(Boolean).join("\n\n");

    if (!text.trim()) continue;
    await upsertEmbedding("lesson", lesson.id, lesson.titleEn, text);
    counts.lessons++;
  }

  // ── 2. Courses ────────────────────────────────────────────────
  const courses = await db.course.findMany({
    select: { id: true, titleEn: true, descriptionEn: true, level: true }
  });

  for (const course of courses) {
    const text = [
      `Course: ${course.titleEn}`,
      course.level ? `Level: ${course.level}` : "",
      course.descriptionEn
    ].filter(Boolean).join("\n\n");

    await upsertEmbedding("course", course.id, course.titleEn, text);
    counts.courses++;
  }

  // ── 3. Terms of Service + Privacy Policy ─────────────────────
  const info = getPublicInfoContent("en");

  for (let i = 0; i < info.terms.sections.length; i++) {
    const section = info.terms.sections[i];
    const paragraphs = section.paragraphs?.join("\n\n") ?? "";
    const bullets = section.bullets?.join("\n") ?? "";
    const text = `Terms of Service — ${section.title}\n\n${paragraphs}${bullets ? "\n\n" + bullets : ""}`;
    await upsertEmbedding("terms", `section-${i}`, `Terms: ${section.title}`, text);
    counts.policy++;
  }

  for (let i = 0; i < info.privacy.sections.length; i++) {
    const section = info.privacy.sections[i];
    const paragraphs = section.paragraphs?.join("\n\n") ?? "";
    const bullets = section.bullets?.join("\n") ?? "";
    const text = `Privacy Policy — ${section.title}\n\n${paragraphs}${bullets ? "\n\n" + bullets : ""}`;
    await upsertEmbedding("privacy", `section-${i}`, `Privacy: ${section.title}`, text);
    counts.policy++;
  }

  // ── 4. Platform guides ────────────────────────────────────────
  for (const guide of PLATFORM_GUIDES) {
    await upsertEmbedding("guide", guide.key, guide.title, guide.text);
    counts.guides++;
  }

  return NextResponse.json({ ok: true, counts });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[reindex] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
