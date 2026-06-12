import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CourseStatus } from "@prisma/client";
import { assertRateLimit } from "@/lib/security";
import { dictionaries, type Locale } from "@/lib/i18n";
import { getPublicInfoContent } from "@/lib/info-translations";

type PageResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: string;
};

type ScoredPageResult = PageResult & { score: number };

const locales = ["en", "ps", "fa"] as const;

function normalize(value: string) {
  return value.toLowerCase();
}

function searchTokens(value: string) {
  return normalize(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function matchesQuery(query: string, values: Array<string | null | undefined>) {
  const q = normalize(query);
  const asciiShortQuery = /^[a-z0-9]+$/i.test(q) && q.length <= 2;
  return values.some((value) => {
    if (!value) return false;
    const text = normalize(value);
    if (asciiShortQuery) return searchTokens(text).includes(q);
    return text.includes(q);
  });
}

function scoreQuery(query: string, page: PageResult, values: string[]) {
  const q = normalize(query);
  const title = normalize(page.title);
  const category = normalize(page.category);
  const id = normalize(page.id);
  const href = normalize(page.href);
  let score = 0;

  if (title === q || id === q || href === `/${q}`) score += 100;
  if (title.startsWith(q)) score += 60;
  if (title.includes(q)) score += 35;
  if (category.includes(q)) score += 24;
  if (id.includes(q) || href.includes(q)) score += 18;

  for (const value of values) {
    const text = normalize(value);
    if (text === q) score += 20;
    else if (text.startsWith(q)) score += 12;
    else if (matchesQuery(query, [text])) score += 4;
  }

  return score;
}

function pageKeywords(id: string, locale: Locale) {
  const keywords: Record<Locale, Record<string, string[]>> = {
    en: {
      home: ["homepage", "main page", "start"],
      courses: ["all courses", "course marketplace", "lessons"],
      "learning-paths": ["paths", "roadmap", "skill path", "learning roadmap"],
      catalog: ["course catalog", "categories", "browse"],
      "certificate-verification": ["certificate", "certificates", "verify certificate", "qr code"],
      "learner-support": ["help", "support", "faq", "troubleshooting"],
      contact: ["contact", "email", "message", "support ticket"],
      support: ["donate", "support", "contribute", "sponsor"],
      "for-educators": ["teach", "teacher", "instructor", "educator", "creator"],
      "educator-resources": ["educator guide", "creator guide", "resources", "workflow"],
      "educator-guidelines": ["guidelines", "rules", "quality", "recording", "course creation"],
      terms: ["terms", "rules", "legal", "service terms"],
      privacy: ["privacy", "data", "personal information", "security"],
      login: ["sign in", "signin", "log in", "account"],
      register: ["sign up", "signup", "create account", "join"],
      "forgot-login": ["forgot password", "reset password", "recover account"],
      "request-educator-access": ["request teacher access", "become educator", "become instructor"],
      verify: ["verify", "certificate lookup", "verification code", "qr"]
    },
    ps: {
      home: ["کورپاڼه", "اصلي پاڼه", "کابل لرن", "کابل‌لرن"],
      courses: ["کورسونه", "درسونه", "ټول کورسونه"],
      "learning-paths": ["زده کړې لارې", "لارې", "مهارت لاره"],
      catalog: ["کتلاګ", "د کورسونو کتلاګ", "کټګورۍ"],
      "certificate-verification": ["سند", "سندونه", "د سند تصدیق", "تصدیق"],
      "learner-support": ["مرسته", "ملاتړ", "پوښتنې"],
      contact: ["اړیکه", "برېښنالیک", "پیغام", "ملاتړ ته پیغام"],
      support: ["مرسته", "ملاتړ", "بسپنه"],
      "for-educators": ["استاد", "ښوونکی", "تدریس", "کورس جوړوونکی"],
      "educator-resources": ["د استاد لارښود", "سرچینې", "لارښود"],
      "educator-guidelines": ["لارښوونې", "قواعد", "کیفیت", "ثبت"],
      terms: ["شرایط", "قانوني", "قواعد"],
      privacy: ["محرمیت", "معلومات", "امنیت"],
      login: ["ننوتل", "حساب"],
      register: ["نوملیکنه", "حساب جوړول"],
      "forgot-login": ["پټنوم", "رمز", "حساب بېرته ترلاسه کول"],
      "request-educator-access": ["استاد شم", "د استاد لاسرسی", "د استاد غوښتنه"],
      verify: ["تصدیق", "سند تصدیق", "کوډ"]
    },
    fa: {
      home: ["صفحه اصلی", "کابل لرن", "کابل‌لرن"],
      courses: ["کورس‌ها", "دوره‌ها", "درس‌ها", "همه کورس‌ها", "همه دوره‌ها"],
      "learning-paths": ["مسیرها", "مسیر یادگیری", "راه مهارت"],
      catalog: ["فهرست", "فهرست کورس‌ها", "فهرست دوره‌ها", "دسته‌ها"],
      "certificate-verification": ["گواهی", "سند", "تصدیق گواهی", "تأیید گواهی", "تایید گواهی"],
      "learner-support": ["کمک", "پشتیبانی", "پرسش‌ها"],
      contact: ["تماس", "ایمیل", "پیام", "تماس با پشتیبانی"],
      support: ["حمایت", "کمک", "اهداء"],
      "for-educators": ["استاد", "آموزگار", "تدریس", "سازنده کورس", "سازنده دوره"],
      "educator-resources": ["راهنمای استاد", "منابع", "راهنما"],
      "educator-guidelines": ["رهنمودها", "قواعد", "کیفیت", "ضبط"],
      terms: ["شرایط", "قانونی", "قواعد"],
      privacy: ["رازداری", "محرمیت", "اطلاعات", "امنیت"],
      login: ["ورود", "حساب"],
      register: ["ثبت‌نام", "ثبت نام", "ایجاد حساب"],
      "forgot-login": ["رمز", "پاسورد", "بازیابی حساب"],
      "request-educator-access": ["استاد شم", "درخواست استاد", "دسترسی استاد"],
      verify: ["تایید", "تصدیق", "کد"]
    }
  };
  return keywords[locale][id] ?? [];
}

function pageForLocale(locale: Locale, key: string): ScoredPageResult[] {
  const t = dictionaries[locale];
  const info = getPublicInfoContent(locale);

  return [
    { id: "home", title: t.appName, description: t.heroSubtext, href: "/", category: "Website" },
    { id: "courses", title: t.courses, description: t.exploreToStart, href: "/courses", category: t.searchCourses },
    { id: "learning-paths", title: t.learningPathsTitle, description: t.learningPathsDesc, href: "/learning-paths", category: "Learning paths" },
    { id: "catalog", title: info.catalog.title, description: info.catalog.description, href: "/catalog", category: "Catalog" },
    { id: "certificate-verification", title: info.certificate.title, description: info.certificate.description, href: "/certificate-verification", category: "Certificates" },
    { id: "learner-support", title: info.support.title, description: info.support.description, href: "/learner-support", category: "Support" },
    { id: "contact", title: info.contact.title, description: info.contact.description, href: "/contact", category: "Support" },
    { id: "support", title: info.donate.title, description: info.donate.description, href: "/support", category: "Support" },
    { id: "for-educators", title: info.educators.title, description: info.educators.description, href: "/for-educators", category: t.searchInstructors },
    { id: "educator-resources", title: info.educatorResources.title, description: info.educatorResources.description, href: "/educator-resources", category: "Guides" },
    { id: "educator-guidelines", title: info.educatorGuidelines.title, description: info.educatorGuidelines.description, href: "/educator-guidelines", category: "Guides" },
    { id: "terms", title: info.terms.title, description: info.terms.description, href: "/terms", category: "Policies" },
    { id: "privacy", title: info.privacy.title, description: info.privacy.description, href: "/privacy", category: "Policies" },
    { id: "login", title: t.signIn, description: t.studentSignInTitle, href: "/login", category: "Account" },
    { id: "register", title: t.registerFree, description: t.createFreeStudentAccount, href: "/register", category: "Account" },
    { id: "forgot-login", title: t.forgotLoginTitle, description: t.forgotLoginIntro, href: "/forgot-login", category: "Account" },
    { id: "request-educator-access", title: t.requestEducatorAccess, description: t.requestEducatorIntro, href: "/request-educator-access", category: t.searchInstructors },
    { id: "verify", title: t.verifyOnline, description: info.certificate.verifyDescription, href: "/verify", category: "Certificates" }
  ].map((page) => {
    const searchable = [
      page.title,
      page.description,
      page.category,
      page.href,
      page.id,
      ...pageKeywords(page.id, locale),
      ...(page.id === "terms" ? info.terms.sections.flatMap((section) => [section.title, ...(section.paragraphs ?? []), ...(section.bullets ?? [])]) : []),
      ...(page.id === "privacy" ? info.privacy.sections.flatMap((section) => [section.title, ...(section.paragraphs ?? []), ...(section.bullets ?? [])]) : []),
      ...(page.id === "educator-guidelines" ? [
        info.educatorGuidelines.structureTitle,
        info.educatorGuidelines.recordingTitle,
        info.educatorGuidelines.trilingualTitle,
        info.educatorGuidelines.quizTitle,
        info.educatorGuidelines.ownershipTitle,
        info.educatorGuidelines.checklistTitle,
        ...info.educatorGuidelines.structureItems,
        ...info.educatorGuidelines.recordingItems,
        ...info.educatorGuidelines.trilingualItems,
        ...info.educatorGuidelines.quizItems,
        ...info.educatorGuidelines.checklistItems
      ] : []),
      ...(page.id === "educator-resources" ? [
        info.educatorResources.workflowTitle,
        info.educatorResources.checklistTitle,
        info.educatorResources.guidelinesTitle,
        ...info.educatorResources.steps.flatMap((step) => [step.title, ...(step.paragraphs ?? []), ...(step.bullets ?? [])]),
        ...info.educatorResources.checklist
      ] : [])
    ].filter(Boolean) as string[];
    return { ...page, score: matchesQuery(key, searchable) ? scoreQuery(key, page, searchable) : 0 };
  }).filter((page) => page.score > 0).sort((a, b) => b.score - a.score);
}

function sitePages(query: string): PageResult[] {
  const seen = new Map<string, ScoredPageResult>();
  for (const locale of locales) {
    for (const page of pageForLocale(locale, query)) {
      const current = seen.get(page.id);
      if (!current || page.score > current.score) seen.set(page.id, page);
    }
  }
  return Array.from(seen.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ score: _score, ...page }) => page);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";

  if (!q || q.length < 2) {
    return NextResponse.json({ pages: [], courses: [], lessons: [], creators: [], learningPaths: [] });
  }
  try {
    await assertRateLimit(`search:${ip}`, 60);
  } catch {
    return NextResponse.json({ pages: [], courses: [], lessons: [], creators: [], learningPaths: [] }, { status: 429 });
  }

  const [courses, lessons, creators, learningPaths] = await Promise.allSettled([
    db.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        OR: [
          { titleEn: { contains: q, mode: "insensitive" } },
          { titlePs: { contains: q, mode: "insensitive" } },
          { titleDa: { contains: q, mode: "insensitive" } },
          { descriptionEn: { contains: q, mode: "insensitive" } },
          { descriptionPs: { contains: q, mode: "insensitive" } },
          { descriptionDa: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 5,
      select: { id: true, slug: true, titleEn: true, titlePs: true, titleDa: true, level: true }
    }),
    db.lesson.findMany({
      where: {
        module: { course: { status: CourseStatus.PUBLISHED } },
        OR: [
          { titleEn: { contains: q, mode: "insensitive" } },
          { titlePs: { contains: q, mode: "insensitive" } },
          { titleDa: { contains: q, mode: "insensitive" } },
          { descriptionEn: { contains: q, mode: "insensitive" } },
          { descriptionPs: { contains: q, mode: "insensitive" } },
          { descriptionDa: { contains: q, mode: "insensitive" } },
          { readingEn: { contains: q, mode: "insensitive" } },
          { readingPs: { contains: q, mode: "insensitive" } },
          { readingDa: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 8,
      select: {
        id: true,
        titleEn: true,
        titlePs: true,
        titleDa: true,
        module: {
          select: {
            id: true,
            course: { select: { id: true, slug: true, titleEn: true, titlePs: true, titleDa: true } }
          }
        }
      }
    }),
    db.creatorProfile.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { professionalTitle: { contains: q, mode: "insensitive" } },
          { professionalTitlePs: { contains: q, mode: "insensitive" } },
          { professionalTitleDa: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
          { bioPs: { contains: q, mode: "insensitive" } },
          { bioDa: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 3,
      select: { username: true, name: true, professionalTitle: true, avatarUrl: true }
    }),
    db.learningPath.findMany({
      where: {
        OR: [
          { titleEn: { contains: q, mode: "insensitive" } },
          { titlePs: { contains: q, mode: "insensitive" } },
          { titleDa: { contains: q, mode: "insensitive" } },
          { descriptionEn: { contains: q, mode: "insensitive" } },
          { descriptionPs: { contains: q, mode: "insensitive" } },
          { descriptionDa: { contains: q, mode: "insensitive" } }
        ]
      },
      orderBy: { order: "asc" },
      take: 5,
      select: { slug: true, titleEn: true, titlePs: true, titleDa: true, descriptionEn: true, descriptionPs: true, descriptionDa: true }
    })
  ]);

  return NextResponse.json({
    pages: sitePages(q),
    courses:  courses.status  === "fulfilled" ? courses.value  : [],
    lessons:  lessons.status  === "fulfilled" ? lessons.value  : [],
    creators: creators.status === "fulfilled" ? creators.value : [],
    learningPaths: learningPaths.status === "fulfilled" ? learningPaths.value : []
  });
}
