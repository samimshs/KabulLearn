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
  },

  // ── Pashto guides ─────────────────────────────────────────────────────────
  {
    key: "guide-registration-ps",
    title: "د KabulLearn حساب جوړول — ثبت نام",
    text: `د KabulLearn حساب جوړولو لارښود (ثبت نام)

د KabulLearn کې وړیا حساب جوړولو لپاره:
۱. kabullearn.com ته لاړ شئ او د پورتني ناوبر کې «وړیا ثبت نام کړئ» کلیک وکړئ.
۲. خپل بشپړ نوم، ایمیل پته او پاسورډ ولیکئ.
۳. «حساب جوړ کړئ» کلیک وکړئ. تاسو به د زده کونکي (Student) په توګه ثبت شئ.
۴. له ثبت وروسته، کولی شئ کورسونه وګورئ، وړیا شامل شئ، او پرمختیا تعقیب کړئ.

د ګوګل له لارې هم ثبت نام کولی شئ.
که چیرې پاسورډ مو هیر شو، د ننوتلو پاڼه کې «پاسورډ هیر شو» لینک وکاروئ.`
  },
  {
    key: "guide-login-ps",
    title: "د KabulLearn ننوتل — لاګین",
    text: `KabulLearn کې ننوتل (لاګین)

د ننوتلو لپاره، د پورتني ناوبر کې «ننوتل» کلیک کړئ او خپل ایمیل او پاسورډ ولیکئ.
که چیرې د ګوګل له لارې ثبت نام کړی وئ، «ګوګل سره دوام» کلیک وکړئ.

ستاسو د اکاونټ مینو (پورتنۍ خوا اواتار) تاسو ته دا اجازه درکوي:
- د زده کونکي یا ښوونکي پورټل ته لاسرسی
- شامل کورسونه او پرمختیا وګورئ
- سندونه ډاونلوډ کړئ
- ژبه بدل کړئ (انګلیسي، پښتو، دري)
- وتل (لاګ اوټ)`
  },
  {
    key: "guide-enroll-ps",
    title: "د کورس کې شامل کیدل — KabulLearn",
    text: `د KabulLearn کورسونو کې شامل کیدل

د KabulLearn ټول کورسونه وړیا دي.

د شاملیدو لپاره:
۱. د kabullearn.com/courses کورس فهرست وګورئ.
۲. د کورس تفصیلاتو لپاره پرې کلیک وکړئ.
۳. «وړیا شامل شئ» کلیک وکړئ.
۴. له شاملیدو وروسته، ټولې درسونه، ازموینې وکاروئ او سند ترلاسه کړئ.

هر کورس لومړۍ درس د وړیا مخکتنې (preview) لپاره شتون لري — پرته له شاملیدو یې لیدلی شئ.`
  },
  {
    key: "guide-certificate-ps",
    title: "د KabulLearn سند ترلاسه کول او ډاونلوډ",
    text: `د KabulLearn سندونه

د سند ترلاسه کولو لپاره:
۱. کورس کې شامل شئ.
۲. ټولې درسونه (ویدیو او لوستلو درسونه) بشپړ کړئ.
۳. د هر ماډیول پای کې اړینه ازموینه پاس کړئ.
۴. د ټولو ماډیولونو ازموینو پاس کولو وروسته، سند اتوماتیک جوړ کیږي.

د سند ډاونلوډ کولو لپاره:
- Dashboard > My Courses ته لاړ شئ.
- بشپړ شوي کورس کلیک کړئ او «سند ډاونلوډ کړئ» غوره کړئ.
- سندونه د PDF فایل پر بڼه صادریږي.

د سند تصدیق: هر چا کولای شي د کیو آر یا تصدیق کود د kabullearn.com/verify کې سند تصدیق کړي.`
  },
  {
    key: "guide-become-educator-ps",
    title: "څنګه په KabulLearn کې استاد یا کورس جوړوونکی شم",
    text: `په KabulLearn کې استاد یا کورس جوړوونکی کېدل

که غواړئ په KabulLearn کې استاد شئ یا کورس جوړ کړئ:
۱. لومړی په kabullearn.com/register کې وړیا زده کوونکی حساب جوړ کړئ.
۲. له ننوتلو وروسته، د خپل حساب تنظیماتو یا د کورپاڼې له لارې د استاد لاسرسي غوښتنه وکړئ.
۳. اډمین به ستاسو غوښتنه وڅېړي. کله چې غوښتنه ومنل شي، تاسو ته خبرتیا درلېږل کېږي.
۴. له منلو وروسته، ستاسو حساب د استاد حساب ته لوړول کېږي او د Educator Portal ته لاسرسی پیدا کوئ.

د کورس جوړولو لپاره:
۱. په Educator Portal کې «New course» کلیک کړئ.
۲. د کورس سرلیک، تشریح او کچه ولیکئ.
۳. د کورس دننه ماډیولونه او درسونه اضافه کړئ.
۴. درسونه د ویدیو درسونه یا د لوستلو/متن درسونه کېدای شي.
۵. د هر ماډیول په پای کې Quiz lesson اضافه کړئ؛ دا د زده کوونکو پرمختګ او سند لپاره اړین دی.
۶. کله چې کورس چمتو وي، د اډمین کتنې ته یې وسپارئ. له تایید وروسته کورس خپرېږي.

تاسو کولی شئ د کورس محتوا په انګلیسي، پښتو او دري درېواړو ژبو کې اضافه کړئ.`
  },
  {
    key: "guide-language-ps",
    title: "د ژبو ملاتړ — پښتو، دري، انګلیسي",
    text: `د ژبو ملاتړ — KabulLearn

KabulLearn درې ژبې ملاتړ کوي: انګلیسي، پښتو (پښتو) او دري (دری).

د ژبې بدلولو لپاره: د پورتني ناوبر کې د ژبې ټوګل وکاروئ (EN / پښ / دری).
پښتو او دري اتوماتیک د ښي خوا له لوري چپ خوا ته (RTL) ښودل کیږي.

د کورس محتوا د هغو ژبو کې شتون لري چې ښوونکي یې ورزیاتوي.
که کورس پښتو یا دري محتوا ولري، ستاسو د ژبې انتخاب سره به اتوماتیک ښودل شي.`
  },
  {
    key: "guide-progress-ps",
    title: "د KabulLearn درس پرمختیا او ماډیول خلاصول",
    text: `د پرمختیا تعقیب او ماډیول خلاصول — KabulLearn

KabulLearn ستاسو پرمختیا اتوماتیک تعقیبوي:
- د ویدیو درس کتل او «بشپړ شو» کلیک کول یې بشپړ نښه کوي.
- د لوستلو درس لوستل او «بشپړ شو» کلیک کول یې بشپړ نښه کوي.
- د ماډیول پای کې ازموینه پاس کول راتلونکی ماډیول خلاصوي.

ماډیول ګیټینګ: تاسو باید د اوسني ماډیول ازموینه پاس کړئ تر څو راتلونکي ته ورشئ.
ستاسو پرمختیا خوندي کیږي نو کولی شئ له هر وسیله نه ادامه ورکړئ.`
  },

  // ── Dari guides ───────────────────────────────────────────────────────────
  {
    key: "guide-registration-fa",
    title: "ایجاد حساب در KabulLearn — ثبت‌نام",
    text: `راهنمای ایجاد حساب در KabulLearn (ثبت‌نام)

برای ایجاد حساب رایگان در KabulLearn:
۱. به kabullearn.com بروید و روی «ثبت‌نام رایگان» در منوی بالا کلیک کنید.
۲. نام کامل، آدرس ایمیل و رمز عبور خود را وارد کنید.
۳. روی «ایجاد حساب» کلیک کنید. به‌عنوان دانش‌آموز ثبت خواهید شد.
۴. پس از ثبت‌نام، می‌توانید دوره‌ها را مرور، رایگان ثبت‌نام و پیشرفت خود را دنبال کنید.

همچنین می‌توانید با گوگل ثبت‌نام کنید.
اگر رمز عبور خود را فراموش کردید، از لینک «رمز عبور را فراموش کردم» در صفحه ورود استفاده کنید.`
  },
  {
    key: "guide-login-fa",
    title: "ورود به KabulLearn — لاگین",
    text: `ورود به KabulLearn (لاگین)

برای ورود، روی «ورود» در منوی بالا کلیک کنید و ایمیل و رمز عبور خود را وارد کنید.
اگر با گوگل ثبت‌نام کردید، روی «ادامه با گوگل» کلیک کنید.

منوی حساب شما (آواتار بالا-راست) به شما امکان می‌دهد:
- دسترسی به پورتال دانش‌آموز یا پورتال مدرس
- مشاهده دوره‌های ثبت‌نام شده و پیشرفت
- دانلود گواهینامه‌ها
- تغییر زبان (انگلیسی، پشتو، دری)
- خروج از سیستم`
  },
  {
    key: "guide-enroll-fa",
    title: "ثبت‌نام در دوره‌های KabulLearn",
    text: `ثبت‌نام در دوره‌های KabulLearn

همه دوره‌های KabulLearn رایگان هستند.

برای ثبت‌نام:
۱. فهرست دوره‌ها را در kabullearn.com/courses مرور کنید.
۲. روی یک دوره کلیک کنید تا جزئیات را ببینید.
۳. روی «ثبت‌نام رایگان» کلیک کنید.
۴. پس از ثبت‌نام، به همه درس‌ها و آزمون‌ها دسترسی دارید و می‌توانید گواهینامه دریافت کنید.

اولین درس هر دوره پیش‌نمایش رایگان است — می‌توانید بدون ثبت‌نام آن را تماشا کنید.`
  },
  {
    key: "guide-certificate-fa",
    title: "دریافت و دانلود گواهینامه از KabulLearn",
    text: `گواهینامه‌های KabulLearn

برای دریافت گواهینامه:
۱. در یک دوره ثبت‌نام کنید.
۲. همه درس‌ها (ویدیو و خواندنی) را تکمیل کنید.
۳. آزمون الزامی پایان هر ماژول را بگذرانید.
۴. پس از قبولی در همه آزمون‌های ماژول، گواهینامه به‌طور خودکار ایجاد می‌شود.

برای دانلود گواهینامه:
- به Dashboard > My Courses بروید.
- روی دوره تکمیل‌شده کلیک کنید و «دانلود گواهینامه» را انتخاب کنید.
- گواهینامه‌ها به‌صورت فایل PDF با نام، عنوان دوره و کد تأیید منحصربه‌فرد صادر می‌شوند.

تأیید گواهینامه: هر کسی می‌تواند با وارد کردن کد تأیید در kabullearn.com/verify گواهینامه را تأیید کند.`
  },
  {
    key: "guide-become-educator-fa",
    title: "چگونه در KabulLearn استاد یا سازنده کورس شوم",
    text: `استاد یا سازنده کورس شدن در KabulLearn

اگر می‌خواهید در KabulLearn استاد شوید یا کورس بسازید:
۱. ابتدا در kabullearn.com/register یک حساب رایگان دانش‌آموز بسازید.
۲. پس از ورود، از تنظیمات حساب یا صفحه اصلی درخواست دسترسی استاد بدهید.
۳. ادمین درخواست شما را بررسی می‌کند. پس از تأیید، برای شما اطلاعیه فرستاده می‌شود.
۴. بعد از تأیید، حساب شما به حساب استاد ارتقا می‌یابد و به Educator Portal دسترسی پیدا می‌کنید.

برای ساختن کورس:
۱. در Educator Portal روی «New course» کلیک کنید.
۲. عنوان، توضیح و سطح کورس را وارد کنید.
۳. ماژول‌ها و درس‌ها را داخل کورس اضافه کنید.
۴. درس‌ها می‌توانند درس ویدیویی یا درس خواندنی/متنی باشند.
۵. در پایان هر ماژول یک Quiz lesson اضافه کنید؛ این برای پیشرفت شاگردان و گواهینامه ضروری است.
۶. وقتی کورس آماده شد، آن را برای بررسی ادمین ارسال کنید. پس از تأیید، کورس منتشر می‌شود.

می‌توانید محتوای کورس را به انگلیسی، پشتو و دری اضافه کنید.`
  },
  {
    key: "guide-language-fa",
    title: "پشتیبانی زبانی — دری، پشتو، انگلیسی",
    text: `پشتیبانی زبانی در KabulLearn

KabulLearn از سه زبان پشتیبانی می‌کند: انگلیسی، پشتو (پښتو) و دری.

برای تغییر زبان: از دکمه تغییر زبان در منوی بالا استفاده کنید (EN / پښ / دری).
پشتو و دری به‌طور خودکار راست‌به‌چپ (RTL) نمایش داده می‌شوند.

محتوای دوره به زبان‌هایی که مدرس اضافه کرده موجود است.
اگر دوره‌ای محتوای دری یا پشتو داشته باشد، به‌طور خودکار به زبان انتخابی شما نمایش داده می‌شود.`
  },
  {
    key: "guide-progress-fa",
    title: "پیشرفت درس و باز کردن ماژول در KabulLearn",
    text: `ردیابی پیشرفت و باز کردن ماژول در KabulLearn

KabulLearn پیشرفت شما را به‌طور خودکار ردیابی می‌کند:
- تماشای درس ویدیویی و کلیک روی «علامت‌گذاری به‌عنوان تکمیل‌شده» آن را تمام‌شده نشان می‌دهد.
- خواندن درس خواندنی و کلیک روی «علامت‌گذاری به‌عنوان تکمیل‌شده» آن را تمام‌شده نشان می‌دهد.
- قبولی در آزمون پایان ماژول، ماژول بعدی را باز می‌کند.

قفل ماژول: باید آزمون ماژول فعلی را بگذرانید تا به ماژول بعدی دسترسی داشته باشید.
پیشرفت شما ذخیره می‌شود تا از هر دستگاهی ادامه دهید.`
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

function languageBlock(label: string, parts: Array<string | null | undefined>) {
  const text = parts.filter((part) => part?.trim()).join("\n\n");
  return text ? `## ${label}\n${text}` : "";
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
      titlePs: true,
      titleDa: true,
      descriptionEn: true,
      descriptionPs: true,
      descriptionDa: true,
      readingEn: true,
      readingPs: true,
      readingDa: true,
      module: {
        select: {
          titleEn: true,
          titlePs: true,
          titleDa: true,
          course: { select: { id: true, titleEn: true, titlePs: true, titleDa: true } }
        }
      }
    }
  });

  const activeLessonKeys: string[] = [];
  for (const lesson of lessons) {
    const sourceKey = `${lesson.module.course.id}:${lesson.id}`;
    const text = [
      languageBlock("English", [
        `Course: ${lesson.module.course.titleEn}`,
        `Module: ${lesson.module.titleEn}`,
        `Lesson: ${lesson.titleEn}`,
        lesson.descriptionEn,
        lesson.readingEn
      ]),
      languageBlock("Pashto", [
        `کورس: ${lesson.module.course.titlePs}`,
        `ماډیول: ${lesson.module.titlePs}`,
        `درس: ${lesson.titlePs}`,
        lesson.descriptionPs,
        lesson.readingPs
      ]),
      languageBlock("Dari", [
        `کورس: ${lesson.module.course.titleDa ?? lesson.module.course.titleEn}`,
        `ماژول: ${lesson.module.titleDa ?? lesson.module.titleEn}`,
        `درس: ${lesson.titleDa ?? lesson.titleEn}`,
        lesson.descriptionDa,
        lesson.readingDa
      ])
    ].filter(Boolean).join("\n\n");

    if (!text.trim()) continue;
    await upsertEmbedding(
      "lesson",
      sourceKey,
      [lesson.titleEn, lesson.titlePs, lesson.titleDa].filter(Boolean).join(" / "),
      text
    );
    activeLessonKeys.push(sourceKey);
    counts.lessons++;
  }

  await db.contentEmbedding.deleteMany({
    where: {
      source: "lesson",
      sourceKey: { notIn: activeLessonKeys }
    }
  });

  // ── 2. Courses ────────────────────────────────────────────────
  const courses = await db.course.findMany({
    select: {
      id: true,
      titleEn: true,
      titlePs: true,
      titleDa: true,
      descriptionEn: true,
      descriptionPs: true,
      descriptionDa: true,
      level: true
    }
  });

  for (const course of courses) {
    const text = [
      languageBlock("English", [
        `Course: ${course.titleEn}`,
        course.level ? `Level: ${course.level}` : "",
        course.descriptionEn
      ]),
      languageBlock("Pashto", [
        `کورس: ${course.titlePs}`,
        course.level ? `کچه: ${course.level}` : "",
        course.descriptionPs
      ]),
      languageBlock("Dari", [
        `کورس: ${course.titleDa ?? course.titleEn}`,
        course.level ? `سطح: ${course.level}` : "",
        course.descriptionDa
      ])
    ].filter(Boolean).join("\n\n");

    await upsertEmbedding(
      "course",
      course.id,
      [course.titleEn, course.titlePs, course.titleDa].filter(Boolean).join(" / "),
      text
    );
    counts.courses++;
  }

  // ── 3. Terms of Service + Privacy Policy ─────────────────────
  for (const locale of ["en", "ps", "fa"] as const) {
    const info = getPublicInfoContent(locale);

    for (let i = 0; i < info.terms.sections.length; i++) {
      const section = info.terms.sections[i];
      const paragraphs = section.paragraphs?.join("\n\n") ?? "";
      const bullets = section.bullets?.join("\n") ?? "";
      const text = `Terms of Service — ${section.title}\n\n${paragraphs}${bullets ? "\n\n" + bullets : ""}`;
      const sourceKey = locale === "en" ? `section-${i}` : `${locale}-section-${i}`;
      await upsertEmbedding("terms", sourceKey, `Terms: ${section.title}`, text);
      counts.policy++;
    }

    for (let i = 0; i < info.privacy.sections.length; i++) {
      const section = info.privacy.sections[i];
      const paragraphs = section.paragraphs?.join("\n\n") ?? "";
      const bullets = section.bullets?.join("\n") ?? "";
      const text = `Privacy Policy — ${section.title}\n\n${paragraphs}${bullets ? "\n\n" + bullets : ""}`;
      const sourceKey = locale === "en" ? `section-${i}` : `${locale}-section-${i}`;
      await upsertEmbedding("privacy", sourceKey, `Privacy: ${section.title}`, text);
      counts.policy++;
    }
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
